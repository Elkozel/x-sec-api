import * as fs from "fs";
import { format } from 'date-and-time';
import { APIInstance } from "./api";
import * as Procedures from "./interfaces/interfaces";

const sensitiveData = JSON.parse(fs.readFileSync("data/sensitive.json", "UTF-8"));

const DEFAULT_URL: string = sensitiveData.URL;

interface UniqueLocations extends Procedures.Uniquelocationsbyonlinegroup {
    schedule?: Procedures.schedule[],
}

interface OnlineGroup extends Procedures.Onlinegroup {
    uniqueLocations?: UniqueLocations[]
}

interface Product extends Procedures.Product {
    availableSlots?: { [key: string]: Procedures.EmptySlot[] };
}

interface OnlineGroupOpen extends Procedures.OnlinegroupsOpen {
    products?: Product[];
}

interface APIInfo {
    version?: string,
    userInfo?: Procedures.User,
    onlineGroups?: OnlineGroup[],
    onlineGroupsOpen?: Procedures.OnlinegroupsOpen[],
    bookings?: Procedures.Booking[]
}

enum GroupResponse {
    OnlineGroup,
    OnlineGoup_Open
}

export class APIClient {
    protected info: APIInfo = {}; // Information, retrieved from the API
    protected api: APIInstance; // The API instance used to issue the calls

    constructor(customer_id: string, license: string, token: string, URL: string = DEFAULT_URL) {
        this.api = new APIInstance(customer_id, license, token, URL);
    }

    /**
     * Requests basic information from the API, checks the user and the version of the API
     */
    async init(): Promise<void> {
        this.api.checkVersion();

        // Retrieve login information about the user
        let usr = await this.api.logIn();
        this.info.userInfo = usr.user;

        // Retrieve online groups
        let groups = await this.api.onlineGroups();
        this.info.onlineGroups = groups.onlinegroups;
        this.info.onlineGroupsOpen = groups.onlinegroups_open;

        // Retrieve bookings
        this.info.bookings = await (await this.api.myBookings()).mybookings;
    }

    /**
     * Resolves whether the group is an Online or Online_Open group
     * @param groupName the name of the group
     * @returns an enum value of either OnlineGroup or OnlineGroup_Open
     * @throws an error if the name is not found in both groups
     */
    async resolveGroup(groupName: string): Promise<GroupResponse> {
        if (!this.info.onlineGroups || !this.info.onlineGroupsOpen)
            await this.init();

        // Check onlineGroups
        let searchClosed = this.info.onlineGroups?.find(({ online_group }) => { online_group === groupName });
        if (searchClosed)
            return GroupResponse.OnlineGroup;

        // Check onlineGroupsOpen
        let searchOpen = this.info.onlineGroupsOpen?.find(({ online_group }) => { online_group === groupName });
        if (searchOpen)
            return GroupResponse.OnlineGoup_Open;

        // Else return an error
        throw new Error(`The group ${groupName} was not found`);

    }


    async reserve(groupName: string, date: string | Date, description?: string): Promise<Procedures.Booking> {
        if (typeof date === "string") // Handle if Date is a string
            date = new Date(date);

        var booking_id: number = -1;
        switch (await this.resolveGroup(groupName)) {
            case GroupResponse.OnlineGoup_Open:
                if (!description) throw new Error(`Cannot reserve an Open Online group without a description`);
                booking_id = await this.reserveOnlineGroupOpen(groupName, description, date)
                break;
            case GroupResponse.OnlineGroup:
                booking_id = parseInt((await this.reserveOnlineGroup(groupName, date)).Booking_id);
                break;
        }
        if (booking_id && booking_id != -1)
            return await this.findBooking(booking_id);
        throw new Error(`The booking for ${groupName} at date ${date.toString()} could not be resolved`);

    }

    /**
     * Books a spot for an Online Group
     * @param groupName the name of the Online Group
     * @param targetDay the day, which is targeted
     * @param startTime the start time of the slot
     * @returns the booking, which should be booked
     */
    async reserveOnlineGroup(groupName: string, date: Date, site_ID: number = 0, schedule_ID: number = 0): Promise<Procedures.OpenGroupBooking> {
        // Retrieve the group
        let onlineGroup = await this.findOnlineGroup(groupName);

        // Gather all info
        onlineGroup.uniqueLocations = await (await this.api.UniqueLocationsByOnlineGroup(onlineGroup)).uniquelocationsbyonlinegroup;
        let location = onlineGroup.uniqueLocations.find(({ site_id }) => parseInt(site_id) === site_ID);
        if (!location)
            throw new Error(`Error, the group ${groupName} does not have a site id ${site_ID}`);
        location.schedule = await (await this.api.schedule(onlineGroup, location.site_id)).schedule;

        let targetDay = format(date, "DD-MM-YYYY");
        let daySchedule = location.schedule.find(({ day }) => day === targetDay);
        let booking = daySchedule?.bookings.find(({ Start_time }) => new Date(Start_time) === date);

        // Check if there was such a booking
        if (!booking)
            throw new Error(`Booking with name ${groupName}, at date ${date.toString()} did not exist`);

        await this.api.addBooking(booking);
        await this.checkOpenGroupBooking(parseInt(booking.Booking_id));
        return booking;
    }

