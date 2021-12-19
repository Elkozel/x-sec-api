import { default as dayjs } from 'dayjs';
import { APIInstance } from "./APIInstance";
import * as Procedures from "../interfaces/interfaces";
import pino from "pino";
const logger = pino({
    name: "API Client"
})

type Token = string | undefined;

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

/**
 * Object, which store the information that the API has
 */
interface APIInfo {
    // The version of the API
    version?: string,
    // The info about the user
    userInfo?: Procedures.User,
    // All online groups
    onlineGroups: { [k: string]: OnlineGroup },
    // All online groups Open
    onlineGroupsOpen: { [k: string]: OnlineGroupOpen },
    bookings?: { [k: string]: Procedures.Booking }
}

/**
 * Response from deriving if a group belongs to Online Groups or Online Groups Open
 */
enum GroupResponse {
    OnlineGroup,
    OnlineGoup_Open
}

export class APIClient extends APIInstance {
    public info: APIInfo = { // Information, retrieved from the API
        onlineGroups: {},
        onlineGroupsOpen: {}
    };
    private initialized = false;

    /**
     * Creates a tokenless API Client instance, which handles the functionallity of the API
     * @param customer_id the ID of the customer
     * @param license the licence of the customer
     * @param URL the URL to which the API should connect
     */
    constructor(customer_id: string, license: string, URL: string)
    /**
     * Creates an API Client instance, which handles the functionallity of the API
     * @param customer_id the ID of the customer
     * @param license the licence of the customer
     * @param URL the URL to which the API should connect
     * @param token the token of the user
     */
    constructor(customer_id: string, license: string, URL: string, token: Token)
    constructor(customer_id: string, license: string, URL: string, token?: Token) {
        super(customer_id, license, URL, token);
    }


    /**
         _____  _                   ______                    _    _                    
        /  __ \| |                  |  ___|                  | |  (_)                   
        | /  \/| |  __ _  ___  ___  | |_  _   _  _ __    ___ | |_  _   ___   _ __   ___ 
        | |    | | / _` |/ __|/ __| |  _|| | | || '_ \  / __|| __|| | / _ \ | '_ \ / __|
        | \__/\| || (_| |\__ \\__ \ | |  | |_| || | | || (__ | |_ | || (_) || | | |\__ \
         \____/|_| \__,_||___/|___/ \_|   \__,_||_| |_| \___| \__||_| \___/ |_| |_||___/
                                                                                        
                                                                                        
     */

    /**
     * Requests basic information from the API:
     * - checks the user 
     * - the version of the API
     */
    async init(token: Token = this.token): Promise<void> {
        logger.info(`Initializing API Client`);

        // Check the version
        let version = await this.checkVersion();

        // Check the token
        if (!token)
            throw new Error(`Token must be specified!`);

        // Retrieve login information about the user
        let usr = await this.logIn(token);
        if(this.token) // If the insatance is not tokenless
            this.info.userInfo = usr.user;

        // Retrieve online groups
        let groups = await this.onlineGroups(token);

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
        let allBookings = await this.myBookings(token);

        // Store the bookings
        allBookings.mybookings.forEach(el => {
            this.info.bookings![el.booking_id] = el;
        })

        // Record that the class was initialized
        this.initialized = true;
        logger.debug(`API Client was initialized`);
    }

    /**
     * Check if the client was initialized
     * @returns true, if the client was initialized
     */
    isInitialized() {
        return this.initialized;
    }

    /**
     * Resets the memory inside this API client
     */
    reset() {
        this.info = {
            onlineGroups: {},
            onlineGroupsOpen: {}
        };
        this.initialized = false;
    }


    /**
         _   _        _                       __                      _    _                    
        | | | |      | |                     / _|                    | |  (_)                   
        | |_| |  ___ | | _ __    ___  _ __  | |_  _   _  _ __    ___ | |_  _   ___   _ __   ___ 
        |  _  | / _ \| || '_ \  / _ \| '__| |  _|| | | || '_ \  / __|| __|| | / _ \ | '_ \ / __|
        | | | ||  __/| || |_) ||  __/| |    | |  | |_| || | | || (__ | |_ | || (_) || | | |\__ \
        \_| |_/ \___||_|| .__/  \___||_|    |_|   \__,_||_| |_| \___| \__||_| \___/ |_| |_||___/
                        | |                                                                     
                        |_|                                                                     
     */

