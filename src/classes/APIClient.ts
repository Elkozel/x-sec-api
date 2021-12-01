import { default as dayjs } from 'dayjs';
import { APIInstance } from "./APIInstance";
import * as Procedures from "../interfaces/interfaces";

/**
 * Extends on the Unique Locations per Online Group
 * @param schedule an object, where each key is the day of the schedule (in the format DD-MM-YYYY)
 */
interface UniqueLocations extends Procedures.Uniquelocationsbyonlinegroup {
    schedule?: { [key: string]: Procedures.schedule };
}

/**
 * Extends on the Online Group
 * @param uniqueLocations an object, where each key is the description of the unique location
 */
interface OnlineGroup extends Procedures.Onlinegroup {
    uniqueLocations?: { [key: string]: UniqueLocations }
}

/**
 * Extends each product
 * @param availableSlots an object, where each key is the start time of the empty slot (in format YYYY-MM-DD hh:mm)
 */
interface Product extends Procedures.Product {
    availableSlots?: { [key: string]: Procedures.EmptySlot };
}

/**
 * Extends on the OnlineGroupOpen
 * @param products an object, where each key is the description of the product
 */
interface OnlineGroupOpen extends Procedures.OnlinegroupsOpen {
    products?: { [key: string]: Product };
}

interface APIInfo {
    version?: string,
    userInfo?: Procedures.User,
    onlineGroups: { [k: string]: OnlineGroup },
    onlineGroupsOpen: { [k: string]: OnlineGroupOpen },
    bookings?: { [k: string]: Procedures.Booking}
}

enum GroupResponse {
    OnlineGroup,
    OnlineGoup_Open
}

export class APIClient {
    protected info: APIInfo = { // Information, retrieved from the API
        onlineGroups: {},
        onlineGroupsOpen: {}
    };
    protected api: APIInstance; // The API instance used to issue the calls
    private initialized = false;

    constructor(customer_id: string, license: string, token: string, URL: string) {
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

        // Initialize groups object
        this.info.onlineGroups = {};
        this.info.onlineGroupsOpen = {};

        // Store all groups
        groups.onlinegroups.forEach(group => {
            this.info.onlineGroups[group.online_group] = group;
        })

        groups.onlinegroups_open.forEach(groupOpen => {
            this.info.onlineGroupsOpen[groupOpen.online_group] = groupOpen;
        })

        // Retrieve bookings
        this.info.bookings = {};
        let allBookings = await this.api.myBookings();

        // Store the bookings
        allBookings.mybookings.forEach(el => {
            this.info.bookings![el.booking_id] = el;
        })

        // Record that the class was initialized
        this.initialized = true;
    }

