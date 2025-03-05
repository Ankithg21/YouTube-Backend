import { v2 as cloudinary} from "cloudinary";
import fs from "fs";

// cloudinary configuration with api key, api secret and cloud name from .env file.
// cloudinary.config is used to configure cloudinary with api key, api secret and cloud name.
// process.env.CLOUDINARY_CLOUD_NAME, process.env.CLOUDINARY_API_KEY, process.env.CLOUDINARY_API_SECRET are used to get the values from .env file.
// cloud name is used t identify the cloudinary account.
// api key and api secret are used to authenticate the user.
// v2 is used to access the cloudinary api.
cloudinary.config({ 
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
    api_key: process.env.CLOUDINARY_API_KEY, 
    api_secret: process.env.CLOUDINARY_API_SECRET
});

const uploadOnCloudinary = async (localFilePath)=>{
    try {
        // if localFilePath is null, then return null.
        if(!localFilePath)return null;
        // Upload file on Cloudinary.
        // cloudinary.uploader.upload is used to upload the file on cloudinary.
        // localFilePath is the path of the file which is to be uploaded.
        // resource_type is set to auto to automatically detect the type of file.
        // result is used to store the response of the uploaded file.
        // await is used to wait for the response of the uploaded file.
        // if the file is uploaded successfully, then the url of the uploaded file is printed.
        // return result is used to return the result of the uploaded file.
        // if an error occurs while uploadin the file, then the error is caught and the file is deleted from the local storage.
        const result = await cloudinary.uploader.upload(localFilePath,{
            resource_type:"auto"
        });
        // file uploaded successfully.
        // url of the uploaded file is printed.
        // result.url is used to get the url of the uploaded file.
        console.log("File uploaded successfully.",result.url);
        // result is returned.
        return result;
    } catch (error) {
        // An error occured while uploading file.
        // ensure to delete the local file after uploading.
        // fs.inlinkSync is used to delete the file from local storage.
        // localFilePath is the path of the file which is to be deleted.
        fs.unlinkSync(localFilePath);
        return null;
    }
}

export {uploadOnCloudinary};