    /**
     * Creates a reservation for an Online Group Open
     * @param group The name of the group
     * @param description The description of the group
     * @param start_date the start date of the slot
     * @param date the date for which the slot belongs
     * @returns the booking id of the newly created booking
     */
    async reserveOnlineGroupOpen(group: string, description: string, date: Date = new Date()): Promise<number> {
        // Retrieve the online group
        let onlineGroupOpen = await this.findOnlineGroupOpen(group);

        // Gather all info (with some detailed explanation)
        let allProducts = await (await this.api.getProductsByOnlineGroup(onlineGroupOpen)).Products; // Get all products (the API only returns a description and an ID)
        let resolvedProducts = await Promise.all(allProducts.map(prod => this.api.getProductById(prod))) // Get the full information for each product
        onlineGroupOpen.products = resolvedProducts.map(prod => prod.Product); // Extract only the products from the responses

        let targetProduct = onlineGroupOpen.products.find(({ Description }) => { Description === description });
        if (!targetProduct)
            throw new Error(`Booking with name ${group}, and description ${description} does not exist`);

        targetProduct.availableSlots = {};
        targetProduct.availableSlots[date.toString()] = await (await this.api.getAvailableSlots(targetProduct, date)).Empty_slots;

        let emptySlot = targetProduct.availableSlots[date.toString()].find(({ Start_date }) => new Date(Start_date).getTime() === date.getTime());
        if (!emptySlot)
            throw new Error(`Spot with name ${group}, and description ${description} at time ${date.toString()} does not exist`);

        return await (await this.api.addReservationBooking(emptySlot, targetProduct)).booking_id;
    }

    /**
     * Finds an Onlinegroup from the online_group array with a given name
     * @param groupName the name of the group
     * @returns the online group that was found
     * @throws an error if the group does not exist
     */
    async findOnlineGroup(groupName: string): Promise<OnlineGroup> {
        // Retrieve groups if not retrieved
        if (!this.info.onlineGroups)
            await this.init();

        // Get list of online groups
        let onlineGroups = this.info.onlineGroups;
        // Retrieve Unique location per online group
        let group = onlineGroups?.find(({ online_group }) => online_group === groupName);
        // Check if the group exists
        if (!group)
            throw new Error(`The group with name ${groupName} does not exist`);
        // Return group
        return group;
    }

    /**
     * Retrieves an online group from memory
     * @param groupName the name of the Group
     * @returns The group found
     */
    async findOnlineGroupOpen(groupName: string): Promise<OnlineGroupOpen> {
        // Retrieve groups if not retrieved
        if (!this.info.onlineGroups)
            await this.init();

        // Get list of online groups
        let onlineGroupsOpen = this.info.onlineGroupsOpen;
        // Retrieve Unique location per online group
        let group = onlineGroupsOpen?.find(({ online_group }) => online_group === groupName);
        // Check if the group exists
        if (!group)
            throw new Error(`The group with name ${groupName} does not exist`);
        // Return group
        return group;
    }

    /**
     * Finds a booking from its ID
     * @param booking_ID the ID of the booking
     * @returns A booking
     */
    async findBooking(booking_ID: number): Promise<Procedures.Booking> {
        // Update bookings
        this.info.bookings = (await this.api.myBookings()).mybookings;
        // Retrieve the booking
        let booking = this.info.bookings.find(({ booking_id }) => { booking_ID === parseInt(booking_id) });
        // Check if the booking exists
        if (!booking)
            throw new Error(`Could not find booking number ${booking_ID}`);
        // Return the booking
        return booking;
    }

    /**
     * Checks if a booking exists
     * @param booking the number of the booking
     * @returns true, if the booking was found
     */
    async checkOpenGroupBooking(bookingNumber: number): Promise<boolean> {
        this.info.bookings = await (await this.api.myBookings()).mybookings;
        return this.info.bookings.findIndex(({ booking_id }) => parseInt(booking_id) == bookingNumber) >= 1;
    }

    /**
     * Getter function for the information, which this client has
     * @returns all the stored information of the client
     */
    get apiInfo() {
        return this.info;
    }
}