export interface APIRequest { };

export interface APIResponse { };

export interface DefaultRequest extends APIRequest {
    license: string;
    customer_id: string;
    token: string;
}

export interface DefaultResponse extends APIResponse {
    response: number,
    message: string
}

export interface DefaultSuccessResponse extends DefaultResponse { }

export interface DefaultErrorResponse extends DefaultResponse {
    error: {
        reason: string,
        message: string
    },
    code: number
}

export interface Onlinegroup {
    online_group: string;
}

export interface OnlinegroupsOpen {
    online_group: string;
}

export interface EmptySlot {
    Start_date: string;
    End_date: string;
}

export interface DividedSlot {
    Start_date: string;
    End_date: string;
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

export interface NextAppointment {
    date: string;
    description: string;
}

export interface Trainer {
    id: string;
    first_name: string;
    last_name: string;
    image_file: string;
}

export interface User {
    id: string;
    token: string;
    key: string;
    username: string;
    first_name: string;
    last_name: string;
    zipcode?: any;
    email: string;
    phonenumber: string;
    user_type: string;
    user_allownewsposts?: any;
    image_file: string;
    title?: any;
    rank: string;
    subscription_status: string;
    last_visit: string;
    last_login: string;
    next_appointment: NextAppointment;
    trainer: Trainer;
    has_openid: boolean;
    member_id: string;
    trainer_id: string;
    registration_date: string;
    category: string;
    card_nr: string;
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

export interface Uniquelocationsbyonlinegroup {
    site_id: string;
    description: string;
}

export interface Schedule {
    day: string;
    bookings: OpenGroupBooking[];
}

export interface OpenGroupBooking {
    Booking_id: string;
    Start_date: string;
    End_date: string;
    Max_participants: number;
    Description: string;
    Trainer: string;
    Memo?: any;
    Cms_id?: any;
    Online_status: string;
    Product_id: string;
    Location: string;
    Max_product_participants: string;
    Online_display_time?: any;
    Online_start_time?: any;
    Start_time: string;
    End_time: string;
    Site_id: number;
    Site: string;
    Booked: boolean;
    Available: boolean;
    Bezetting: number;
    Aanwezig: number;
    Day_of_the_week: string;
}