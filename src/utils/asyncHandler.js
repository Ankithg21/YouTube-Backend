// asyncHandler is used to handle the asynchronous functions.
// asyncHandler is a middleware function that is used to handle the asynchronous functions.
// asyncHandler takes a function as an argument.
// status is used to set the status of the response.
// json is used to send the response in json format.
// try is used to try the function.
// await is used to wait for the response of the function.
// if an error occurs, then the error is cought and the error message is sent in the response.
// message is used to send the error message.
// success is used to check if the function is successfull or not.


const asyncHandler = (requestHandler)=>{
    return (req,res,next)=>{
        Promise.resolve(requesthandler(req,res,next)).catch
        ((err)=> next(err));
    }
};

export {asyncHandler};

//or use the below altenative code.

// const asyncHandler=(fn)=>async (req,res,next)=>{
//     try {
//         await fn(res,res,next);
//     } catch (error) {
//         res.status(error.code || 500).json({
//             message:error.message || "Something went wrong",
//             success:false
//         })
//     }
// }