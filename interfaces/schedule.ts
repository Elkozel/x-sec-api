import { DefaultRequest, DefaultErrorResponse, DefaultSuccessResponse, Schedule } from "./defaults";

var URL: string = "/bookings/schedule";
export { URL };

export interface Request extends DefaultRequest {
    trainer: string;
    onlinegroup: string;
    cmsid: string;
    amount_of_days: number;
    site: string;
};

export interface Success extends DefaultSuccessResponse {
    schedule: Schedule[];
};

export interface Failure extends DefaultErrorResponse { };