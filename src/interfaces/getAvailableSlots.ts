import { DefaultRequest, DefaultErrorResponse, DividedSlot, EmptySlot } from "./defaults";

var URL: string = "/bookings/getAvailableSlots";
export { URL };

export interface Request extends DefaultRequest {
    product_id: string;
    date: string;
};

export interface Success {
    Message: string;
    Server_time: string;
    Empty_slots: EmptySlot[];
    Divided_slots: DividedSlot[];
    Prep_time: string;
    Dism_time: string;
    Slot_size: string;
    Slot_price: string;
    Min_participants: string;
    Online_tennis: string;
};

export interface Failure extends DefaultErrorResponse { };