// ApiError class to handle errors from the server.
// statusCode is used to set the status of the response.
// message is used to set the message os the response.
// errors is used to set the errors of the respnse.
// stack is used to set the stack of the response.
// super is used to call the parent class constructor.
// this.statusCode is used to set the status code of the response.
// Error.captureStackTrace is used to capture the stack trace of the error.
// if stack is not null, then set the stack of the response.
class ApiError extends Error {
    // constructor is used to initialize the class.
    constructor(
        statusCode,
        message="Something went wrong",
        errors=[],
        stack=""
    ){
        // calling the parent class constructor.
        // setting the status code, message, data, success, errors.
        super(message);
        this.statusCode=statusCode;
        this.message=message;
        this.data=null;
        this.success=false;
        this.errors=errors;
        // if stack is provided, then set the stack.
        // else capture the stack trace.
        if(stack){
            this.stack=stack;
        }else{
            // capturing the stack trace.
            Error.captureStackTrace(this,this.constructor);
        }
    }
};
// export ApiError class.
export {ApiError};