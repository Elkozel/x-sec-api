import axios, { AxiosInstance } from "axios";
import { default as dayjs } from 'dayjs';
import * as Procedures from "../interfaces/interfaces";
import pino from "pino";
const logger = pino({
    name: "API"
})

type Token = string | undefined;

export class APIInstance {
    protected readonly customer_id: string;
    protected readonly license: string;
    protected readonly token: Token;
    protected readonly version: string = "1.0.0";

    // The Axios Instance, which will be used to send the requests
    protected instance: AxiosInstance;

    /**
     * Constructs a an API Instance
     * @param customer_id the ID of the customer (Usually a static ID, used by the product owners)
     * @param license the license of the customer (Usually a static ID, used by the product owners)
     * @param URL the URL of the API server
     */
    constructor(customer_id: string, license: string, URL: string);
    /**
     * Constructs a tokenless API Instance
     * @param customer_id the ID of the customer (Usually a static ID, used by the product owners)
     * @param license the license of the customer (Usually a static ID, used by the product owners)
     * @param URL the URL of the API server
     * @param token the token of the user
     * @param version the current version of the API
     */
    constructor(customer_id: string, license: string, URL: string, token: string);
    /**
     * Constructs a tokenless API Instance
     * @param customer_id the ID of the customer (Usually a static ID, used by the product owners)
     * @param license the license of the customer (Usually a static ID, used by the product owners)
     * @param URL the URL of the API server
     * @param token the token of the user
     * @param version the current version of the API
     */
    constructor(customer_id: string, license: string, URL: string, token: Token);
    constructor(customer_id: string, license: string, URL: string, token?: Token) {
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
     * @param addition the addition to the data
     * @returns a new object, with the basic information needed and the additional data
     */
    protected getBaseJSON<Rq extends Procedures.DefaultRequest>(addition: object): Rq;
    /**
     * [TOKENLESS] Returns an Object with the minimal information required for a request plus the information from the additionally provided object
     * @param token the token of the user
     * @param addition the addition to the data
     * @returns a new object, with the basic information needed and the additional data
     */
    protected getBaseJSON<Rq extends Procedures.DefaultRequest>(addition: object, token: string): Rq;
    /**
     * [TOKENLESS] Returns an Object with the minimal information required for a request plus the information from the additionally provided object
     * @param token the token of the user
     * @param addition the addition to the data
     * @returns a new object, with the basic information needed and the additional data
     */
    protected getBaseJSON<Rq extends Procedures.DefaultRequest>(addition: object, token: Token): Rq;
    protected getBaseJSON<Rq extends Procedures.DefaultRequest>(addition: object = {}, token: Token = this.token): Rq {
        if (!token)
            throw new Error(`Token must be specified!`);
        return {
            customer_id: this.customer_id,
            license: this.license,
            token: token,
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
     */
    async logIn(): Promise<Procedures.Login.Success>;
    /**
     * [TOKENLESS] Checks if the user is logged in
     * @param token the token of the user 
     * @returns the response from the server
     */
    async logIn(token: string): Promise<Procedures.Login.Success>;
    /**
     * [TOKENLESS] Checks if the user is logged in
     * @param token the token of the user
     * @returns the response from the server
     */
    async logIn(token: Token): Promise<Procedures.Login.Success>;
    async logIn(token: Token = this.token): Promise<Procedures.Login.Success> {
        let data = this.getBaseJSON<Procedures.Login.Request>({
            remember: false,
            pushid: "AppPushID"
        }, token);

        logger.debug("A login is attempted");

        let response = await this.instance.post<Procedures.Login.Success>(Procedures.Login.URL, data);
        let responseData = response.data;

        logger.debug(`User ${responseData.user.first_name} ${responseData.user.last_name} was successfully logged in`);

        return responseData;
    }

    /**
     * Retrieves all Online Groups
     */
    protected async onlineGroups(): Promise<Procedures.OnlineGroups.Success>;
    /**
     * [TOKENLESS] Retrieves all Online Groups
     * @returns all online groups
     * @param token the token of the user 
     */
    protected async onlineGroups(token: string): Promise<Procedures.OnlineGroups.Success>;
    /**
     * [TOKENLESS] Retrieves all Online Groups
     * @returns all online groups
     * @param token the token of the user
     */
    protected async onlineGroups(token: Token): Promise<Procedures.OnlineGroups.Success>;
    protected async onlineGroups(token: Token = this.token): Promise<Procedures.OnlineGroups.Success> {
        let data = this.getBaseJSON<Procedures.OnlineGroups.Request>({}, token);

        logger.debug("Retrieving Online Groups");

        let response = await this.instance.post<Procedures.OnlineGroups.Success>(Procedures.OnlineGroups.URL, data);
        let responseData = response.data;

        return responseData;
    }

    /**
     * Gets all products by online group (for OnlinegroupsOpen)
     * @param group The group to retrieve products for
     * @returns A Promise, which returns an array of Products
     */
     protected async getProductsByOnlineGroup(group: Procedures.OnlinegroupsOpen): Promise<Procedures.GetProductsByOnlineGroup.Success>;
    /**
     * Gets all products by online group (for OnlinegroupsOpen)
     * @param group The group to retrieve products for
     * @param site_id the site at which the group is available
     * @returns A Promise, which returns an array of Products
     */
    protected async getProductsByOnlineGroup(group: Procedures.OnlinegroupsOpen, site_id: number): Promise<Procedures.GetProductsByOnlineGroup.Success>;
    /**
     * [TOKENLESS] Gets all products by online group (for OnlinegroupsOpen)
     * @param group The group to retrieve products for
     * @param site_id the site at which the group is available
     * @param token the token of the user 
     * @returns A Promise, which returns an array of Products
     */
    protected async getProductsByOnlineGroup(group: Procedures.OnlinegroupsOpen, site_id: number | undefined, token: string): Promise<Procedures.GetProductsByOnlineGroup.Success>;
    /**
     * [TOKENLESS] Gets all products by online group (for OnlinegroupsOpen)
     * @param group The group to retrieve products for
     * @param site_id the site at which the group is available
     * @param token the token of the user
     * @returns A Promise, which returns an array of Products
     */
    protected async getProductsByOnlineGroup(group: Procedures.OnlinegroupsOpen, site_id: number | undefined, token: Token): Promise<Procedures.GetProductsByOnlineGroup.Success>;
    protected async getProductsByOnlineGroup(group: Procedures.OnlinegroupsOpen, site_id: number = 0, token: Token = this.token): Promise<Procedures.GetProductsByOnlineGroup.Success> {
        let data = this.getBaseJSON<Procedures.GetProductsByOnlineGroup.Request>({
            online_group: group.online_group,
            site_id: site_id
        }, token);

        logger.debug(`Products for online group ${group} at site ${site_id} were requested`);

        let response = await this.instance.post<Procedures.GetProductsByOnlineGroup.Success>(Procedures.GetProductsByOnlineGroup.URL, data);
        let responseData = response.data;

        logger.debug(`${responseData.Products.length} Products were retrieved`);

        return responseData;
    }

    /**
     * Gets all products by online group (for OnlineGroup)
     * @param group The group to retrieve products for
     * @param token the token of the user
     * @returns 
     */
    protected async UniqueLocationsByOnlineGroup(group: Procedures.Onlinegroup): Promise<Procedures.UniqueLocationsByOnlineGroup.Success>;
    /**
     * [TOKENLESS] Gets all products by online group (for OnlineGroup)
     * @param group The group to retrieve products for
     * @param token the token of the user 
     * @returns 
     */
    protected async UniqueLocationsByOnlineGroup(group: Procedures.Onlinegroup, token: string): Promise<Procedures.UniqueLocationsByOnlineGroup.Success>;
    /**
     * [TOKENLESS] Gets all products by online group (for OnlineGroup)
     * @param group The group to retrieve products for
     * @param token the token of the user
     * @returns 
     */
    protected async UniqueLocationsByOnlineGroup(group: Procedures.Onlinegroup, token: Token): Promise<Procedures.UniqueLocationsByOnlineGroup.Success>;
    protected async UniqueLocationsByOnlineGroup(group: Procedures.Onlinegroup, token: Token = this.token): Promise<Procedures.UniqueLocationsByOnlineGroup.Success> {
        let data = this.getBaseJSON<Procedures.UniqueLocationsByOnlineGroup.Request>({
            onlinegroup: group.online_group
        }, token);

        logger.debug(`Unique locations for online group ${group} were requested`);

        let response = await this.instance.post(Procedures.UniqueLocationsByOnlineGroup.URL, data);
        let responseData: Procedures.UniqueLocationsByOnlineGroup.Success = response.data;

        logger.debug(responseData.message);

        return responseData;
    }

    /**
     * Retrieves the schedule of the online group
     * @param group the name of the Online Group
     * @returns the schedule of the online group
     */
     protected async schedule(group: Procedures.Onlinegroup): Promise<Procedures.Schedule.Success>;
     /**
      * Retrieves the schedule of the online group
      * @param group the name of the Online Group
      * @param site the site at which to search
      * @returns the schedule of the online group
      */
     protected async schedule(group: Procedures.Onlinegroup, site: string): Promise<Procedures.Schedule.Success>;
    /**
     * Retrieves the schedule of the online group
     * @param group the name of the Online Group
     * @param site the site at which to search
     * @param cmsid the cmsid
     * @param amountOfDays the amount of days to retrieve
     * @returns the schedule of the online group
     */
    protected async schedule(group: Procedures.Onlinegroup, site: string, trainer: string, cmsid: string, amountOfDays: number): Promise<Procedures.Schedule.Success>;
    /**
     * [TOKENLESS] Retrieves the schedule of the online group
     * @param group the name of the Online Group
     * @param site the site at which to search
     * @param trainer the trainer
     * @param cmsid the cmsid
     * @param amountOfDays the amount of days to retrieve
     * @param token the token of the user 
     * @returns the schedule of the online group
     */
    protected async schedule(group: Procedures.Onlinegroup, site: string, trainer: string | undefined, cmsid: string | undefined, amountOfDays: number | undefined, token: string): Promise<Procedures.Schedule.Success>;
    /**
     * [TOKENLESS] Retrieves the schedule of the online group
     * @param group the name of the Online Group
     * @param site the site at which to search
     * @param trainer the trainer
     * @param cmsid the cmsid
     * @param amountOfDays the amount of days to retrieve
     * @param token the token of the user
     * @returns the schedule of the online group
     */
    protected async schedule(group: Procedures.Onlinegroup, site: string, trainer: string | undefined, cmsid: string | undefined, amountOfDays: number | undefined, token: Token): Promise<Procedures.Schedule.Success>;
    protected async schedule(group: Procedures.Onlinegroup, site: string = "0", trainer: string = "", cmsid: string = "", amountOfDays: number = 365, token: Token = this.token): Promise<Procedures.Schedule.Success> {
        let data = this.getBaseJSON<Procedures.Schedule.Request>({
            trainer: trainer,
            onlinegroup: group.online_group,
            cmsid: cmsid,
            amount_of_days: amountOfDays,
            site: site
        }, token);

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
    protected async getProductById(product: Procedures.Product): Promise<Procedures.GetProductById.Success>
    /**
     * [TOKENLESS] Gets additional information about a product, based on its ID
     * @param product the product to retrieve the information for 
     * @param token the token of the user 
     * @returns A Promise, which returns the updated product with the additional information
     */
    protected async getProductById(product: Procedures.Product, token: string): Promise<Procedures.GetProductById.Success>
    /**
     * [TOKENLESS] Gets additional information about a product, based on its ID
     * @param product the product to retrieve the information for 
     * @param token the token of the user
     * @returns A Promise, which returns the updated product with the additional information
     */
    protected async getProductById(product: Procedures.Product, token: Token): Promise<Procedures.GetProductById.Success>
    protected async getProductById(product: Procedures.Product, token: Token = this.token): Promise<Procedures.GetProductById.Success> {
        let data = this.getBaseJSON<Procedures.GetProductById.Request>({ Product_id: product.Product_id }, token);

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
    protected async getAvailableSlots(product: Procedures.Product, date: Date): Promise<Procedures.GetAvailableSlots.Success>;
    /**
     * [TOKENLESS] Returns all available slots for a product on the specified date
     * @param product the product
     * @param date the date
     * @param token the token of the user 
     * @returns A Promise, which returns all available slots (and more info, please see interface AvailableSpotsResponse)
     */
    protected async getAvailableSlots(product: Procedures.Product, date: Date, token: string): Promise<Procedures.GetAvailableSlots.Success>;
    /**
     * [TOKENLESS] Returns all available slots for a product on the specified date
     * @param product the product
     * @param date the date
     * @param token the token of the user
     * @returns A Promise, which returns all available slots (and more info, please see interface AvailableSpotsResponse)
     */
    protected async getAvailableSlots(product: Procedures.Product, date: Date, token: Token): Promise<Procedures.GetAvailableSlots.Success>;
    protected async getAvailableSlots(product: Procedures.Product, date: Date = new Date(), token: Token = this.token): Promise<Procedures.GetAvailableSlots.Success> {
        let data = this.getBaseJSON<Procedures.GetAvailableSlots.Request>({
            product_id: product.Product_id,
            date: dayjs(date).format("D-MM-YYYY")
        }, token);

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
    protected async addReservationBooking(slot: Procedures.EmptySlot, product: Procedures.Product): Promise<Procedures.AddReservationBooking.Success>;
    /**
     * [TOKENLESS] Adds a reservation for the product on the specified slot
     * @param slot The slot, which needs to be reserved
     * @param product The product, to which the slot belongs to
     * @param token the token of the user
     * @returns An empty promise
     */
    protected async addReservationBooking(slot: Procedures.EmptySlot, product: Procedures.Product, token: string): Promise<Procedures.AddReservationBooking.Success>;
    /**
     * [TOKENLESS] Adds a reservation for the product on the specified slot
     * @param slot The slot, which needs to be reserved
     * @param product The product, to which the slot belongs to
     * @param token the token of the user
     * @returns An empty promise
     */
    protected async addReservationBooking(slot: Procedures.EmptySlot, product: Procedures.Product, token: Token): Promise<Procedures.AddReservationBooking.Success>;
    protected async addReservationBooking(slot: Procedures.EmptySlot, product: Procedures.Product, token: Token = this.token): Promise<Procedures.AddReservationBooking.Success> {
        if (!product.Price)
            throw new Error(`Reserving slot (${slot.Start_date}-${slot.End_date}) failed, the product did not have a price (${product?.Price}) (Maybe call getProductById first?)`);

        let data = this.getBaseJSON<Procedures.AddReservationBooking.Request>({
            start_date: slot.Start_date,
            end_date: slot.End_date,
            product_id: product.Product_id,
            price: product.Price
        }, token);

        logger.debug({ slot: slot, product: product }, `Reservation booking was requested (Online Group)`);

        if (parseInt(data.price) > 0)
            logger.warn({ slot: slot, product: product }, `A product with the price of ${product.Price} was added to the basket`);

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
    protected async addBooking(booking: Procedures.OpenGroupBooking): Promise<Procedures.AddBooking.Success>;
    /**
     * [TOKENLESS] Adds a booking to the account of the user
     * @param booking the booking to be added
     * @param token the token of the user
     * @returns A promise, which returns the success message
     */
    protected async addBooking(booking: Procedures.OpenGroupBooking, token: string): Promise<Procedures.AddBooking.Success>;
    /**
     * [TOKENLESS] Adds a booking to the account of the user
     * @param booking the booking to be added
     * @param token the token of the user
     * @returns A promise, which returns the success message
     */
    protected async addBooking(booking: Procedures.OpenGroupBooking, token: Token): Promise<Procedures.AddBooking.Success>;
    protected async addBooking(booking: Procedures.OpenGroupBooking, token: Token = this.token): Promise<Procedures.AddBooking.Success> {
        let data = this.getBaseJSON<Procedures.AddBooking.Request>({
            booking_id: booking.Booking_id
        }, token);

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
    async myBookings(): Promise<Procedures.MyBookings.Success>;
    /**
     * [TOKENLESS] Retrieves all bookings of the customer
     * @param token the token of the user
     * @returns an array of Booking, representing each booking of the user
     */
    async myBookings(token: string): Promise<Procedures.MyBookings.Success>;
    /**
     * [TOKENLESS] Retrieves all bookings of the customer
     * @param token the token of the user
     * @returns an array of Booking, representing each booking of the user
     */
    async myBookings(token: Token): Promise<Procedures.MyBookings.Success>;
    async myBookings(token: Token = this.token): Promise<Procedures.MyBookings.Success> {
        let data = this.getBaseJSON<Procedures.MyBookings.Request>({}, token);

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
    protected async cancelBooking(booking: Procedures.Booking): Promise<Procedures.CancelReservationBooking.Success>;
    /**
     * [TOKENLESS] Cancels a booking
     * @param booking the booking to be canceled
     * @param token the token of the user
     * @returns The response from the server (0 for no error)
     */
    protected async cancelBooking(booking: Procedures.Booking, token: string): Promise<Procedures.CancelReservationBooking.Success>;
    /**
     * [TOKENLESS] Cancels a booking
     * @param booking the booking to be canceled
     * @param token the token of the user
     * @returns The response from the server (0 for no error)
     */
    protected async cancelBooking(booking: Procedures.Booking, token: Token): Promise<Procedures.CancelReservationBooking.Success>;
    protected async cancelBooking(booking: Procedures.Booking, token: Token = this.token): Promise<Procedures.CancelReservationBooking.Success> {
        let data = this.getBaseJSON<Procedures.CancelReservationBooking.Request>({
            booking_id: booking.booking_id
        }, token);

        logger.debug(booking, `Canceling booking`);

        let response = await this.instance.post<Procedures.MyBookings.Success>(Procedures.MyBookings.URL, data);
        let responseData = response.data;

        logger.debug(responseData.message);

        return responseData;
    }

}