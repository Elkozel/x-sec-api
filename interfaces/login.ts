import { DefaultErrorResponse, DefaultRequest, DefaultSuccessResponse, User } from "./defaults";

var URL: string = "/users/login";
export { URL };

export interface Request extends DefaultRequest {
    remember: boolean;
    pushid: string;
};

export interface Success extends DefaultSuccessResponse {
    user: User;
};

export interface Failure extends DefaultErrorResponse { };