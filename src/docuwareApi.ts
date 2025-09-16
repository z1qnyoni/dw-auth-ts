import axios from "axios";
import "dotenv/config";
import { getAccessToken } from "./docuwareAuth.js";

const PLATFORM_URL = (process.env.DW_PLATFORM_URL ?? "").replace(/\/$/, "");
if (!PLATFORM_URL) throw new Error("DW_PLATFORM_URL is required");

export const dw = axios.create({
  baseURL: PLATFORM_URL,
  timeout: 60000,
});

dw.interceptors.request.use(async (config) => {
  const token = await getAccessToken();
  config.headers.set("Authorization", `Bearer ${token}`);
  config.headers.set("Accept", "application/json");
  return config;
});

dw.interceptors.response.use(
  (r) => r,
  async (error) => {
    const { response, config } = error ?? {};
    if (response?.status === 401 && config && !(config as any)._retried) {
      (config as any)._retried = true;
      // force refresh token and retry request
      await getAccessToken();
      return dw.request(config);
    }
    throw error;
  }
);
