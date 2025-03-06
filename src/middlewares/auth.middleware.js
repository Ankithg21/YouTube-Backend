import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import jwt from "jsonwebtoken";
import { User } from "../models/user.model.js";

// verifyJWT is a middleware function.
// verifyJWT is used to verify the JWT token.
export const verifyJWT = asyncHandler(async (req, res, next)=>{
    try {
        // token is taken from the cookies.
        // token is taken from the Authorization header.
        // Bearer is removed from the token.
        // Bearer is defined as a prefix for the token
        const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer","");
        // if token is not present, then throw an error.
        if(!token){
            throw new ApiError(401, "Unauthorized");
        }
        // jwt.verify is used to verify the token.
        // token is verified using the ACCESS_TOKEN_SECRET.
        const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
        // User is found by the id present in the token.
        // password and refreshToken are excluded from the user.
        const user = await User.findById(decodedToken?._id).select(
            "-password -refreshToken"
        );
        // if user is not present, then throw an error.
        if(!user){
            throw new ApiError(401, "invalid Token");
        }
        req.user = user;
        next();
    } catch (error) {
        throw new ApiError(401, error?.message || "invalid Access Token");
    }
});