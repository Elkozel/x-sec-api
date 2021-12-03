import * as fs from "fs";
import { APIClient } from "./src/classes/APIClient";

const { URL, token, customer_id, license } = JSON.parse(fs.readFileSync("data/sensitive.json", "UTF-8"));

var client = new APIClient(customer_id, license, token, URL);

async function a() {
    let booking = await client.reserve("Sports Halls", new Date("2021-12-05 08:00"), "X2 A - Time-Slots");
    console.log(`Booking complete: ${booking}`);
}