import { Router } from "express";
import { registerUser } from "../controllers/user.controller.js";
import {upload} from "../utils/multer.js";
const router = Router();


// route is used to register the user.
// route is a post request.
router.route("/register").post(
    upload.fields([
        {
            name:"avatar",
            maxCount:1
        },
        {
            name:"coverImage",
            maxCount:1
        }
    ]),
    registerUser
);

export default router;