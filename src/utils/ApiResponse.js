// Api Response class to handle response from the server.
// constructor is used to initialize the class.
// statusCode is used to set the status of the response.
// message is used to set the message of the response.
// data is used to set the data of the response.
// success is used to check if the response is successfull or not.
class ApiResponse {
    constructor(statusCode,message="Success",data){
        this.statusCode=statusCode;
        this.message=message;
        this.data=data;
        this.success=statusCode < 400;
    }
}

export {ApiResponse};
