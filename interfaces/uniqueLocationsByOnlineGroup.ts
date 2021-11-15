import { DefaultRequest, DefaultErrorResponse, DefaultSuccessResponse, Uniquelocationsbyonlinegroup } from "./defaults";

var URL: string = "/bookings/UniqueLocationsByOnlineGroup";
export { URL };

export interface Request extends DefaultRequest {
    onlinegroup: string;
};

export interface Success extends DefaultSuccessResponse {
    uniquelocationsbyonlinegroup: Uniquelocationsbyonlinegroup[];
    uniquelocationsbyonlinegroup_open: any[];
};

export interface Failure extends DefaultErrorResponse { };