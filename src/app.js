import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
const app=express();

// cors is used to allow the client to access the server.
// origin is set to the cors origin.
// credentials is set to true to allow the client to access the server.
app.use(cors({
    // cors origin is set to the environment variable.
    origin:process.env.CORS_ORIGIN,
    credentials:true
}));
// express.json is used to parse the json data.
// express.urlencoded is used to parse the url encoded data.
// express.static is used to serve the static files.
// cookieParser is used to parse the cookies.
// limit is used to limit the size of the data that can be sent.
// 16kb is the limit that we are setting.
// this is done to prevent the server from crashing.
app.use(express.json({limit:"16kb"}));
app.use(express.urlencoded({extended:true,limit:"16Kb"}));
app.use(express.static("public"));
app.use(cookieParser());

// Routes import.
import userRoutes from "./routes/user.routes.js";

// Routes Declaration.
app.use("/api/v1/users",userRoutes);

export {app};