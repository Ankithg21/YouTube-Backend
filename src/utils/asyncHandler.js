const asyncHandler=(fn)=>async (req,res,next)=>{
    try {
        await fn(res,res,next);
    } catch (error) {
        res.status(error.code || 500).json({
            message:error.message || "Something went wrong",
            success:false
        })
    }
}