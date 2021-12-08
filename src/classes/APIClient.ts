import { default as dayjs } from 'dayjs';
import { APIInstance } from "./APIInstance";
import * as Procedures from "../interfaces/interfaces";
import pino from "pino";
const logger = pino({
    name: "API Client"
})


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

export class APIClient {
    protected info: APIInfo = { // Information, retrieved from the API
        onlineGroups: {},
        onlineGroupsOpen: {}
    };
    protected api: APIInstance; // The API instance used to issue the calls
    private initialized = false;

    /**
     * Creates an API Client instance, which handles the functionallity of the API
     * @param customer_id the ID of the customer
     * @param license the licence of the customer
     * @param token the token, belonging to the user
     * @param URL the URL to which the API should connect
     */
    constructor(customer_id: string, license: string, token: string, URL: string) {
        this.api = new APIInstance(customer_id, license, token, URL);
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
    async init(): Promise<void> {
        logger.info(`Initializing API Client`);

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
    protected async resolveGroup(groupName: string): Promise<GroupResponse> {
        // Check if initialized
        if (!this.initialized) {
            logger.warn(`A function was called without initializing the API Client, please call init() first, this time we did it for you`);
            await this.init();
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
     * Reserves a spot for the given group
     * @param groupName the name of the group
     * @param date the date at which it should be booked as a string
     * @param description the description of the place (Only applicable for OnlineGroups Open)
     * @returns the booking object from the bookings of the user
     */
    async reserve(groupName: string, date: string, description?: string): Promise<Procedures.Booking>;
    /**
     * Reserves a spot for a given group as a given time
     * @param groupName the name of the group
     * @param date the date at which the it should be booked as a Date object
     * @param description the description of the group (only used if an Online Group Open is reserved)
     */
    async reserve(groupName: string, date: Date, description?: string): Promise<Procedures.Booking>;
    async reserve(groupName: string, date: string | Date, description?: string): Promise<Procedures.Booking> {
        // Check if initialized
        if (!this.initialized) {
            logger.warn(`A function was called without initializing the API Client, please call init() first, this time we did it for you`);
            await this.init();
        }

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
     * Reserves a spot with the information about the booking fetched at an earlier time (please see function prepareReservationOnlineGroup())
     * @param prepared a preprepared booking
     */
    protected async reserveOnlineGroup(prepared: ReserveOG): Promise<Procedures.OpenGroupBooking>;
    /**
     * Books a spot for an Online Group
     * @param groupName the name of the Online Group
     * @param targetDay the day, which is targeted
     * @param startTime the start time of the slot
     * @returns the booking, which should be booked
     */
    protected async reserveOnlineGroup(groupName: string, date?: Date, site_description?: string, schedule_ID?: number): Promise<Procedures.OpenGroupBooking>;
    protected async reserveOnlineGroup(groupName: string | ReserveOG, date?: Date, site_description: string = "X TU Delft", schedule_ID: number = 0): Promise<Procedures.OpenGroupBooking> {
        // Check if initialized
        if (!this.initialized) {
            logger.warn(`A function was called without initializing the API Client, please call init() first, this time we did it for you`);
            await this.init();
        }
        // Retrieve the booking
        let booking;
        if (typeof groupName === "string") {
            if (!date) // Check if the date is defined
                throw new Error(`Date was not provided for booking of ${groupName}`)
            booking = await this.findOnlineGroupBooking(groupName, date, site_description, schedule_ID);
        }
        else
            booking = groupName.booking;
        await this.api.addBooking(booking);
        await this.checkBooking(parseInt(booking.Booking_id));
        return booking;
    }

    /**
     * Finds an online booking
     * @param groupName the name of the group
     * @param date the date of the booking
     * @param site_description the description of the site
     * @param schedule_ID the ID of the schedule used
     * @returns an open booking in formation
     */
    protected async findOnlineGroupBooking(groupName: string, date: Date, site_description: string = "X TU Delft", schedule_ID: number = 0): Promise<Procedures.OpenGroupBooking> {
        // Check if initialized
        if (!this.initialized) {
            logger.warn(`A function was called without initializing the API Client, please call init() first, this time we did it for you`);
            await this.init();
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
     * Reserves a spot with the information about the booking fetched at an earlier time (please see function prepareReservationOnlineGroupOpen())
     * @param prepared the prepared booking
     */
    protected async reserveOnlineGroupOpen(prepared: ReserveOGOpen): Promise<number>;
    /**
     * Creates a reservation for an Online Group Open
     * @param groupName The name of the group
     * @param description The description of the group
     * @param start_date the start date of the slot
     * @param date the date for which the slot belongs
     * @returns the booking id of the newly created booking
     */
    protected async reserveOnlineGroupOpen(groupName: string, description?: string, date?: Date): Promise<number>;
    protected async reserveOnlineGroupOpen(groupName: string | ReserveOGOpen, description?: string, date: Date = new Date()): Promise<number> {
        // Check if initialized
        if (!this.initialized) {
            logger.warn(`A function was called without initializing the API Client, please call init() first, this time we did it for you`);
            await this.init();
        }
        // See if a prepared statement was passed to the function
        if (typeof groupName !== "string")
            return await (await this.api.addReservationBooking(groupName.emptySlot, groupName.targetProduct)).booking_id;
        // Check if description is provided
        if (!description)
            throw new Error("Description was not provided");
        // find the product
        let targetProduct = await this.findOnlineGroupOpenProduct(groupName, description);
        // see if there is an empty slot
        let emptySlot = await this.findOnlineGroupOpenBooking(targetProduct, date);
        // Reserve the slot
        return await (await this.api.addReservationBooking(emptySlot, targetProduct)).booking_id;
    }

    /**
     * Returns an Online Group Open product, given a name and description
     * @param groupName the name of the group
     * @param description description of the group
     * @returns the product
     */
    protected async findOnlineGroupOpenProduct(groupName: string, description: string): Promise<Product> {
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
            let allProducts = await (await this.api.getProductsByOnlineGroup(onlineGroupOpen)).Products; // Get all products (the API only returns a description and an ID)
            let resolvedProducts = await Promise.all(allProducts.map(prod => this.api.getProductById(prod))) // Get the full information for each product
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
    protected async findOnlineGroupOpenBooking(product: Product, date: Date = new Date()): Promise<Procedures.EmptySlot> {
        // Retrieve the available slots (as the schedule is highly dynamic, this will always be refreshed)
        let retrieveSlots = await this.api.getAvailableSlots(product, date);
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
    async checkBooking(bookingNumber: number): Promise<boolean> {
        await this.updateBookings();
        if (this.info.bookings![bookingNumber])
            return true;
        return false;
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
    async prepareReservation(groupName: string, date: Date, description: string): Promise<ReserveOG | ReserveOGOpen> {
        switch (await this.resolveGroup(groupName)) {
            case GroupResponse.OnlineGoup_Open:
                return await this.prepareReservationOnlineGroupOpen(groupName, description, date);
            case GroupResponse.OnlineGroup:
                return await this.prepareReservationOnlineGroup(groupName, date, description);
        }
    }

    /**
     * Creates a stetement to reserve a spot
     * @param groupName the name of the group
     * @param description the description of the group
     * @param date the date for which the slot is reserved
     * @returns A prepared statement to reserve a spot
     */
    protected async prepareReservationOnlineGroupOpen(groupName: string, description: string, date: Date = new Date()): Promise<ReserveOGOpen> {
        // find the product
        let targetProduct = await this.findOnlineGroupOpenProduct(groupName, description);
        // see if there is an empty slot
        let emptySlot = await this.findOnlineGroupOpenBooking(targetProduct, date);
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
     * @param site_description the description of the site
     * @param schedule_ID the id of the schedule
     * @returns an object containing all information needed to reserve a spot
     */
    protected async prepareReservationOnlineGroup(groupName: string, date: Date, site_description: string = "X TU Delft", schedule_ID: number = 0): Promise<ReserveOG> {
        return {
            action: "ReserveOG",
            booking: await this.findOnlineGroupBooking(groupName, date, site_description, schedule_ID)
        }
    }

    /**
     * executes a command, which was prepared in advance
     * @param command the command which needs to be executed
     */
    async execute(command: PreparedStatement) {
        switch (command.action) {
            case "ReserveOG":
                this.reserveOnlineGroup(command as ReserveOG);
                break;
            case "ReserveOGOpen":
                this.reserveOnlineGroupOpen(command as ReserveOGOpen);
                break;
            default:
                logger.warn(command, `Execution  of the command ${command.action} was not resolved`);
                throw new Error(`Execution  of the command ${command.action} was not resolved`);
        }
    }
}

interface PreparedStatement {
    action: string;
};

interface ReserveOG extends PreparedStatement {
    action: "ReserveOG",
    booking: Procedures.OpenGroupBooking
}

interface ReserveOGOpen extends PreparedStatement {
    action: "ReserveOGOpen",
    targetProduct: Product,
    emptySlot: Procedures.EmptySlot
}