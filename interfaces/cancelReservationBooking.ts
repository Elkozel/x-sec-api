import { DefaultRequest, DefaultErrorResponse, DefaultSuccessResponse, Booking } from "./defaults";

var URL: string = "/bookings/CancelReservationBooking";
export { URL };

export interface Request extends DefaultRequest {
    booking_id: string;
 };

export interface Success extends DefaultSuccessResponse {
    mybookings: Booking[];
};

export interface Failure extends DefaultErrorResponse { };