    /**
     * Resolves whether the group is an Online or Online_Open group
     * @param groupName the name of the group
     * @returns an enum value of either OnlineGroup or OnlineGroup_Open
     * @throws an error if the name is not found in both groups
    */
    protected async resolveGroup(groupName: string): Promise<GroupResponse>;
    /**
    * Resolves whether the group is an Online or Online_Open group
    * @param groupName the name of the group
    * @param token the token of the user
    * @returns an enum value of either OnlineGroup or OnlineGroup_Open
    * @throws an error if the name is not found in both groups
    */
    protected async resolveGroup(groupName: string, token: string): Promise<GroupResponse>;
    /**
     * Resolves whether the group is an Online or Online_Open group
     * @param groupName the name of the group
     * @param token the token of the user
     * @returns an enum value of either OnlineGroup or OnlineGroup_Open
     * @throws an error if the name is not found in both groups
     */
    protected async resolveGroup(groupName: string, token: Token): Promise<GroupResponse>;
    protected async resolveGroup(groupName: string, token?: Token): Promise<GroupResponse> {
        // Check if initialized
        if (!this.initialized) {
            logger.warn(`A function was called without initializing the API Client, please call init() first, this time we did it for you`);
            await this.init(token);
        }

        // Check onlineGroups
        if (groupName in this.info.onlineGroups)
            return GroupResponse.OnlineGroup;

        // Check onlineGroupsOpen
        if (groupName in this.info.onlineGroupsOpen)
            return GroupResponse.OnlineGoup_Open;

        // Else return an error
        throw new Error(`The group ${groupName} was not found`);

    }

    /**
     * Reserves a spot for an Online Group
     * @warning the group can only be Online Group (not Open)!
     * @param groupName the name of the group
     * @param date the date at which it should be booked
     * @returns the booking object from the bookings of the user
     */
    async reserve(groupName: string, date: string): Promise<Procedures.Booking>;
    /**
     * Reserves a spot for an Online Group
     * @warning the group can only be Online Group (not Open)!
     * @param groupName the name of the group
     * @param date the date at which it should be booked
     * @returns the booking object from the bookings of the user
     */
    async reserve(groupName: string, date: Date): Promise<Procedures.Booking>;
    /**
     * Reserves a spot for the given group
     * @param groupName the name of the group
     * @param date the date at which it should be booked
     * @param description the description of the group (only used if an Online Group Open is reserved)
     * @returns the booking object from the bookings of the user
     */
    async reserve(groupName: string, date: string, description: string): Promise<Procedures.Booking>;
    /**
     * Reserves a spot for a given group at a given time
     * @param groupName the name of the group
     * @param date the date at which the it should be booked
     * @param description the description of the group (only used if an Online Group Open is reserved)
     * @returns the booking object from the bookings of the user
     */
    async reserve(groupName: string, date: Date, description: string): Promise<Procedures.Booking>;
    /**
     * Reserves a spot for the given group
     * @param groupName the name of the group
     * @param date the date at which it should be booked
     * @param description the description of the group (only used if an Online Group Open is reserved)
     * @param token the token of the user
     * @returns the booking object from the bookings of the user
     */
    async reserve(groupName: string, date: string, description: string | undefined, token: string): Promise<Procedures.Booking>;
    /**
     * Reserves a spot for a given group at a given time
     * @param groupName the name of the group
     * @param date the date at which the it should be booked
     * @param description the description of the group (only used if an Online Group Open is reserved)
     * @param token the token of the user
     * @returns the booking object from the bookings of the user
     */
    async reserve(groupName: string, date: Date, description: string | undefined, token: Token): Promise<Procedures.Booking>;
    async reserve(groupName: string, date: string | Date, description?: string, token: Token = this.token): Promise<Procedures.Booking> {
        // Check if initialized
        if (!this.initialized) {
            logger.warn(`A function was called without initializing the API Client, please call init() first, this time we did it for you`);
            await this.init(token);
        }

        if (typeof date === "string") // Handle if Date is a string
            date = new Date(date);

        var booking_id: number = -1;
        switch (await this.resolveGroup(groupName, token)) { // Check which type the Online Group is
            case GroupResponse.OnlineGoup_Open:
                if (!description) throw new Error(`Cannot reserve an Open Online group without a description`);
                booking_id = await this.reserveOnlineGroupOpen(groupName, description, date, token)
                break;
            case GroupResponse.OnlineGroup:
                booking_id = parseInt((await this.reserveOnlineGroup(groupName, date, undefined, undefined, token)).Booking_id);
                break;
        }
        // Check if the booking exists (was created)
        if (booking_id && booking_id != -1)
            return await this.findBooking(booking_id, token);
        throw new Error(`The booking for ${groupName} at date ${date.toString()} could not be resolved`);

    }


