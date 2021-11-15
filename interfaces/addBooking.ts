import { DefaultRequest, DefaultErrorResponse, DefaultSuccessResponse, Schedule } from "./defaults";

var URL: string = "/bookings/addBooking";
export { URL };

export interface Request extends DefaultRequest {
    booking_id: string;
};

export interface Success extends DefaultSuccessResponse { };

export interface Failure extends DefaultErrorResponse { };