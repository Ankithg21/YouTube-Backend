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
    // Extracts the refreshToken from cookies (req.cookies.refreshToken)
    const incomingRefreshToken = req.cookies.refreshToken;
    // If there is no refresh token, it throws a 401 Unauthorized error
    if(!incomingRefreshToken){
        throw new ApiError(401, "Unauthorized");
    }
    try {
        // Verifies the refresh token using jwt.verify()
        // It decodes the token and extracts user information
        // Uses process.env.ACCESS_TOKEN_SECRET as the secret key for verification
        const decodedToken = jwt.verify(
            incomingRefreshToken,
            process.env.ACCESS_TOKEN_SECRET,
    
        )
        // Fetches the user from the database using the _id from the decoded token.
        const user = await User.findById(decodedToken?._id);
        // If no user is found, it throws a 401 Unauthorized error.
        if(!user){
            throw new ApiError(401, "invalid refresh token");
        }
        // Compares the refresh token stored in the database (user.refreshToken) with the incomingRefreshToken.
        // If they don't match, it rejects the request with a 401 Unauthorized error.
        if(user?.refreshToken !== incomingRefreshToken){
            throw new ApiError(401, "Refresh token is Expired.");
        }
        // httpOnly: true → Prevents client-side JavaScript from accessing the cookies (security feature).
        // secure: true → Ensures cookies are only sent over HTTPS.
        const options ={
            httpOnly:true,
            secure:true,
        }
        const {accessToken, newRefreshToken} = await generateAccessAndRefreshTokens(user._id);
        // Sends the new tokens as HTTP-only cookies to the client.
        return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", newRefreshToken, options)
        .json(
            new ApiResponse(200, {accessToken, refreshToken:newRefreshToken}, "Access token Refreshed.")
        )
    } catch (error) {
        // If any error occurs, it throws a 401 Unauthorized error with the relevant message.
        throw new ApiError(401, error?.message || "Invalid Refresh Token");
    }
});

const changeCurrentPassword = asyncHandler(async(req,res)=>{
    // Extracts oldPassword and newPassword from the request body (req.body).
    const {oldPassword, newPassword} = req.body;
    // Retrieves the current logged-in user using req.user?._id, which is likely set by authentication middleware.
    const user = await User.findById(req.user?._id);
    // Calls user.isPasswordCorrect(oldPassword), which is a method on the User model that likely compares the provided password with the hashed password in the database.
    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword);
    // If the old password is incorrect, it throws a 400 Bad Request error: "Invalid old Password."
    if(!isPasswordCorrect){
        throw new ApiError(400, "Invalid old Password.");
    }
    // Updates the password by assigning newPassword to user.password
    user.password = newPassword;
    // Calls user.save() to store the new password in the database.
    // { validateBeforeSave: false } prevents unnecessary validations, but the password should still be hashed before saving.
    await user.save({validateBeforeSave:false});
    // Sends a 200 OK response.
    return res.status(200).json(
        new ApiResponse(200, {}, "Password Changed Successfully.")
    )
});

const getCurrentUser = asyncHandler(async(req,res)=>{
    return res
    .status(200)
    .json(
        200,req.user,"Current user fetched Successfully."
    )
});

const updateAccountDetails = asyncHandler(async(req,res)=>{
    // Extracts fullName and email from the request body (req.body)
    const {fullName, email} = req.body;
    // If both fullName and email are missing, it throws a 400 Bad Request error with the message "All fields are required."
    if(!fullName && !email){
        throw new ApiError(400, "All fields are required.");
    }
    // Finds the user by their ID (req.user?._id), which is likely extracted from authentication middleware.
    // Uses $set to update the fullName and email fields in the database.
    // The { new: true } option returns the updated user document instead of the old one.
    // .select("-password") ensures the password field is excluded from the returned user object.
    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set:{
                fullName:fullName,
                email:email,
            }
        },
        {new:true}
    ).select("-password");
    return res
    .status(200)
    .json(
        new ApiResponse(200, user, "Account details updated Successfully.")
    );
});


const updateUserAvatar = asyncHandler(async(req,res)=>{
    // It attempts to retrieve the file path of the uploaded avatar from req.file?.path
    // The optional chaining (?.) ensures that if req.file is undefined, it won’t cause an error
    const avatarLocalPath = req.file?.path;
    // if avatarLocalPath does not exit, then throw an ApiError.
    if(!avatarLocalPath){
        throw new ApiError(400, "Avatar file is missing.");
    }
    // Calls uploadOnCloudinary(avatarLocalPath), an async function, to upload the file to Cloudinary (a cloud-based image storage service)
    const avatar = await uploadOnCloudinary(avatarLocalPath);
    // if avatar.url does not exit, then throw an ApiError.
    if(!avatar.url){
        throw new ApiError(400, "Error while uploading on Avatar.");
    }
    // Updates the avatar field of the user in the database using User.findByIdAndUpdate().
    // req.user?._id extracts the user’s ID from req.user (likely added by authentication middleware).
    // The $set operator updates only the avatar field.
    // { new: true } ensures that the function returns the updated user document.
    // .select("-password") removes the password field from the returned user object.
    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set:{
                avatar: avatar.url
            }
        },
        {new:true}
    ).select("-password");
    return res
    .status(200)
    .json(
        new ApiResponse(200, user, "Avatar image uploaded Sucessfully.")
    )
}); 

const updateUserCoverImage = asyncHandler(async(req,res)=>{
    const coverImageLocalPath = req.file?.path;
    if(!coverImageLocalPath){
        throw new ApiError(400, "Cover Image is missing.")
    }
    const coverImage = await uploadOnCloudinary(coverImageLocalPath);
    if(!coverImage.url){
        throw new ApiError(400, "Error while uploading cover image.")
    }
    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set:{
                coverImage:coverImage.url
            }
        },
        {new:true}
    ).select("-password");
    return res
    .status(200)
    .json(
        new ApiResponse(200, user, "Cover image uploaded Sucessfully.")
    )
});

export {
    registerUser, 
    loginUser, 
    logoutUser, 
    refreshAccessToken,
    changeCurrentPassword,
    getCurrentUser,
    updateUserAvatar,
    updateAccountDetails,
    updateUserCoverImage,
};