    /**
         _____         _  _                _____                           
        |  _  |       | |(_)              |  __ \                          
        | | | | _ __  | | _  _ __    ___  | |  \/ _ __  ___   _   _  _ __  
        | | | || '_ \ | || || '_ \  / _ \ | | __ | '__|/ _ \ | | | || '_ \ 
        \ \_/ /| | | || || || | | ||  __/ | |_\ \| |  | (_) || |_| || |_) |
         \___/ |_| |_||_||_||_| |_| \___|  \____/|_|   \___/  \__,_|| .__/ 
                                                                    | |    
                                                                    |_|    
     */

    /**
     * Reserves a spot with the information about the booking fetched at an earlier time
     * @see prepareReservation() the function, which prepares the statement
     * @param prepared a preprepared booking
     * @returns the Open Booking
     */
    protected async reserveOnlineGroup(prepared: ReserveOG): Promise<Procedures.OpenGroupBooking>;
    /**
     * [TOKENLESS] Reserves a spot with the information about the booking fetched at an earlier time
     * @see prepareReservation()
     * @param prepared a preprepared booking
     * @param token the token of the user
     * @returns the Open Booking
     */
    protected async reserveOnlineGroup(prepared: ReserveOG, token: Token): Promise<Procedures.OpenGroupBooking>;
    /**
     * [TOKENLESS] Reserves a spot with the information about the booking fetched at an earlier time
     * @see prepareReservation()
     * @param prepared a preprepared booking
     * @param token the token of the user
     * @returns the Open Booking
     */
    protected async reserveOnlineGroup(prepared: ReserveOG, token: string): Promise<Procedures.OpenGroupBooking>;
    /**
     * Books a spot for an Online Group
     * @param groupName the name of the OnlineGroup
     * @param date the date to be booked
     * @returns the Open Booking
     */
    protected async reserveOnlineGroup(groupName: string, date: Date): Promise<Procedures.OpenGroupBooking>;
    /**
     * Books a spot for an Online Group
     * @param groupName the name of the Online Group
     * @param date the date to be booked
     * @param site_description the description of the site
     * @param schedule_ID the ID of the schedule
     * @returns the Open Booking
     */
    protected async reserveOnlineGroup(groupName: string, date: Date, site_description: string, schedule_ID: number): Promise<Procedures.OpenGroupBooking>;
    /**
     * [TOKENLESS] Books a spot for an Online Group
     * @param groupName the name of the Online Group
     * @param date the date to be booked
     * @param site_description the description of the site
     * @param schedule_ID the ID of the schedule
     * @param token the token of the user
     * @returns the Open Booking
     */
    protected async reserveOnlineGroup(groupName: string, date: Date, site_description: string | undefined, schedule_ID: number | undefined, token: Token): Promise<Procedures.OpenGroupBooking>;
    protected async reserveOnlineGroup(groupName_or_prepared: string | ReserveOG, date_or_token?: Date | Token, site_description: string = "X TU Delft", schedule_ID: number = 0, token?: Token): Promise<Procedures.OpenGroupBooking> {
        // Check if it is not a prepared statement
        if (typeof groupName_or_prepared === "string") {
            if (!date_or_token || typeof date_or_token === "string") // Check if the date is defined
                throw new Error(`Date was not provided for booking of ${groupName_or_prepared}`)
            return await this.reserveOnlineGroup_Arguments(groupName_or_prepared, date_or_token, site_description, schedule_ID, token);
        }
        // Else it is a prepared statement
        if (date_or_token instanceof Date)
            throw new Error(`A prepared statement was called incorrectly (${groupName_or_prepared}, ${date_or_token})`);
        return await this.reserveOnlineGroup_Prepared(groupName_or_prepared, date_or_token)
    }

    private async reserveOnlineGroup_Prepared(groupName: ReserveOG): Promise<Procedures.OpenGroupBooking>;
    private async reserveOnlineGroup_Prepared(groupName: ReserveOG, token: Token): Promise<Procedures.OpenGroupBooking>;
    private async reserveOnlineGroup_Prepared(groupName: ReserveOG, token: string): Promise<Procedures.OpenGroupBooking>;
    private async reserveOnlineGroup_Prepared(groupName: ReserveOG, token: Token = this.token): Promise<Procedures.OpenGroupBooking> {
        await this.addBooking(groupName.booking, token); // Reserve the spot
        await this.checkBooking(parseInt(groupName.booking.Booking_id), token); // Check if the booking exists
        return groupName.booking;
    }

