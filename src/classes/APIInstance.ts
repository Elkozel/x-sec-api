import axios, { AxiosInstance } from "axios";
import { default as dayjs } from 'dayjs';
import * as Procedures from "../interfaces/interfaces";
import pino from "pino";
const logger = pino({
    name: "API"
})

export class APIInstance {
    protected readonly customer_id: string;
    protected readonly license: string;
    protected readonly token: string;
    protected readonly version: string = "1.0.0";

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
    constructor(customer_id: string, license: string, token: string, URL: string) {
        this.customer_id = customer_id;
        this.license = license;
        this.token = token;

        this.instance = axios.create({
            baseURL: URL
        });

        logger.debug(`An API instance was initiated for URL ${URL}`);
    }

    /**
     * Returns an Object with the minimal information required for a request plus the information from the additionally provided object
     * @param addition the additional information to be concatinated to the end result
     * @returns an object which contains both the basic information about a request and the additional information provided
     */
    getBaseJSON<Rq extends Procedures.DefaultRequest>(addition: object = {}): Rq {
        return {
            customer_id: this.customer_id,
            license: this.license,
            token: this.token,
            ...addition
        } as Rq
    }

    /**
     * Checks if the version of the API is complient with the current version
     * @returns void
     * @throws a VersionMismatched error when the version of the API is not accurate
     */
    async checkVersion(): Promise<Procedures.CheckVersion.Success> {
        let data: Procedures.CheckVersion.Request = {
            customer_id: this.customer_id,
            license: this.license,
            version: this.version
        }

        logger.debug("A version check was issued");

        let response = await this.instance.post<Procedures.CheckVersion.Success>(Procedures.CheckVersion.URL, data);
        let responseData = response.data;

        return responseData;
    }

    /**
     * Checks if the user is logged in
     * @returns the response from the server
     */
    async logIn(): Promise<Procedures.Login.Success> {
        let data = this.getBaseJSON<Procedures.Login.Request>({
            remember: false,
            pushid: "AppPushID"
        });

        logger.debug("A login is attempted");

        let response = await this.instance.post<Procedures.Login.Success>(Procedures.Login.URL, data);
        let responseData = response.data;

        logger.debug(`User ${responseData.user.first_name} ${responseData.user.last_name} was successfully logged in`);

        return responseData;
    }

    /**
     * Retrieves all Online Groups
     * @returns all online groups
     */
    async onlineGroups(): Promise<Procedures.OnlineGroups.Success> {
        let data = this.getBaseJSON<Procedures.OnlineGroups.Request>();

        logger.debug("Retrieving Online Groups");

        let response = await this.instance.post<Procedures.OnlineGroups.Success>(Procedures.OnlineGroups.URL, data);
        let responseData = response.data;

        return responseData;
    }

    /**
     * Gets all products by online group (for OnlinegroupsOpen)
     * @param group The group to retrieve products for
     * @param site_id the site at which the group is available
     * @returns A Promise, which returns an array of Products
     */
    async getProductsByOnlineGroup(group: Procedures.OnlinegroupsOpen, site_id: number = 0): Promise<Procedures.GetProductsByOnlineGroup.Success> {
        let data = this.getBaseJSON<Procedures.GetProductsByOnlineGroup.Request>({
            online_group: group.online_group,
            site_id: site_id
        });

        logger.debug(`Products for online group ${group} at site ${site_id} were requested`);

        let response = await this.instance.post<Procedures.GetProductsByOnlineGroup.Success>(Procedures.GetProductsByOnlineGroup.URL, data);
        let responseData = response.data;

        logger.debug(`${responseData.Products.length} Products were retrieved`);

        return responseData;
    }

    /**
     * Gets all products by online group (for OnlineGroup)
     * @param group The group to retrieve products for
     * @returns 
     */
    async UniqueLocationsByOnlineGroup(group: Procedures.Onlinegroup): Promise<Procedures.UniqueLocationsByOnlineGroup.Success> {
        let data = this.getBaseJSON<Procedures.UniqueLocationsByOnlineGroup.Request>({
            onlinegroup: group.online_group
        });

        logger.debug(`Unique locations for online group ${group} were requested`);

        let response = await this.instance.post(Procedures.UniqueLocationsByOnlineGroup.URL, data);
        let responseData: Procedures.UniqueLocationsByOnlineGroup.Success = response.data;

        logger.debug(responseData.message);

        return responseData;
    }

    /**
     * The function retrieves the schedule of a given group at a given site
     * @param group the group for which the API should retrieve the schedule
     * @param site the site at which the API should retrieve the schedule
     * @returns the schedule for a given group at a given site
     */
    async schedule(group: Procedures.Onlinegroup, site: string = "0", trainer: string = "", cmsid: string = "", amountOfDays: number = 365): Promise<Procedures.Schedule.Success> {
        let data = this.getBaseJSON<Procedures.Schedule.Request>({
            trainer: trainer,
            onlinegroup: group.online_group,
            cmsid: cmsid,
            amount_of_days: amountOfDays,
            site: site
        });

        logger.debug(`Schedule for online group ${group} was requested`);

        let response = await this.instance.post<Procedures.Schedule.Success>(Procedures.Schedule.URL, data);
        let responseData = response.data;

        logger.debug(responseData.message);

        return responseData;
    }

