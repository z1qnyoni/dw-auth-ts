import axios from "axios";
import "dotenv/config";

const PLATFORM_URL = (process.env.DW_PLATFORM_URL ?? "").replace(/\/$/, "");
const USERNAME = process.env.DW_USERNAME ?? "";
const PASSWORD = process.env.DW_PASSWORD ?? "";

if (!PLATFORM_URL || !USERNAME || !PASSWORD) {
  throw new Error("Set DW_PLATFORM_URL, DW_USERNAME, DW_PASSWORD in .env");
}

const basic = Buffer.from(`${USERNAME}:${PASSWORD}`).toString("base64");

export const dwBasic = axios.create({
  baseURL: PLATFORM_URL,
  timeout: 60000,
  headers: {
    Authorization: `Basic ${basic}`,
    Accept: "application/xml", // API by default returns XML
  },
});