    private async reserveOnlineGroup_Arguments(groupName: string, date: Date): Promise<Procedures.OpenGroupBooking>;
    private async reserveOnlineGroup_Arguments(groupName: string, date: Date, site_description: string, schedule_ID: number): Promise<Procedures.OpenGroupBooking>;
    private async reserveOnlineGroup_Arguments(groupName: string, date: Date, site_description: string, schedule_ID: number, token: Token): Promise<Procedures.OpenGroupBooking>;
    private async reserveOnlineGroup_Arguments(groupName: string, date: Date, site_description: string, schedule_ID: number, token: string): Promise<Procedures.OpenGroupBooking>;
    private async reserveOnlineGroup_Arguments(groupName: string, date: Date, site_description: string = "X TU Delft", schedule_ID: number = 0, token: Token = this.token): Promise<Procedures.OpenGroupBooking> {
        // Check if initialized
        if (!this.initialized) {
            logger.warn(`A function was called without initializing the API Client, please call init() first, this time we did it for you`);
            await this.init();
        }
        // Retrieve the booking
        let booking = await this.findOnlineGroupBooking(groupName, date, site_description, schedule_ID, token);

        await this.addBooking(booking, token); // Reserve the spot
        await this.checkBooking(parseInt(booking.Booking_id), token); // Check if the booking exists
        return booking;
    }

