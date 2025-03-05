import {asyncHandler} from "../utils/asyncHandler.js";
import {ApiError} from "../utils/ApiError.js";
import {User} from "../models/user.model.js";
import {uploadOnCloudinary} from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";

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
    // coverImageLocalPath is used to store the path of the coverImage file
    const avatarLocalPath = req.files?.avatar[0]?.path;
    const coverImageLocalPath = req.files?.coverImage[0]?.path;
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
    // adding 
    const user = await User.create({
        fullName,
        avatar:avatar.url,
        coverImage:coverImage?.url || "",
        email,
        password,
        username:username.toLowerCase(),
    });
    // 
    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )
    // 
    if(!createdUser){
        throw new ApiError(500, "Something went wrong while registering the User.");
    }
    return res.status(201).json(
        new ApiResponse(200, createdUser, "User registered Successfully.");
    )
});

export {registerUser};