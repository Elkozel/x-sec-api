import { DefaultRequest, DefaultErrorResponse, Product } from "./defaults";

var URL: string = "/bookings/getProductsByOnlineGroup";
export { URL };

export interface Request extends DefaultRequest {
    online_group: string;
    site_id: number;
};

export interface Success {
    Products: Product[];
};

export interface Failure extends DefaultErrorResponse { };