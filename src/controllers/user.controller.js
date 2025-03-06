import {asyncHandler} from "../utils/asyncHandler.js";
import {ApiError} from "../utils/ApiError.js";
import {User} from "../models/user.model.js";
import {uploadOnCloudinary} from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";

const generateAccessAndRefreshTokens = async (userId)=>{
    try {
        // find the user by userId
        const user = await User.findById(userId);
        // Access Token is generated using the generateAccessToken method.
        const accessToken= user.generateAccessToken();
        // Refresh Token is generated using the generateRefreshToken method.
        const refreshToken = user.generateRefreshToken();
        // Refresh Token is saved in the database.
        user.refreshToken = refreshToken;
        // user is saved in the database.
        // validateBeforeSave is set to false to avoid validation errors.
        await user.save({validateBeforeSave:false});
        // return the Access Token and Refresh Token.
        return {accessToken, refreshToken};
    } catch (error) {
        // if there is an error, then throw an error.
        // error is thrown with the status code and the message.
        throw new ApiError(500, "Something went wrong while generating the tokens");
    }
};

const registerUser = asyncHandler(async (req, res)=>{
    //take input from users.
    const {fullName, email, username, password}=req.body;
    // check if all fields are provided(validation checking).
    if(
        [fullName,email,username,password].some((field)=>field?.trim()==="")
    ){
        throw new ApiError(400, "All fields are required");
    }
    // check is the user already exists in the database.
    const existedUser = await User.findOne({
        $or:[{ username },{ email }]
    });
    // if the user already exists, then throw an error.
    if(existedUser){
        throw new ApiError(409, "User already exists");
    }
    // get the local path of the avatar and coverImage.
    // req.files is used to get the files from the request.
    // req.files.avatar[0].path is used to get the path of the avatar file.
    // req.files.coverImage[0].path is used to get the path of the coverImage file.
    // avatarLocalPath is used to store the path of the avatar file.
    const avatarLocalPath = req.files?.avatar[0]?.path;
    // coverImageLocalPath is used to store the path of the coverImage file.
    // req.files is used to get the files from the request.
    // Array.isArray is used to check if the coverImage is an array or not.
    // res.files.coverImage.length is used to check the length of the coverImage.
    // req.files.coverImage[0].path is used ot get the path of the coverImage file.
    let coverImageLocalPath;
    if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0){
        coverImageLocalPath = req.files.coverImage[0].path;
    }
    // check if avatarLocalPath is provided.
    // if avatarLocalPath is not provided, then throw an error.
    if(!avatarLocalPath){
        throw new ApiError(400, "Avatar file is required");
    }
    // upload avatarLocalPath on cloudinary.
    const avatar = await uploadOnCloudinary(avatarLocalPath);
    // upload coverImageLocalPath on cloudinary.
    const coverImage = await uploadOnCloudinary(coverImageLocalPath);
    // if avatar is not provided, then throw an error.
    if(!avatar){
        throw new ApiError(400, "Avatar file is required");
    }
    // create a new user.
    // user is created with the provided fields.
    const user = await User.create({
        fullName,
        avatar:avatar.url,
        coverImage:coverImage?.url || "",
        email,
        password,
        username:username.toLowerCase(),
    });
    // if user is not created, then throw an error.
    // if user is created successfully, then send the response.
    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )
    // if the user is not created, then throw an error.
    if(!createdUser){
        throw new ApiError(500, "Something went wrong while registering the User.");
    }
    // if the user is created successfully, then send the response.
    // response is sent in json format.
    // response contains the status code, created user and the message.
    return res.status(201).json(
        new ApiResponse(200, createdUser, "User registered Successfully.")
    )
});

const loginUser = asyncHandler(async (req,res)=>{
    // take input from the users.
    const {email, username, password}=req.body;
    // check if email and username are provided.
    if(!email && !username){
        throw new ApiError(400, "Email or Username is required");
    }
    // check if the user exists in the database.
    const user = await User.findOne({
        $or:[{ email },{ username }]
    });
    // if the user does not exist, then throw an error.
    if(!user){
        throw new ApiError(404, "User not found");
    }
    // check if password is correct.
    const isPasswordValid = await user.isPasswordCorrect(password);
    if(!isPasswordValid){
        throw new ApiError(401, "Invalid Credentials");
    }
    // generate the access and refresh tokens.
    const {accessToken, refreshToken} = await generateAccessAndRefreshTokens(user._id);
    // loggedInUser is used to get the user from the database.
    // user._id is used to get the user by id.
    // select is used to select the fields that we want to get.
    // -password is used to exclude the password field.
    // -refreshToken is used to excude the refreshToken field.
    const loggedInUser = await User.findById(user._id).select(
        "-password -refreshToken"
    );
    // options is used to set the options for the cookie.
    // httpOnly is set to true to prevent the cookie from being accessed by client-server.
    // secure is set to true to ensure that the cookie is sent.
    const options ={
        httpOnly:true,
        secure:true,
    };
    // response is sent in json format.
    // response contains the status code, loggedInUser, AccessToken and RefreshToken.
    // AccessToken and RefreshToken are set as cookies.
    // .cookie("accessToken", AccessToken, options) is used to set the AccessToken as a cookie.
    // .cookie("refreshToken", RefreshToken, options) is used to set the RefreshToken as a cookie.
    // ApiResponse is used to send the response in a specific format.
    // user:loggedInUser is used to send the loggedInUser in the response.
    return res.status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
        new ApiResponse(
            200,{
                user:loggedInUser,
                accessToken,
                refreshToken
            }
        )
    )
});

const logoutUser = asyncHandler(async (req,res)=>{
    // user is updated by the id.
    // refreshToken is set to undefined.
    // new is set to true to get the updated user.
    // user is updated in the database.
    await User.findByIdAndUpdate(
        // req.user._id is used to get the user by id.
        req.user._id,
        {
            $set:{
                refreshToken:undefined
            }
        },
        {
            // new is set to true to get the updated user.
            new:true,
        }
    )
    // options is used to set the options for the cookie.
    const options ={
        httpOnly:true,
        secure:true,
    };
    return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(
        new ApiResponse(200, {}, "User logged out successfully.")
    )
});

const refreshAccessToken = asyncHandler(async (req,res)=>{
    const incomingRefreshToken = req.cookies.refreshToken;
    if(!incomingRefreshToken){
        throw new ApiError(401, "Unauthorized");
    }
    try {
        const decodedToken = jwt.verify(
            incomingRefreshToken,
            process.env.ACCESS_TOKEN_SECRET,
    
        )
        const user = await User.findById(decodedToken?._id);
        if(!user){
            throw new ApiError(401, "invalid refresh token");
        }
        if(user?.refreshToken !== incomingRefreshToken){
            throw new ApiError(401, "Refresh token is Expired.");
        }
        const options ={
            httpOnly:true,
            secure:true,
        }
        const {accessToken, newRefreshToken} = await generateAccessAndRefreshTokens(user._id);
        return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", newRefreshToken, options)
        .json(
            new ApiResponse(200, {accessToken, refreshToken:newRefreshToken}, "Access token Refreshed.")
        )
    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid Refresh Token");
    }
});

export {registerUser, loginUser, logoutUser};