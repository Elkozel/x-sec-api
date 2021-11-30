import { DefaultRequest, DefaultErrorResponse, Product } from "./defaults";

var URL: string = "/bookings/getProductById";
export { URL };

export interface Request extends DefaultRequest {
    Product_id: string;
};

export interface Success {
    Product_exists: boolean;
    Product: Product;
};

export interface Failure extends DefaultErrorResponse { };