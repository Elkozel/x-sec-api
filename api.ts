import axios, { AxiosInstance } from "axios";
import { format } from 'date-and-time';
import * as fs from "fs";
import * as API from "./interfaces/_index";

const sensitiveData = JSON.parse(fs.readFileSync("data/sensitive.json", "UTF-8"));

const DEFAULT_URL: string = sensitiveData.URL;
const DEFAULT_VERSION: string = sensitiveData.version;

class APIClient {
    protected readonly customer_id: string;
    protected readonly license: string;
    protected readonly token: string;

    // The Axios Instance, which will be used to send the requests
    protected instance: AxiosInstance;

    // Private data about the client
    private userInfo?: API.User;

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

        // Usually the version and logon is checked upon initializing, however one does not simply DOS when Debugging (Disable this when debugging)
        this.checkVersion();
        this.logIn();
    }

    /**
     * Returns an Object with the minimal information required for a request plus the information from the additionally provided object
     * @param addition the additional information to be concatinated to the end result
     * @returns an object which contains both the basic information about a request and the additional information provided
     */
    getBaseJSON(addition: object = {}) {
        return {
            customer_id: this.customer_id,
            license: this.license,
            token: this.token,
            ...addition
        }
    }

    /**
     * Checks if the version of the API is complient with the current version
     * @returns void
     * @throws a VersionMismatched error when the version of the API is not accurate
     */
    async checkVersion(): Promise<void> {
        let data: API.CheckVersion.Request = {
            customer_id: this.customer_id,
            license: this.license,
            version: DEFAULT_VERSION
        }

        let response = await this.instance.post(API.CheckVersion.URL, data);
        let responseData = response.data;
    }

    /**
     * Checks if the user is logged in
     * @returns void
     */
    async logIn(): Promise<void> {
        let data = this.getBaseJSON({
            remember: false,
            pushid: "AppPushID"
        });

        let response = await this.instance.post(API.Login.URL, data);
        let responseData: API.Login.Success = response.data;

        this.userInfo = responseData.user;
    }

    /**
     * Retrieves all Online Groups
     * @returns all online groups
     */
    async onlineGroups(): Promise<API.OnlineGroups.Success> {
        let data: API.OnlineGroups.Request = this.getBaseJSON({});

        let response = await this.instance.post(API.OnlineGroups.URL, data);
        let responseData: API.OnlineGroups.Success = response.data;

        return responseData;
    }

    /**
     * Gets all products by online group (for OnlinegroupsOpen)
     * @param group The group to retrieve products for
     * @returns A Promise, which returns an array of Products
     */
    async getProductsByOnlineGroup(group: API.OnlinegroupsOpen): Promise<API.GetProductsByOnlineGroup.Success> {
        let data = this.getBaseJSON({
            online_group: group.online_group,
            site_id: 0
        });

        let response = await this.instance.post(API.GetProductsByOnlineGroup.URL, data);
        let responseData: API.GetProductsByOnlineGroup.Success = response.data;

        return responseData;
    }

    /**
     * Gets all products by online group (for OnlineGroup)
     * @param group The group to retrieve products for
     * @returns 
     */
    async UniqueLocationsByOnlineGroup(group: API.Onlinegroup): Promise<API.UniqueLocationsByOnlineGroup.Success> {
        let data = this.getBaseJSON({
            onlinegroup: group.online_group
        });

        let response = await this.instance.post(API.UniqueLocationsByOnlineGroup.URL, data);
        let responseData: API.UniqueLocationsByOnlineGroup.Success = response.data;

        return responseData;
    }

    async schedule(group: API.Onlinegroup, site: string = "0"): Promise<API.Schedule.Success> {
        let data = this.getBaseJSON({
            trainer: "",
            onlinegroup: group.online_group,
            cmsid: "",
            amount_of_days: 365,
            site: site
        });

        let response = await this.instance.post(API.Schedule.URL, data);
        let responseData: API.Schedule.Success = response.data;

        return responseData;
    }

    /**
     * Gets additional information about a product, based on its ID
     * @param product the product to retrieve the information for 
     * @returns A Promise, which returns the updated product with the additional information
     */
    async getProductById(product: API.Product): Promise<API.GetProductById.Success> {
        let data = this.getBaseJSON({ Product_id: product.Product_id });

        let response = await this.instance.post(API.GetProductById.URL, data);
        let responseData: API.GetProductById.Success = response.data;

        return responseData;
    }

    /**
     * Returns all available slots for a product on the specified date
     * @param product the product
     * @param date the date
     * @returns A Promise, which returns all available slots (and more info, please see interface AvailableSpotsResponse)
     */
    async getAvailableSlots(product: API.Product, date: Date = new Date()): Promise<API.GetAvailableSlots.Success> {
        let data = this.getBaseJSON({ Product_id: product.Product_id, date: format(date, "D-MM-YYYY") });

        let response = await this.instance.post(API.GetAvailableSlots.URL, data);
        let responseData: API.GetAvailableSlots.Success = response.data;

        return responseData;
    }

    /**
     * Adds a reservation for the product on the specified slot
     * @param slot The slot, which needs to be reserved
     * @param product The product, to which the slot belongs to
     * @returns An empty promise
     */
    async addReservationBooking(slot: API.EmptySlot, product: API.Product): Promise<API.AddReservationBooking.Success> {
        if (!product.Price)
            throw new Error(`[internal] Reserving slot (${slot.Start_date}-${slot.End_date}) failed, the product did not have a price (${product?.Price})`);

        let data = this.getBaseJSON({
            start_date: slot.Start_date,
            end_date: slot.End_date,
            product_id: product.Product_id,
            price: product.Price
        });

        let response = await this.instance.post(API.AddReservationBooking.URL, data);
        let responseData: API.AddReservationBooking.Success = response.data;

        return responseData;
    }

    /**
     * Adds a booking to the account of the user
     * @param booking the booking to be added
     * @returns A promise, which returns the success message
     */
    async addBooking(booking: API.OpenGroupBooking): Promise<API.AddBooking.Success> {
        let data = this.getBaseJSON({ booking_id: booking.Booking_id });

        let response = await this.instance.post(API.AddBooking.URL, data);
        let responseData: API.AddBooking.Success = response.data;

        return responseData;
    }

    /**
     * Retrieves all bookings of the customer
     * @returns an array of Booking, representing each booking of the user
     */
    async myBookings(): Promise<API.MyBookings.Success> {
        let data = this.getBaseJSON();

        let response = await this.instance.post(API.MyBookings.URL, data);
        let responseData: API.MyBookings.Success = response.data;

        return responseData;
    }

    /**
     * Cancels a booking
     * @param booking the booking to be canceled
     * @returns The response from the server (0 for no error)
     */
    async cancelBooking(booking: API.Booking): Promise<API.CancelReservationBooking.Success> {
        let data = this.getBaseJSON({ booking_id: booking.booking_id });

        let response = await this.instance.post(API.MyBookings.URL, data);
        let responseData: API.MyBookings.Success = response.data;

        return responseData;
    }

    /**
     * Books a spot for an Online Group
     * @param groupName the name of the Online Group
     * @param targetDay the day, which is targeted
     * @param startTime the start time of the slot
     * @returns the booking, which should be booked
     */
    async reserveOnlineGroup(groupName: string, targetDay: string, startTime: string): Promise<API.OpenGroupBooking> {
        // Grab the group with the group name
        let group = await this.findonlineGroup(groupName);
        // Retrieve the booking
        let booking = (await this.schedule(group))
            .schedule.find(({ day }) => day === targetDay)
            ?.bookings.find(({ Start_time }) => Start_time === startTime);

        // Check if there was such a booking
        if(!booking)
            throw new Error(`Booking with name ${groupName}, at day ${targetDay} and start time ${startTime} did not exist`);

        await api.addBooking(booking);
        await api.checkOpenGroupBooking(booking);
        return booking;
    }

    /**
     * Finds an Onlinegroup from the online_group array with a given name
     * @param groupName the name of the group
     * @returns the online group that was found
     * @throws an error if the group does not exist
     */
    async findonlineGroup(groupName: string): Promise<API.Onlinegroup> {
        // Retrieve online groups
        let onlineGroups: API.OnlineGroups.Success = await api.onlineGroups();
        // Retrieve Unique location per online group
        let group = onlineGroups.onlinegroups.find(({ online_group }) => online_group === groupName);
        // Check if the group exists
        if (!group)
            throw new Error(`The group with name ${groupName} does not exist`);
        // Return group
        return group
    }

    async checkOpenGroupBooking(booking: API.OpenGroupBooking): Promise<boolean> {
        let myBookings = await api.myBookings();
        return myBookings.mybookings.findIndex(({booking_id}) => booking_id === booking.Booking_id) >= 1;
    }
}

let api = new APIClient(sensitiveData.customer_id, sensitiveData.license, sensitiveData.token);

api.reserveOnlineGroup("Fitness Time-Slots", "19-11-2021", "10:00").then( booking => {
    api.checkOpenGroupBooking(booking);
}).then(() => {
    console.log("Booking complete!");
}).catch((erer) => {
    console.log(erer);
})