    /**
     * Finds an online booking
     * @param groupName the name of the group
     * @param date the date of the booking
     * @returns an open booking in formation
     */
    protected async findOnlineGroupBooking(groupName: string, date: Date): Promise<Procedures.OpenGroupBooking>;
    /**
     * [TOKENLESS] Finds an online booking
     * @param groupName the name of the group
     * @param date the date of the booking
     * @param site_description the description of the site
     * @param schedule_ID the ID of the schedule used
     * @param token the token of the user
     * @returns an open booking in formation
     */
    protected async findOnlineGroupBooking(groupName: string, date: Date, site_description: string, schedule_ID: number, token: Token): Promise<Procedures.OpenGroupBooking>;
    /**
     * [TOKENLESS] Finds an online booking
     * @param groupName the name of the group
     * @param date the date of the booking
     * @param site_description the description of the site
     * @param schedule_ID the ID of the schedule used
     * @param token the token of the user
     * @returns an open booking in formation
     */
    protected async findOnlineGroupBooking(groupName: string, date: Date, site_description: string, schedule_ID: number, token: string): Promise<Procedures.OpenGroupBooking>;
    protected async findOnlineGroupBooking(groupName: string, date: Date, site_description: string = "X TU Delft", schedule_ID: number = 0, token: Token = this.token): Promise<Procedures.OpenGroupBooking> {
        // Check if initialized
        if (!this.initialized) {
            logger.warn(`A function was called without initializing the API Client, please call init() first, this time we did it for you`);
            await this.init(token);
        }

        // Retrieve the group
        let onlineGroup = this.info.onlineGroups[groupName];

        if (!onlineGroup)
            throw new Error(`Online group with name ${groupName} could not be found`)

        // Gather all locations of this group (if not gathered before)
        if (!onlineGroup.uniqueLocations) {
            // Initialize object
            onlineGroup.uniqueLocations = {};
            // Retrieve all locations
            let allLocations = await this.UniqueLocationsByOnlineGroup(onlineGroup, token);
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
        let schedule = await this.schedule(onlineGroup, location.site_id, undefined, undefined, undefined, token);
        // Store the schedule
        location.schedule = {};
        schedule.schedule.forEach(el => {
            location.schedule![el.day] = el;
        });

        // Find the booking
        let targetDay = dayjs(date).format("DD-MM-YYYY");
        let daySchedule = location.schedule[targetDay];
        if (!daySchedule)
            throw new Error(`The day ${targetDay} could not be found in the schedule of ${groupName} at site ${site_description}`);
        let booking = daySchedule.bookings.find(({ Start_date }) => new Date(Start_date).getDate() === date.getDate());

        // Check if there was such a booking
        if (!booking)
            throw new Error(`Booking with name ${groupName}, at date ${date.toString()} did not exist`);
        return booking;
    }


    /**
         _____         _  _                _____                             _____                     
        |  _  |       | |(_)              |  __ \                           |  _  |                    
        | | | | _ __  | | _  _ __    ___  | |  \/ _ __  ___   _   _  _ __   | | | | _ __    ___  _ __  
        | | | || '_ \ | || || '_ \  / _ \ | | __ | '__|/ _ \ | | | || '_ \  | | | || '_ \  / _ \| '_ \ 
        \ \_/ /| | | || || || | | ||  __/ | |_\ \| |  | (_) || |_| || |_) | \ \_/ /| |_) ||  __/| | | |
         \___/ |_| |_||_||_||_| |_| \___|  \____/|_|   \___/  \__,_|| .__/   \___/ | .__/  \___||_| |_|
                                                                    | |            | |                 
                                                                    |_|            |_|                 
     */

    /**
     * Reserves a spot with the information about the booking fetched at an earlier time
     * @see prepareReservation()
     * @param prepared the prepared booking
     * @returns the booking id of the newly created booking
     */
    protected async reserveOnlineGroupOpen(prepared: ReserveOGOpen): Promise<number>;
    /**
     * [TOKENLESS] Reserves a spot with the information about the booking fetched at an earlier time
     * @see prepareReservation()
     * @param prepared the prepared booking.
     * @param token the token of the user
     * @returns the booking id of the newly created booking
     */
    protected async reserveOnlineGroupOpen(prepared: ReserveOGOpen, token: string): Promise<number>;
    /**
     * [TOKENLESS] Reserves a spot with the information about the booking fetched at an earlier time
     * @see prepareReservation()
     * @param prepared the prepared booking
     * @param token the token of the user
     * @returns the booking id of the newly created booking
     */
    protected async reserveOnlineGroupOpen(prepared: ReserveOGOpen, token: Token): Promise<number>;
    /**
     * Creates a reservation for an Online Group Open
     * @param groupName The name of the group
     * @returns the booking id of the newly created booking
     */
    protected async reserveOnlineGroupOpen(groupName: string): Promise<number>;
    /**
     * Creates a reservation for an Online Group Open
     * @param groupName The name of the group
     * @param description The description of the group
     * @param date the date for the slot
     * @returns the booking id of the newly created booking
     */
    protected async reserveOnlineGroupOpen(groupName: string, description: string, date: Date): Promise<number>;
    /**
     * [TOKENLESS] Creates a reservation for an Online Group Open
     * @param groupName The name of the group
     * @param description The description of the group
     * @param date the date for the slot
     * @param token the token of the user
     * @returns the booking id of the newly created booking
     */
    protected async reserveOnlineGroupOpen(groupName: string, description: string, date: Date, token: string): Promise<number>;
    /**
     * [TOKENLESS] Creates a reservation for an Online Group Open
     * @param groupName The name of the group
     * @param description The description of the group
     * @param date the date for the slot
     * @param token the token of the user
     * @returns the booking id of the newly created booking
     */
    protected async reserveOnlineGroupOpen(groupName: string, description: string, date: Date, token: Token): Promise<number>;
    protected async reserveOnlineGroupOpen(groupName_or_prepared: string | ReserveOGOpen, description_or_token?: string | Token, date: Date = new Date(), token: Token = this.token): Promise<number> {
        // Check if the first argument is not a prepared statement
        if (typeof groupName_or_prepared === "string") {
            // Check if description is provided
            if (!description_or_token)
                throw new Error("Description was not provided");
            return await this.reserveOnlineGroupOpen_Arguments(groupName_or_prepared, description_or_token, date, token);
        }

        // Otherwise it is a prepared statement
        return await this.reserveOnlineGroupOpen_Prepared(groupName_or_prepared, description_or_token);
    }

    private async reserveOnlineGroupOpen_Prepared(prepared: ReserveOGOpen): Promise<number>
    private async reserveOnlineGroupOpen_Prepared(prepared: ReserveOGOpen, token: string): Promise<number>
    private async reserveOnlineGroupOpen_Prepared(prepared: ReserveOGOpen, token: Token): Promise<number>
    private async reserveOnlineGroupOpen_Prepared(prepared: ReserveOGOpen, token: Token = this.token): Promise<number> {
        return await (await this.addReservationBooking(prepared.emptySlot, prepared.targetProduct, token)).booking_id;
    }

    private async reserveOnlineGroupOpen_Arguments(groupName: string, description: string): Promise<number>
    private async reserveOnlineGroupOpen_Arguments(groupName: string, description: string, date: Date): Promise<number>
    private async reserveOnlineGroupOpen_Arguments(groupName: string, description: string, date: Date, token: Token): Promise<number>
    private async reserveOnlineGroupOpen_Arguments(groupName: string, description: string, date: Date, token: string): Promise<number>
    private async reserveOnlineGroupOpen_Arguments(groupName: string, description: string, date: Date = new Date(), token: Token = this.token): Promise<number> {
        // Check if initialized
        if (!this.initialized) {
            logger.warn(`A function was called without initializing the API Client, please call init() first, this time we did it for you`);
            await this.init();
        }

        // find the product
        let targetProduct = await this.findOnlineGroupOpenProduct(groupName, description, token);
        // see if there is an empty slot
        let emptySlot = await this.findOnlineGroupOpenBooking(targetProduct, date, token);
        // Reserve the slot
        return await (await this.addReservationBooking(emptySlot, targetProduct, token)).booking_id;
    }

    /**
     * Returns an Online Group Open product, given a name and description
     * @param groupName the name of the group
     * @param description description of the group
     * @returns the product
     */
    protected async findOnlineGroupOpenProduct(groupName: string, description: string): Promise<Product>;

    /**
     * [TOKENLESS] Returns an Online Group Open product, given a name and description
     * @param groupName the name of the group
     * @param description description of the group
     * @param token the token of the user
     * @returns the product
     */
    protected async findOnlineGroupOpenProduct(groupName: string, description: string, token: string): Promise<Product>;
    /**
     * [TOKENLESS] Returns an Online Group Open product, given a name and description
     * @param groupName the name of the group
     * @param description description of the group
     * @param token the token of the user
     * @returns the product
     */
    protected async findOnlineGroupOpenProduct(groupName: string, description: string, token: Token): Promise<Product>;
    protected async findOnlineGroupOpenProduct(groupName: string, description: string, token: Token = this.token): Promise<Product> {
        // Check if initialized
        if (!this.initialized) {
            logger.warn(`A function was called without initializing the API Client, please call init() first, this time we did it for you`);
            await this.init();
        }

        // Retrieve the online group
        let onlineGroupOpen = this.info.onlineGroupsOpen[groupName];

        if (!onlineGroupOpen.products) {
            onlineGroupOpen.products = {};
            // Gather all info (with some detailed explanation)
            let allProducts = await (await this.getProductsByOnlineGroup(onlineGroupOpen, undefined, token)).Products; // Get all products (the API only returns a description and an ID)
            let resolvedProducts = await Promise.all(allProducts.map(prod => this.getProductById(prod, token))) // Get the full information for each product
            resolvedProducts.forEach(el => {
                onlineGroupOpen.products![el.Product.Description] = el.Product; // store each product
            })
        }

        let targetProduct = onlineGroupOpen.products[description];
        if (!targetProduct)
            throw new Error(`Booking with name ${groupName}, and description ${description} does not exist`);

        return targetProduct;
    }

    /**
     * Finds a booking, given a product and the date
     * @param product the product to be reserved
     * @param date the date for which the product needs to be reserved
     * @returns an empty slot
     */
    protected async findOnlineGroupOpenBooking(product: Product, date: Date): Promise<Procedures.EmptySlot>;
    /**
     * [TOKENLESS] Finds a booking, given a product and the date
     * @param product the product to be reserved
     * @param date the date for which the product needs to be reserved
     * @param token the token of the user
     * @returns an empty slot
     */
    protected async findOnlineGroupOpenBooking(product: Product, date: Date, token: Token): Promise<Procedures.EmptySlot>;
    /**
     * [TOKENLESS] Finds a booking, given a product and the date
     * @param product the product to be reserved
     * @param date the date for which the product needs to be reserved
     * @param token the token of the user
     * @returns an empty slot
     */
    protected async findOnlineGroupOpenBooking(product: Product, date: Date, token: Token): Promise<Procedures.EmptySlot>;
    protected async findOnlineGroupOpenBooking(product: Product, date: Date = new Date(), token: Token = this.token): Promise<Procedures.EmptySlot> {
        // Retrieve the available slots (as the schedule is highly dynamic, this will always be refreshed)
        let retrieveSlots = await this.getAvailableSlots(product, date, token);
        product.availableSlots = {};
        // Store available slots
        retrieveSlots.Divided_slots.forEach(el => {
            product.availableSlots![el.Start_date] = el;
        })

        let targetStartTime = dayjs(date).format("YYYY-MM-DD HH:mm");
        let emptySlot = product.availableSlots[targetStartTime];
        if (!emptySlot)
            throw new Error(`Spot at ${product.Description} at time ${date.toString()} does not exist`);

        return emptySlot;
    }


    /**
        ______                _     _                    
        | ___ \              | |   (_)                   
        | |_/ /  ___    ___  | | __ _  _ __    __ _  ___ 
        | ___ \ / _ \  / _ \ | |/ /| || '_ \  / _` |/ __|
        | |_/ /| (_) || (_) ||   < | || | | || (_| |\__ \
        \____/  \___/  \___/ |_|\_\|_||_| |_| \__, ||___/
                                            __/ |     
                                            |___/      
    */

    /**
     * Checks if a booking exists
     * @param booking the number of the booking
     * @returns true, if the booking was found
     */
    async checkBooking(bookingNumber: number): Promise<boolean>
    /**
     * [TOKENLESS] Checks if a booking exists
     * @param booking the number of the booking
     * @param token the token of the user
     * @returns true, if the booking was found
     */
    async checkBooking(bookingNumber: number, token: string): Promise<boolean>
    /**
     * [TOKENLESS] Checks if a booking exists
     * @param booking the number of the booking
     * @param token the token of the user
     * @returns true, if the booking was found
     */
    async checkBooking(bookingNumber: number, token: Token): Promise<boolean>
    async checkBooking(bookingNumber: number, token: Token = this.token): Promise<boolean> {
        await this.updateBookings(token);
        if (this.info.bookings![bookingNumber])
            return true;
        return false;
    }

    /**
     * Finds a booking from its ID
     * @param booking_ID the ID of the booking
     * @returns A booking
     */
    async findBooking(booking_ID: number): Promise<Procedures.Booking>;
    /**
     * [TOKENLESS] Finds a booking from its ID
     * @param booking_ID the ID of the booking
     * @param token the toke of the user
     * @returns A booking
     */
    async findBooking(booking_ID: number, token: string): Promise<Procedures.Booking>;
    /**
     * [TOKENLESS] Finds a booking from its ID
     * @param booking_ID the ID of the booking
     * @param token the toke of the user
     * @returns A booking
     */
    async findBooking(booking_ID: number, token: Token): Promise<Procedures.Booking>;
    async findBooking(booking_ID: number, token: Token = this.token): Promise<Procedures.Booking> {
        // Update bookings
        let bookings = await (await this.myBookings(token)).mybookings;
        // Retrieve the booking
        let booking = bookings![booking_ID];
        // Check if the booking exists
        if (!booking)
            throw new Error(`Could not find booking number ${booking_ID}`);
        // Return the booking
        return booking;
    }

    /**
     * Updates the bookings that the user has
     */
    async updateBookings(): Promise<void>
    /**
     * [TOKENLESS] Updates the bookings that the user has
     * @param token the token of the user
     */
    async updateBookings(token: string): Promise<void>;
    /**
     * [TOKENLESS] Updates the bookings that the user has
     * @param token the token of the user
     */
    async updateBookings(token: Token): Promise<void>;
    async updateBookings(token: Token = this.token): Promise<void> {
        this.info.bookings = {};
        let allBookings = await this.myBookings(token);

        allBookings.mybookings.forEach(el => {
            this.info.bookings![el.booking_id] = el;
        })
    }


    /**
        ______                                                           _   _____  _          _                                 _        
        | ___ \                                                         | | /  ___|| |        | |                               | |       
        | |_/ /_ __  ___  _ __   _ __  ___  _ __    __ _  _ __  ___   __| | \ `--. | |_  __ _ | |_  ___  _ __ ___    ___  _ __  | |_  ___ 
        |  __/| '__|/ _ \| '_ \ | '__|/ _ \| '_ \  / _` || '__|/ _ \ / _` |  `--. \| __|/ _` || __|/ _ \| '_ ` _ \  / _ \| '_ \ | __|/ __|
        | |   | |  |  __/| |_) || |  |  __/| |_) || (_| || |  |  __/| (_| | /\__/ /| |_| (_| || |_|  __/| | | | | ||  __/| | | || |_ \__ \
        \_|   |_|   \___|| .__/ |_|   \___|| .__/  \__,_||_|   \___| \__,_| \____/  \__|\__,_| \__|\___||_| |_| |_| \___||_| |_| \__||___/
                        | |               | |                                                                                            
                        |_|               |_|                                                                                            
     */

    /**
     * Prepares a statement to reserve a spot
     * @param groupName the name of the group
     * @param date the date at which the slot is reserved
     * @param description the description of the slot
     * @returns a prepared statement
     */
    async prepareReservation(groupName: string, date: Date, description: string): Promise<ReserveOG | ReserveOGOpen>;
    /**
     * [TOKENLESS] Prepares a statement to reserve a spot
     * @param groupName the name of the group
     * @param date the date at which the slot is reserved
     * @param description the description of the slot
     * @param token the token of the user
     * @returns a prepared statement
     */
    async prepareReservation(groupName: string, date: Date, description: string | undefined, token: string): Promise<ReserveOG | ReserveOGOpen>;
    /**
     * [TOKENLESS] Prepares a statement to reserve a spot
     * @param groupName the name of the group
     * @param date the date at which the slot is reserved
     * @param description the description of the slot
     * @param token the token of the user
     * @returns a prepared statement
     */
    async prepareReservation(groupName: string, date: Date, description: string | undefined, token: Token): Promise<ReserveOG | ReserveOGOpen>;
    async prepareReservation(groupName: string, date: Date, description: string, token: Token = this.token): Promise<ReserveOG | ReserveOGOpen> {
        switch (await this.resolveGroup(groupName, token)) {
            case GroupResponse.OnlineGoup_Open:
                return await this.prepareReservationOnlineGroupOpen(groupName, description, date, token);
            case GroupResponse.OnlineGroup:
                return await this.prepareReservationOnlineGroup(groupName, date, description, undefined, token);
        }
    }

    /**
     * Creates a stetement to reserve a spot
     * @param groupName the name of the group
     * @param description the description of the group
     * @param date the date for which the slot is reserved
     * @returns A prepared statement to reserve a spot
     */
    protected async prepareReservationOnlineGroupOpen(groupName: string, description: string, date: Date): Promise<ReserveOGOpen>;
    /**
     * [TOKENLESS] Creates a stetement to reserve a spot
     * @param groupName the name of the group
     * @param description the description of the group
     * @param date the date for which the slot is reserved
     * @param token the token of the user
     * @returns A prepared statement to reserve a spot
     */
    protected async prepareReservationOnlineGroupOpen(groupName: string, description: string, date: Date, token: string): Promise<ReserveOGOpen>;
    /**
     * [TOKENLESS] Creates a stetement to reserve a spot
     * @param groupName the name of the group
     * @param description the description of the group
     * @param date the date for which the slot is reserved
     * @param token the token of the user
     * @returns A prepared statement to reserve a spot
     */
    protected async prepareReservationOnlineGroupOpen(groupName: string, description: string, date: Date, token: Token): Promise<ReserveOGOpen>;
    protected async prepareReservationOnlineGroupOpen(groupName: string, description: string, date: Date = new Date(), token: Token = this.token): Promise<ReserveOGOpen> {
        // find the product
        let targetProduct = await this.findOnlineGroupOpenProduct(groupName, description, token);
        // see if there is an empty slot
        let emptySlot = await this.findOnlineGroupOpenBooking(targetProduct, date, token);
        // returned a prepared statement
        return {
            action: "ReserveOGOpen",
            targetProduct: targetProduct,
            emptySlot: emptySlot
        };
    };

    /**
     * Prepares a statement, which can be executed without fetching the information one more time
     * @param groupName the name of the group
     * @param date the date at which it should be reserved
     * @returns an object containing all information needed to reserve a spot
     */
    protected async prepareReservationOnlineGroup(groupName: string, date: Date): Promise<ReserveOG>;
    /**
     * [TOKENLESS] Prepares a statement, which can be executed without fetching the information one more time
     * @param groupName the name of the group
     * @param date the date at which it should be reserved
     * @param site_description the description of the site
     * @param schedule_ID the id of the schedule
     * @param token the token of the user
     * @returns an object containing all information needed to reserve a spot
     */
    protected async prepareReservationOnlineGroup(groupName: string, date: Date, site_description: string | undefined, schedule_ID: number | undefined, token: string): Promise<ReserveOG>;
    /**
     * [TOKENLESS] Prepares a statement, which can be executed without fetching the information one more time
     * @param groupName the name of the group
     * @param date the date at which it should be reserved
     * @param site_description the description of the site
     * @param schedule_ID the id of the schedule
     * @param token the token of the user
     * @returns an object containing all information needed to reserve a spot
     */
    protected async prepareReservationOnlineGroup(groupName: string, date: Date, site_description: string | undefined, schedule_ID: number | undefined, token: Token): Promise<ReserveOG>;
    protected async prepareReservationOnlineGroup(groupName: string, date: Date, site_description: string = "X TU Delft", schedule_ID: number = 0, token: Token = this.token): Promise<ReserveOG> {
        return {
            action: "ReserveOG",
            booking: await this.findOnlineGroupBooking(groupName, date, site_description, schedule_ID, token)
        }
    }

    /**
     * executes a command, which was prepared in advance
     * @param command the command which needs to be executed
     * @returns the booking number of the reservation
     */
    async execute(command: PreparedStatement): Promise<number>;
    /**
     * [TOKENLESS] executes a command, which was prepared in advance
     * @param command the command which needs to be executed
     * @param token the token on the user
     * @returns the booking number of the reservation
     */
    async execute(command: PreparedStatement, token: string): Promise<number>;
    /**
     * [TOKENLESS] executes a command, which was prepared in advance
     * @param command the command which needs to be executed
     * @param token the token on the user
     * @returns the booking number of the reservation
     */
    async execute(command: PreparedStatement, token: Token): Promise<number>;
    async execute(command: PreparedStatement, token: Token = this.token): Promise<number> {
        switch (command.action) {
            case "ReserveOG":
                return parseInt((await this.reserveOnlineGroup(command as ReserveOG, token)).Booking_id)
                break;
            case "ReserveOGOpen":
                return await this.reserveOnlineGroupOpen(command as ReserveOGOpen, token);
                break;
            default:
                logger.warn(command, `Execution  of the command ${command.action} was not resolved`);
                throw new Error(`Execution  of the command ${command.action} was not resolved`);
        }
    }
}

export interface PreparedStatement {
    action: string;
};

export interface ReserveOG extends PreparedStatement {
    action: "ReserveOG",
    booking: Procedures.OpenGroupBooking
}

export interface ReserveOGOpen extends PreparedStatement {
    action: "ReserveOGOpen",
    targetProduct: Product,
    emptySlot: Procedures.EmptySlot
}