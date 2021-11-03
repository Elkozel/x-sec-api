# API Client for the TU Delft X Sports Center

## Description
The project is intended to have a fun interaction with the Burp Suite and gather a deeper understanding inside how the API works.

## Disclamer
This project is intended for **informational** and **educational** purposes! This product should not be used for any malicious purposes or harm!

## Install
To install the API, just clone the GIT repository with and install with NPM
```
git clone https://github.com/Elkozel/x-api
cd ./x-api
npm install .
```

## Terminoligy
Explains the basic terminology used by the API:

OnlineGroup *contains* Product *contains* Slot ... etc

## Code

### Interfaces
The interfaces will be explained in a simple way, if you would like to see more information, please take a look at the code

**DefaultResponse** - the minimal response expected for a successful operation

**DefaultErrorResponse** - the expected response for an error returned from the server

**OnlineGroup** - an online group (e.g. "Tennis Courts", "Beach Volleyball Courts", "Fitness Time-Slots", etc.)

**OnlineGroupsResponse** - the usual response when all online groups are requested

**Product** - a product (e.g. the different tennis courts, sports halls, etc.)

**ProductByIdResponse** - the usual response when a product by ID is retrieved

**Slot** - a slot (e.g. a slot from {time} to {time} for tennis court {number})

**AvailableSpotsResponse** - the usual response when all available slots are requested
    
**Booking** - a booking

### Functions
Same information as in the tsdoc:

**getBaseJSON** - Returns an Object with the minimal information required for a request plus the information from the additionally provided object

**checkVersion** - Checks if the version of the API is complient with the current version

**onlineGroups** - Retrieves all Online Groups

**getProductsByOnlineGroup** - Gets all products by online group

**getProductById** - Gets additional information about a product, based on its ID

**getAvailableSlots** - Returns all available slots for a product on the specified date

**addReservationBooking** - Adds a reservation for the product on the specified slot

**addBooking** - Adds a booking to the account of the user

**myBookings** - Retrieves all bookings of the customer

**cancelBooking** - Cancels a booking