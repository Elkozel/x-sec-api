import { DefaultRequest, DefaultErrorResponse, DefaultSuccessResponse } from "./defaults";

var URL: string = "/Bookings/AddReservationBooking";
export { URL };

export interface Request extends DefaultRequest {
    product_id: string;
    start_date: string;
    end_date: string;
    price: string;
};

export interface Success extends DefaultSuccessResponse{
    booking_id: number;
};

export interface Failure extends DefaultErrorResponse { };