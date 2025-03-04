//importing pakages from node_modules.
import connectDB from "./db/index.js";
import dotenv from "dotenv";


//configuring the environment variables(Specifing where .env file is present).
dotenv.config({
    path:"./.env"
});

//connection to the database.
connectDB();

