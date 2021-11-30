import { DefaultErrorResponse, DefaultRequest, DefaultSuccessResponse, Onlinegroup, OnlinegroupsOpen } from "./defaults";

var URL: string = "/bookings/onlineGroups";
export { URL };

export interface Request extends DefaultRequest { };

export interface Success extends DefaultSuccessResponse {
    onlinegroups: Onlinegroup[];
    onlinegroups_open: OnlinegroupsOpen[];
};

export interface Failure extends DefaultErrorResponse { };