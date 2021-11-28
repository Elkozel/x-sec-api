import { DefaultRequest, DefaultErrorResponse, DefaultSuccessResponse, Booking } from "./defaults";

var URL: string = "/bookings/myBookings";
export { URL };

export interface Request extends DefaultRequest { };

export interface Success extends DefaultSuccessResponse {
    mybookings: Booking[];
};

export interface Failure extends DefaultErrorResponse { };