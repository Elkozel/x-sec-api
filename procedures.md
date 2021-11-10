# Procedures

## User wants to book a spot at the VR
1. Login
2. Version
3. onlineGroups
4. getProductsByOnlineGroup
5. getProductById
6. getAvailableSlots
7. AddReservationBooking
8. myBookings

## User wants to remove a booking


# Requests and Responses

## Login 

### Request

```json
POST /users/login

{
  "license": "[LICENSE]",
  "customer_id": "[CUSTOMER_ID]",
  "token": "[TOKEN]",
  "remember": false,
  "pushid": "AppPushID"
}
```

### Successful Response
```json
{
    "response": 0,
    "message": "Logged in",
    "user": {
        "id": "[USER_ID]",
        "token": "[TOKEN]",
        "key": "",
        "username": "",
        "first_name": "[FIRST_NAME]",
        "last_name": "[LAST_NAME]",
        "zipcode": null,
        "email": "[EMAIL]",
        "phonenumber": "[PHONE]",
        "user_type": "[number]",
        "user_allownewsposts": ,
        "image_file": "https://0072.api.dmssolutions.eu/images/user?token=[TOKEN]",
        "title": null,
        "rank": "",
        "subscription_status": "",
        "last_visit": "[LAST_VISIT]",
        "last_login": "",
        "next_appointment": {
            "date": "",
            "description": ""
        },
        "trainer": {
            "id": "",
            "first_name": "[TRAINER_FIRST_NAME]",
            "last_name": "[TRAINER_LAST_NAME]",
            "image_file": "https://0072.api.dmssolutions.eu/images/user?id=0&token=[TOKEN]"
        },
        "has_openid": true,
        "member_id": "",
        "trainer_id": "",
        "registration_date": "",
        "category": "",
        "card_nr": ""
    }
}
```

### Fail Response
```
```

## Check Version

### Request

```json
POST /users/CheckVersion

{
  "license": "[LICENSE]",
  "customer_id": "[CUSTOMER_ID]",
  "version": "1.0.0"
}
```

### Successful Response
```json
"Versions matched"
```

### Fail Response
```json
```

## Online Groups

### Request

```json
POST /bookings/onlineGroups

{
  "license": "[LICENSE]",
  "customer_id": "[CUSTOMER_ID]",
  "token": "[TOKEN]"
}
```

### Successful Response
onlinegroup have the title "Enrol for Ticket Hour"

onlinegroup_open have the title "Book Space/Equipment"


```json
{
    "response": 0,
    "message": "Got 19 onlineGroups",
    "onlinegroups": [
        {
            "online_group": "ACTlab"
        }
    ],
    "onlinegroups_open": [
        {
            "online_group": "ACTlab VR Booths"
        }
    ]
}
```

### Fail Response
```json
```

## Get Products By Online Group
The method is called when an Online Group from the onlinegroups_open list is selected.

### Request

```json
POST /bookings/getProductsByOnlineGroup

{
  "license": "[LICENSE]",
  "customer_id": "[CUSTOMER_ID]",
  "token": "[TOKEN]",
  "online_group": "ACTlab VR Booths",
  "site_id": 0
}
```

### Successful Response
```json
{
    "Products": [
        {
            "Product_id": "16646",
            "Description": "VR Booth 1"
        }
    ]
}
```

### Fail Response
```json
```

## Get Product By Id 

### Request

```json
POST /bookings/getProductById

{
  "license": "[LICENSE]",
  "customer_id": "[CUSTOMER_ID]",
  "token": "[TOKEN]",
  "Product_id": "16646"
}
```

### Successful Response
```json
{
    "Product_exists": true,
    "Product": {
        "Product_id": "16646",
        "Description": "VR Booth 1",
        "Type": "0",
        "Admin_code": "",
        "Price": "0.00",
        "Category_1_price": "0.00",
        "Category_2_price": "0.00",
        "Category_3_price": "0.00",
        "Prep_time": "0",
        "Dism_time": "0",
        "Slot_size": "60",
        "Max_participants": "1"
    }
}
```

### Fail Response
```json
```

## Get Available Slots 

### Request

```json
POST /bookings/getAvailableSlots

{
  "license": "[LICENSE]",
  "customer_id": "[CUSTOMER_ID]",
  "token": "[TOKEN]",
  "product_id": "16646",
  "date": "1-1-1970"
}
```

### Successful Response
Divided slots are the ones shown to the client

