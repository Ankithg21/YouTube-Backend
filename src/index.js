//importing pakages from node_modules.
import connectDB from "./db/index.js";
import dotenv from "dotenv";
import {app} from "./app.js";


//configuring the environment variables(Specifing where .env file is present).
// dotenv.config is used to configure the environment variables.
// path is used to specify the path of the .env file.
dotenv.config({
    path:"./.env"
});

//connection to the database.
//connectDB is a function which is used to connect to the database.
connectDB().then(()=>{
    app.listen(process.env.PORT || 7777, ()=>{
        console.log(`Server is running on PORT: ${process.env.PORT}`);
    })
}).catch((error)=>{
    console.log("Connection to DB failed!.",error);
    process.exit(1);
});