    /**
     * Gets additional information about a product, based on its ID
     * @param product the product to retrieve the information for 
     * @returns A Promise, which returns the updated product with the additional information
     */
    async getProductById(product: Procedures.Product): Promise<Procedures.GetProductById.Success> {
        let data = this.getBaseJSON<Procedures.GetProductById.Request>({ Product_id: product.Product_id });

        logger.debug(`Further information for product ${product.Description} was requested`);

        let response = await this.instance.post<Procedures.GetProductById.Success>(Procedures.GetProductById.URL, data);
        let responseData = response.data;

        if (!responseData.Product_exists)
            logger.warn({ reqProduct: product, res: responseData }, `A product which does not exist was requested`);

        return responseData;
    }

    /**
     * Returns all available slots for a product on the specified date
     * @param product the product
     * @param date the date
     * @returns A Promise, which returns all available slots (and more info, please see interface AvailableSpotsResponse)
     */
    async getAvailableSlots(product: Procedures.Product, date: Date = new Date()): Promise<Procedures.GetAvailableSlots.Success> {
        let data = this.getBaseJSON<Procedures.GetAvailableSlots.Request>({
            product_id: product.Product_id,
            date: dayjs(date).format("D-MM-YYYY")
        });

        logger.debug(`Available slots for product ${product.Description} (${date.toString()}) was requested`);

        let response = await this.instance.post<Procedures.GetAvailableSlots.Success>(Procedures.GetAvailableSlots.URL, data);
        let responseData = response.data;

        logger.debug(responseData.Message);

        return responseData;
    }

    /**
     * Adds a reservation for the product on the specified slot
     * @param slot The slot, which needs to be reserved
     * @param product The product, to which the slot belongs to
     * @returns An empty promise
     */
    async addReservationBooking(slot: Procedures.EmptySlot, product: Procedures.Product): Promise<Procedures.AddReservationBooking.Success> {
        if (!product.Price)
            throw new Error(`[internal] Reserving slot (${slot.Start_date}-${slot.End_date}) failed, the product did not have a price (${product?.Price})`);

        let data = this.getBaseJSON<Procedures.AddReservationBooking.Request>({
            start_date: slot.Start_date,
            end_date: slot.End_date,
            product_id: product.Product_id,
            price: product.Price
        });

        logger.debug({ slot: slot, product: product }, `Reservation booking was requested (Online Group)`);

        let response = await this.instance.post<Procedures.AddReservationBooking.Success>(Procedures.AddReservationBooking.URL, data);
        let responseData = response.data;

        logger.debug(responseData.message, `A booking with ID ${responseData.booking_id} was created`);

        return responseData;
    }

    /**
     * Adds a booking to the account of the user
     * @param booking the booking to be added
     * @returns A promise, which returns the success message
     */
    async addBooking(booking: Procedures.OpenGroupBooking): Promise<Procedures.AddBooking.Success> {
        let data = this.getBaseJSON<Procedures.AddBooking.Request>({
            booking_id: booking.Booking_id
        });

        logger.debug({ booking: booking }, `Reservation booking was requested (Open Online Group)`);

        let response = await this.instance.post<Procedures.AddBooking.Success>(Procedures.AddBooking.URL, data);
        let responseData = response.data;

        logger.debug(responseData.message, `A booking was created`);

        return responseData;
    }

    /**
     * Retrieves all bookings of the customer
     * @returns an array of Booking, representing each booking of the user
     */
    async myBookings(): Promise<Procedures.MyBookings.Success> {
        let data = this.getBaseJSON<Procedures.MyBookings.Request>();

        logger.debug(`API fetched active bookings`);

        let response = await this.instance.post<Procedures.MyBookings.Success>(Procedures.MyBookings.URL, data);
        let responseData = response.data;

        logger.debug(responseData.message);

        return responseData;
    }

    /**
     * Cancels a booking
     * @param booking the booking to be canceled
     * @returns The response from the server (0 for no error)
     */
    async cancelBooking(booking: Procedures.Booking): Promise<Procedures.CancelReservationBooking.Success> {
        let data = this.getBaseJSON<Procedures.CancelReservationBooking.Request>({
            booking_id: booking.booking_id
        });

        logger.debug(booking, `Canceling booking`);

        let response = await this.instance.post<Procedures.MyBookings.Success>(Procedures.MyBookings.URL, data);
        let responseData = response.data;

        logger.debug(responseData.message);

        return responseData;
    }
}