```json
{
    "Message": "Got 3 slot(s)",
    "Server_time": "1970-01-01 00:00:00",
    "Empty_slots": [
        {
            "Start_date": "1970-01-01 00:00",
            "End_date": "1970-01-01 00:00"
        },
        {
            "Start_date": "1970-01-01 00:00",
            "End_date": "1970-01-01 00:00"
        },
        {
            "Start_date": "1970-01-01 00:00",
            "End_date": "1970-01-01 00:00"
        },
        {
            "Start_date": "1970-01-01 00:00",
            "End_date": "1970-01-01 00:00"
        }
    ],
    "Divided_slots": [
        {
            "Start_date": "1970-01-01 00:00",
            "End_date": "1970-01-01 00:00"
        },
        {
            "Start_date": "1970-01-01 00:00",
            "End_date": "1970-01-01 00:00"
        },
        {
            "Start_date": "1970-01-01 00:00",
            "End_date": "1970-01-01 00:00"
        }
    ],
    "Prep_time": "0",
    "Dism_time": "0",
    "Slot_size": "60",
    "Slot_price": "0.00",
    "Min_participants": "1",
    "Online_tennis": "0"
}
```

### Fail Response
```json
```

## Add Reservation Booking 

### Request

```json
POST /Bookings/AddReservationBooking

{
  "license": "[LICENSE]",
  "customer_id": "[CUSTOMER_ID]",
  "token": "[TOKEN]",
  "product_id": "16646",
  "start_date": "1970-01-01 00:00",
  "end_date": "1970-01-01 00:00",
  "price": "0.00"
}
```

### Successful Response
```json
{
    "response": 0,
    "message": "booking, visit and sales added",
    "booking_id": 0
}
```

### Fail Response
```json
```



## My Bookings 

### Request

```json
POST /bookings/myBookings

{
  "license": "[LICENSE]",
  "customer_id": "[CUSTOMER_ID]",
  "token": "[TOKEN]"
}
```

### Successful Response
```json
{
    "response": 0,
    "message": "Got 1 booking(s)",
    "mybookings": [
        {
            "booking_id": "[BOOKING_ID]",
            "bezetting": "",
            "locatie": "VR Booth 1",
            "sportomschrijving": "Booking on VR Booth 1",
            "site": "X TU Delft",
            "start_date": "Mon 01 Jan",
            "end_time": "00:00",
            "trainer": null,
            "memo": null,
            "online_all": "",
            "amount": "0.00",
            "paid": "0",
            "start_time": "00:00"
        }
    ]
}
```

### Fail Response
```json
```

## Cancel Reservation Booking 

### Request

```json
POST /bookings/CancelReservationBooking

{
  "license": "[LICENSE]",
  "customer_id": "[CUSTOMER_ID]",
  "token": "[TOKEN]",
  "booking_id": "1038935"
}
```

### Successful Response
```json
{
    "response": 0,
    "message": "Got 0 booking(s), deleted booking",
    "mybookings": []
}
```

### Fail Response
```json
```


## Unique Locations By Online Group 

### Request

```json
POST /bookings/UniqueLocationsByOnlineGroup

{
  "license": "[LICENSE]",
  "customer_id": "[CUSTOMER_ID]",
  "token": "[TOKEN]",
  "onlinegroup": "ACTlab"
}
```

### Successful Response
```json
{
    "response": 0,
    "message": "Got 1 location(s)",
    "uniquelocationsbyonlinegroup": [
        {
            "site_id": "0",
            "description": "X TU Delft"
        }
    ],
    "uniquelocationsbyonlinegroup_open": []
}
```

### Fail Response
```json
```
## Schedule 

### Request

```json
POST /bookings/schedule

{
  "license": "[LICENSE]",
  "customer_id": "[CUSTOMER_ID]",
  "token": "[TOKEN]",
  "trainer": "",
  "onlinegroup": "Fitness Time-Slots",
  "cmsid": "",
  "amount_of_days": 365,
  "site": "0"
}
```

### Successful Response
Of course the arrays are full
```json
{
    "response": 0,
    "message": "Got 880 booking(s)",
    "schedule": [
        {
            "day": "01-01-1970",
            "bookings": [
                {
                    "Booking_id": "[BOOKING_ID]",
                    "Start_date": "1970-01-01 00:00:00",
                    "End_date": "1970-01-01 00:00:00",
                    "Max_participants": 30,
                    "Description": "Fitness Time-Slot",
                    "Trainer": "Onbekend",
                    "Memo": null,
                    "Cms_id": null,
                    "Online_status": "0",
                    "Product_id": "18782",
                    "Location": "Fitness Time-slots",
                    "Max_product_participants": "15",
                    "Online_display_time": null,
                    "Online_start_time": null,
                    "Start_time": "00:00",
                    "End_time": "00:00",
                    "Site_id": 0,
                    "Site": "X TU Delft",
                    "Booked": false,
                    "Available": false,
                    "Bezetting": 30,
                    "Aanwezig": 5,
                    "Day_of_the_week": "1"
                }
            ]
        },
        {
            "day": "01-01-1970",
            "bookings": []
        }
    ]
}
```

### Fail Response
```json
```
## Add Booking 

### Request

```json
POST /bookings/addBooking

{
  "license": "[LICENSE]",
  "customer_id": "[CUSTOMER_ID]",
  "token": "[TOKEN]",
  "booking_id": "[BOOKING_ID]"
}
```

### Successful Response
```json
{
    "response": 0,
    "message": "booking added"
}
```

### Fail Response
```json
```