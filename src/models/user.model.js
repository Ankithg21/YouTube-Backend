import mongoose,{Schema, trusted} from "mongoose";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

//userSchema is the schema for the user model.
const userSchema = new Schema({
    username:{
        type:String,
        required:true,
        unique:true,
        lowercase:true,
        trim:trusted,
        index:true,
    },
    email:{
        type:String,
        required:true,
        unique:true,
        lowercase:true,
        trim:true,
    },
    fullName:{
        type:String,
        required:true,
        trim:true,
    },
    avatar:{
        type:String,
        required:true,
    },
    coverImage:{
        type:String,
    },
    watchHistory:[
        {
            type:Schema.Types.ObjectId,
            ref:"Video",
        }
    ],
    password:{
        type:String,
        required:[true, "Password is required."]
    },
    refereshToken:{
        type:String,
    }
},{
    timestamps:true,
});

// pre is a middleware that runs before the save method. 
// so now we are hashing the password before saving it to the database.
// this is done to secure the password.
// we are using bcrypt to hash the password.
// am using 10 as the salt value.
userSchema.pre("save", async function(next){
    if(!this.isModified("password"))return next();
    this.password = await bcrypt.hash(this.password, 10);
    next();
});

//checking whether the password is correct or not.
//isPasswordCheck is a custom method that we are adding to the userSchema.
// this method will be used to check whether the password is correct or not.
userSchema.models.isPasswordCheck = async function(password){
    return await bcrypt.compare(password,this.password);
};

// generateAccessToken is a custom method that we are adding to the userSchema.
// this method will be used to generate the access token.
// we are using jwt to generate the access token.
// we are using the _id, email, username, fullName as the payload.
// we are using the ACCESS_TOKEN_SECRET as the secret.
// we are using the ACCESS_TOKEN_EXPIRY as the expiry time.
// we are returning the access token.
// this access token will be used to authenticate the user.
// this access token will be used to authorize the user.
userSchema.methods.generateAccessToken = function(){
    return jwt.sign(
        {
            _id:this._id,
            email:this.email,
            username:this.username,
            fullName:this.fullName,
        },
        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn:process.env.ACCESS_TOKEN_EXPIRY
        }
    )
};

// generateRefreshToken is a costom method that we are adding to the userSchema.
// this method will be used to generate the refresh token.
// we are using jwt to generate the refresh token.
// we are using the _id as the payload.
// we are using the REFRESH_TOKEN_SECRET as the secret.
// we are using the REFRESH_TOKEN_EXPIRY as the expiry time.
// we are returning the refresh token.
// payload is the data that we want to store in the token.
// secret is the secret key that we are using to sign the token.
userSchema.methods.generateAccessToken = function(){
    return jwt.sign(
        {
            _id:this._id,
        },
        process.env.REFRESH_TOKEN_SECRET,
        {
            expiresIn:process.env.REFRESH_TOKEN_EXPIRY
        }
    )
};

export const User=mongoose.model("User",userSchema);