    /**
     * Resolves whether the group is an Online or Online_Open group
     * @param groupName the name of the group
     * @returns an enum value of either OnlineGroup or OnlineGroup_Open
     * @throws an error if the name is not found in both groups
     */
    async resolveGroup(groupName: string): Promise<GroupResponse> {
        if (!this.initialized)
            await this.init();

        // Check onlineGroups
        if (groupName in this.info.onlineGroups)
            return GroupResponse.OnlineGroup;

        // Check onlineGroupsOpen
        if (groupName in this.info.onlineGroupsOpen)
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
    async reserveOnlineGroup(groupName: string, date: Date, site_description: string = "X TU Delft", schedule_ID: number = 0): Promise<Procedures.OpenGroupBooking> {
        // Retrieve the group
        let onlineGroup = this.info.onlineGroups[groupName];

        if (!onlineGroup)
            throw new Error(`Online group with name ${groupName} could not be found`)

        // Gather all locations of this group (if not gathered before)
        if (!onlineGroup.uniqueLocations) {
            // Initialize object
            onlineGroup.uniqueLocations = {};
            // Retrieve all locations
            let allLocations = await this.api.UniqueLocationsByOnlineGroup(onlineGroup);
            // Store all locations
            allLocations.uniquelocationsbyonlinegroup.forEach(el => {
                onlineGroup.uniqueLocations![el.description] = el; // Typescript was complaining that this could be undefined
            })
        }

        // Get the location
        let location = onlineGroup.uniqueLocations[site_description];
        if (!location)
            throw new Error(`Error, the group ${groupName} does not have a site ${site_description}`);

        // Retrieve the schedule (as the schedule is highly dynamic, this will always be refreshed)
        let schedule = await this.api.schedule(onlineGroup, location.site_id);
        // Store the schedule
        location.schedule = {};
        schedule.schedule.forEach(el => {
            location.schedule![el.day] = el;
        });

        // Find the booking
        let targetDay = dayjs(date).format("DD-MM-YYYY")
        console.log(targetDay);
        let daySchedule = location.schedule[targetDay];
        if (!daySchedule)
            throw new Error(`The day ${targetDay} could not be found in the schedule of ${groupName} at site ${site_description}`);
        console.log(daySchedule);
        let booking = daySchedule.bookings.find(({ Start_date }) => new Date(Start_date).getDate() === date.getDate());

        // Check if there was such a booking
        if (!booking)
            throw new Error(`Booking with name ${groupName}, at date ${date.toString()} did not exist`);

        await this.api.addBooking(booking);
        await this.checkOpenGroupBooking(parseInt(booking.Booking_id));
        return booking;
    }

    /**
     * Creates a reservation for an Online Group Open
     * @param groupName The name of the group
     * @param description The description of the group
     * @param start_date the start date of the slot
     * @param date the date for which the slot belongs
     * @returns the booking id of the newly created booking
     */
    async reserveOnlineGroupOpen(groupName: string, description: string, date: Date = new Date()): Promise<number> {
        // Retrieve the online group
        let onlineGroupOpen = this.info.onlineGroupsOpen[groupName];

        if (!onlineGroupOpen.products) {
            onlineGroupOpen.products = {};
            // Gather all info (with some detailed explanation)
            let allProducts = await (await this.api.getProductsByOnlineGroup(onlineGroupOpen)).Products; // Get all products (the API only returns a description and an ID)
            let resolvedProducts = await Promise.all(allProducts.map(prod => this.api.getProductById(prod))) // Get the full information for each product
            resolvedProducts.forEach(el => {
                onlineGroupOpen.products![el.Product.Description] = el.Product; // store each product
            })
        }

        let targetProduct = onlineGroupOpen.products[description];
        if (!targetProduct)
            throw new Error(`Booking with name ${groupName}, and description ${description} does not exist`);

        // Retrieve the available slots (as the schedule is highly dynamic, this will always be refreshed)
        let retrieveSlots = await this.api.getAvailableSlots(targetProduct, date);
        targetProduct.availableSlots = {};
        // Store available slots
        retrieveSlots.Empty_slots.forEach(el => {
            targetProduct.availableSlots![el.Start_date] = el;
        })

        let targetStartTime = dayjs(date).format("YYYY-MM-DD HH:mm");
        let emptySlot = targetProduct.availableSlots[targetStartTime];
        if (!emptySlot)
            throw new Error(`Spot with name ${groupName}, and description ${description} at time ${date.toString()} does not exist`);

        return await (await this.api.addReservationBooking(emptySlot, targetProduct)).booking_id;
    }

    /**
     * Updates the bookings that the user has
     */
    async updateBookings(): Promise<void> {
        this.info.bookings = {};
        let allBookings = await this.api.myBookings();

        allBookings.mybookings.forEach(el => {
            this.info.bookings![el.booking_id] = el;
        })
    }

    /**
     * Finds a booking from its ID
     * @param booking_ID the ID of the booking
     * @returns A booking
     */
    async findBooking(booking_ID: number): Promise<Procedures.Booking> {
        // Update bookings
        await this.updateBookings();
        // Retrieve the booking
        let booking = this.info.bookings![booking_ID];
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
        await this.updateBookings();
        if(this.info.bookings![bookingNumber])
            return true;
        return false;
    }

    // /**
    //  * Getter function for the information, which this client has
    //  * @returns all the stored information of the client
    //  */
    // get apiInfo() {
    //     return this.info;
    // }
}