import axios, { AxiosInstance } from "axios";
import { extend, format } from 'date-and-time';
import * as fs from "fs";
import { version } from "process";

const sensitiveData = JSON.parse(fs.readFileSync("data/sensitive.json", "UTF-8"));

const DEFAULT_URL: string = sensitiveData.URL;
const DEFAULT_VERSION: string = sensitiveData.version;

/**
 * Namespace for useless interfaces
 */
namespace APIClient {
    export interface DefaultResponse {
        response: number,
        message: string
    }

    export interface DefaultErrorResponse {
        response: number,
        error: {
            reason: string,
            message: string
        },
        code: number,
        message: string
    }

    export interface OnlineGroup {
        online_group: string
    }

    export interface OnlineGroupsResponse {
        response: number,
        message: string,
        onlinegroups?: OnlineGroup[]
        onlinegroups_open?: OnlineGroup[]
    }

    export interface Product {
        Product_id: string,
        Description: string,
        Type?: number,
        Admin_code?: string,
        Price?: string,
        Category_1_price?: string,
        Category_2_price?: string,
        Category_3_price?: string,
        Prep_time?: string,
        Dism_time?: string,
        Slot_size?: string,
        Max_participants?: string
    }

    export interface ProductByIdResponse {
        Product_exists: string,
        Product: Product
    }

    export interface Slot {
        Start_date: string,
        End_date: string
    }

    export interface AvailableSpotsResponse {
        Message: string,
        Server_time: string,
        Empty_slots: Slot[],
        Divided_slots: Slot[],
        Prep_time: string,
        Dism_time: string,
        Slot_size: string,
        Slot_price: string,
        Min_participants: string,
        Online_tennis: string,
    }

    /**
     * Represents a Booking
     */
    export interface Booking {
        booking_id: string,
        bezetting: string,
        locatie: string,
        sportomschrijving: string,
        site: string,
        start_date: string,
        end_time: string,
        trainer: string,
        memo: string,
        online_all: string,
        amount: string,
        paid: string,
        start_time: string
    }
}

class APIClient {
    protected readonly customer_id: string;
    protected readonly license: string;
    protected readonly token: string;

    // The Axios Instance, which will be used to send the requests
    protected instance: AxiosInstance;

    /**
     * Constructs an API client
     * @param customer_id the ID of the customer (Usually a static ID, used by the product owners)
     * @param license the license of the customer (Usually a static ID, used by the product owners)
     * @param token the SAML token of the user
     * @param URL the URL of the API server
     * @param version the current version of the API
     */
    constructor(customer_id: string, license: string, token: string, URL = DEFAULT_URL, version = DEFAULT_VERSION) {
        this.customer_id = customer_id;
        this.license = license;
        this.token = token;

        this.instance = axios.create({
            baseURL: URL
        })

        // Usually the version is checked upon initializing, however one does not simply DOS when Debugging
        //this.checkVersion();
    }

    /**
     * Returns an Object with the minimal information required for a request plus the information from the additionally provided object
     * @param addition the additional information to be concatinated to the end result
     * @returns an object which contains both the basic information about a request and the additional information provided
     */
    getBaseJSON(addition: object = {}): { customer_id: string, license: string, token: string } {
        return {
            customer_id: this.customer_id,
            license: this.license,
            token: this.token,
            ...addition
        }
    }

    /**
     * Checks if the version of the API is complient with the current version
     * @returns an empty promise, just for simplicity
     */
    checkVersion(): Promise<void> {
        let data = {
            customer_id: this.customer_id,
            license: this.license,
            version: DEFAULT_VERSION
        }

        return this.instance.post("/users/CheckVersion", data)
            .then(res => {
                console.info(`Version was successfully checked (${res.data})`);
            })
            .catch(err => {
                throw new Error(this.GenerateErrorMsg(err));
            })
    }

    /**
     * Retrieves all Online Groups
     * @returns all online groups
     */
    onlineGroups(): Promise<APIClient.OnlineGroupsResponse> {
        let data = this.getBaseJSON({});

        return this.instance.post("/bookings/onlineGroups", data)
            .then(res => {
                // Deconstruct response
                let { response, message, onlinegroups, onlinegroups_open }: APIClient.OnlineGroupsResponse = res.data;

                // Log and return
                console.info(`[${res.status}] ${res.statusText}`);
                return res.data;
            })
            .catch(err => {
                throw new Error(this.GenerateErrorMsg(err));
            })
    }

    /**
     * Gets all products by online group
     * @param group The group to retrieve products for
     * @returns A Promise, which returns an array of Products
     */
    getProductsByOnlineGroup(group: APIClient.OnlineGroup): Promise<APIClient.Product[]> {
        let data = this.getBaseJSON({
            online_group: group.online_group,
            site_id: 0
        });

        return this.instance.post("/bookings/getProductsByOnlineGroup", data)
            .then(res => {
                // Deconstruct response
                let { Products }: { Products: APIClient.Product[] } = res.data;

                // Log and return
                console.info(`[${res.status}] ${res.statusText}`);
                return res.data;
            })
            .catch(err => {
                throw new Error(this.GenerateErrorMsg(err));
            })
    }

    /**
     * Gets additional information about a product, based on its ID
     * @param product the product to retrieve the information for 
     * @returns A Promise, which returns the updated product with the additional information
     */
    getProductById(product: APIClient.Product): Promise<APIClient.Product> {
        let data = this.getBaseJSON({ Product_id: product.Product_id });

        return this.instance.post("/bookings/getProductById", data)
            .then(res => {
                // Deconstruct response
                let { Product_exists, Product }: APIClient.ProductByIdResponse = res.data;

                // Check if the product exists
                if (!Product_exists)
                    throw new Error(`[${res.status}] The product does not exist`);

                // Log and return
                console.info(`[${res.status}] ${res.statusText}`);
                return Product;
            })
            .catch(err => {
                throw new Error(this.GenerateErrorMsg(err));
            })
    }

