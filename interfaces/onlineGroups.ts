import { DefaultErrorResponse, DefaultRequest, DefaultSuccessResponse, Onlinegroup, OnlinegroupsOpen } from "./defaults";

export interface Request extends DefaultRequest { };

export interface Success extends DefaultSuccessResponse {
    onlinegroups: Onlinegroup[];
    onlinegroups_open: OnlinegroupsOpen[];
};

export interface Failure extends DefaultErrorResponse { };