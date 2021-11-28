import { groupCollapsed } from "console";
import * as fs from "fs";
import { resolve } from "url";
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


    async reserve(groupName: string, targetDay: string, startTime: string): Promise<Procedures.Booking> {
        var booking_id: number = -1;
        switch (await this.resolveGroup(groupName)) {
            case GroupResponse.OnlineGoup_Open:
                break;
            case GroupResponse.OnlineGroup:
                booking_id = parseInt((await this.reserveOnlineGroup(groupName, targetDay, startTime)).Booking_id);
                break;
        }
        if (booking_id && booking_id != -1)
            return await this.findBooking(booking_id);
        throw new Error(`The booking for ${groupName} at day ${targetDay} and time ${startTime} could not be resolved`);

    }

    /**
     * Books a spot for an Online Group
     * @param groupName the name of the Online Group
     * @param targetDay the day, which is targeted
     * @param startTime the start time of the slot
     * @returns the booking, which should be booked
     */
    async reserveOnlineGroup(groupName: string, targetDay: string, startTime: string, site_ID: number = 0, schedule_ID: number = 0): Promise<Procedures.OpenGroupBooking> {

        // Retrieve the booking
        let onlineGroup = await this.findonlineGroup(groupName);

        // Gather all info
        onlineGroup.uniqueLocations = await (await this.api.UniqueLocationsByOnlineGroup(onlineGroup)).uniquelocationsbyonlinegroup;
        let location = onlineGroup.uniqueLocations.find(({ site_id }) => parseInt(site_id) === site_ID);
        if (!location)
            throw new Error(`Error, the group ${groupName} does not have a site id ${site_ID}`);
        location.schedule = await (await this.api.schedule(onlineGroup, location.site_id)).schedule;

        let daySchedule = location.schedule.find(({ day }) => day === targetDay);
        let booking = daySchedule?.bookings.find(({ Start_time }) => Start_time === startTime);

        // Check if there was such a booking
        if (!booking)
            throw new Error(`Booking with name ${groupName}, at day ${targetDay} and start time ${startTime} did not exist`);

        await this.api.addBooking(booking);
        await this.checkOpenGroupBooking(parseInt(booking.Booking_id));
        return booking;
    }

    async reserveOnlineGroupOpen(group: Procedures.OnlinegroupsOpen, description: string, start_date: string, date: Date = new Date()): Promise<void> {
        let products: Procedures.Product[] = await (await this.api.getProductsByOnlineGroup(group)).Products;
        var product = products.find(({ Description }) => { Description === description });
        if (!product)
            throw new Error(`Booking with name ${group.online_group}, and description ${description} does not exist`);
        product = await (await this.api.getProductById(product)).Product;

        let spot = (await this.api.getAvailableSlots(product, date)).Empty_slots
            .find(({ Start_date }) => Start_date === start_date);

        if (!spot)
            throw new Error(`Spot with name ${group.online_group}, and description ${description} at time ${start_date} does not exist`);

        await this.api.addReservationBooking(spot, product);

    }

    /**
     * Finds an Onlinegroup from the online_group array with a given name
     * @param groupName the name of the group
     * @returns the online group that was found
     * @throws an error if the group does not exist
     */
    async findonlineGroup(groupName: string): Promise<OnlineGroup> {
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