    /**
     * Returns all available slots for a product on the specified date
     * @param product the product
     * @param date the date
     * @returns A Promise, which returns all available slots (and more info, please see interface AvailableSpotsResponse)
     */
    getAvailableSlots(product: APIClient.Product, date: Date = new Date()): Promise<APIClient.AvailableSpotsResponse> {
        let data = this.getBaseJSON({ Product_id: product.Product_id, date: format(date, "D-MM-YYYY") });

        return this.instance.post("/bookings/getAvailableSlots", data)
            .then(res => {
                // Deconstruct response
                let { Message, Server_time, Empty_slots, Divided_slots, Prep_time, Dism_time, Slot_size, Slot_price, Min_participants, Online_tennis }: APIClient.AvailableSpotsResponse = res.data;

                // Log and return
                console.info(`[${res.status}] ${res.statusText}`);
                return res.data;
            })
            .catch(err => {
                throw new Error(this.GenerateErrorMsg(err));
            })
    }

    /**
     * Adds a reservation for the product on the specified slot
     * @param slot The slot, which needs to be reserved
     * @param product The product, to which the slot belongs to
     * @returns An empty promise
     */
    addReservationBooking(slot: APIClient.Slot, product: APIClient.Product): Promise<void> {
        if (!product.Price)
            throw new Error(`[internal] Reserving slot (${slot.Start_date}-${slot.End_date}) failed, the product did not have a price (${product.Price})`);

        let data = this.getBaseJSON({
            start_date: slot.Start_date,
            end_date: slot.End_date,
            product_id: product.Product_id,
            price: product.Price
        });


        return this.instance.post("/Bookings/AddReservationBooking", data)
            .then(res => {
                // Deconstruct response
                let { response, message }: APIClient.DefaultResponse = res.data;

                // Log and return
                console.info(`[${res.status}] (${slot.Start_date}-${slot.End_date}) ${product.Description} ${message}`);
                return res.data;
            })
            .catch(err => {
                throw new Error(this.GenerateErrorMsg(err));
            })
    }

    /**
     * Adds a booking to the account of the user
     * @param booking the booking to be added
     * @returns A promise, which returns void ()
     */
    addBooking(booking: APIClient.Booking): Promise<void> {
        let data = this.getBaseJSON({ booking_id: booking.booking_id });

        return this.instance.post("/bookings/addBooking", data)
            .then(res => {
                // Deconstruct response
                let { response, message } = res.data;

                // Log and return
                console.info(`[${res.status}] ${message}`);
                return;
            })
            .catch(err => {
                throw new Error(this.GenerateErrorMsg(err));
            })
    }

    /**
     * Retrieves all bookings of the customer
     * @returns an array of Booking, representing each booking of the user
     */
    myBookings(): Promise<APIClient.Booking[]> {
        let data = this.getBaseJSON();

        return this.instance.post("/bookings/myBookings", data)
            .then(res => {
                // Deconstruct response
                let { response, message, mybookings } = res.data;

                // Log and return
                console.info(`[${res.status}] ${message}`);
                return mybookings;
            })
            .catch(err => {
                throw new Error(this.GenerateErrorMsg(err));
            })
    }

    /**
     * Cancels a booking
     * @param booking the booking to be canceled
     * @returns an empty promise
     */
    cancelBooking(booking: APIClient.Booking): Promise<void> {
        let data = this.getBaseJSON({ booking_id: booking.booking_id });

        return this.instance.post("/bookings/cancelBooking", data)
            .then(res => {
                // Deconstruct response
                let { response, message, mybookings } = res.data;

                // Log and return
                console.info(`[${res.status}] ${message}`);
                return;
            })
            .catch(err => {
                throw new Error(this.GenerateErrorMsg(err));
            })
    }

    /**
     * A simple way of logging errors from Axios requests, which did not recieve a response
     * @param err the error which was recieved from Axios
     */
    protected axiosErrorMsg(err: any): string {
        let axiosMessage = err.message;

        throw new Error(`Axios Error: ${axiosMessage}`);
    }

    /**
     * A simple way of logging errors from Axios requests, which did recieve a response
     * @param err the error which was recieved from Axios
     * @param apiError the API error, which was inside the Axios error
     */
    protected APIErrorMsg(err: any, apiError: APIClient.DefaultErrorResponse): string {
        let axiosMessage = err.message;

        throw new Error(`[${apiError.code}] API Error: ${apiError.error.message} (Axios Message: ${axiosMessage})`);

    }

    /**
     * A function wrapper for APIError or AxiosError
     * @param err The error from Axios
     * @returns The error message
     */
    protected GenerateErrorMsg(err: any): string {
        return (err.response) ? this.APIErrorMsg(err, err.response.data) : this.axiosErrorMsg(err);        
    }
}

let api = new APIClient(sensitiveData.customer_id, sensitiveData.license, sensitiveData.token);

api.checkVersion()
    .catch(err => {
        if (err)
            console.log(err);
    })
    .then(() => api.onlineGroups())
    .catch(err => {
        if (err)
            console.log(err);
    })
    .then(groups => {
        console.log(JSON.stringify(groups));
    })
    .catch(err => {
        if (err)
            console.log(err);
    })

