import multer from "multer";
// multer is used to upload the file on the server.  
// Multer Configuration for file upload to local storage from the client side to the server side.
// multer.diskStorage is used to store the file on the disk.
// destination is used to set the path where the file is to be stored.
// cb is used to call the callback function.
// null is used to check if there is an error while storing the file on the disk.
// "./public/temp" is the path where the file is stored.
// filename is used to set the name of the file.
// file.originalname is used to get the original name of the file.
// cb is used to call the callback function.
// null us used to check if there is an error while storing the file on the disk.
// file.originalname is the original name of the file.
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, "./public/temp");
    },
    filename: function (req, file, cb) {
      cb(null, file.originalname);
    }
});
// storage is used to store the file on the disk
// storage is set to the storage object.
const upload = multer({storage});
export default upload;