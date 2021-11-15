import { DefaultErrorResponse } from "./defaults";

var URL: string = "/users/CheckVersion";
export { URL };

export interface Request {
    license: string;
    customer_id: string;
    version: string;
};

export type Success = string;

export interface Failure extends DefaultErrorResponse { };
