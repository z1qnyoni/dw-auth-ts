import axios from "axios";
import qs from "qs";
import "dotenv/config";
import type { OAuthTokenResponse } from "./types.js";

const IDENTITY_URL = (process.env.DW_IDENTITY_URL ?? "").replace(/\/$/, "");
if (!IDENTITY_URL) throw new Error("DW_IDENTITY_URL is required");
const TOKEN_URL = `${IDENTITY_URL}/connect/token`;

const CLIENT_ID = process.env.DW_CLIENT_ID!;
const CLIENT_SECRET = process.env.DW_CLIENT_SECRET ?? "";
const USERNAME = process.env.DW_USERNAME!;
const PASSWORD = process.env.DW_PASSWORD!;
const SCOPE = process.env.DW_SCOPE ?? "docuware.platform dwprofile openid offline_access";

if (!CLIENT_ID || !USERNAME || !PASSWORD) {
  throw new Error("DW_CLIENT_ID, DW_USERNAME, DW_PASSWORD must be set");
}

// runtime state
let accessToken: string | null = null;
let refreshToken: string | null = null;
let accessTokenExpiresAt = 0; // ms epoch
let refreshInFlight: Promise<string> | null = null;

function setTokens(tok: OAuthTokenResponse) {
  accessToken = tok.access_token;
  refreshToken = tok.refresh_token ?? null;
  // update a bit earlier than expiration
  const skewSec = 30;
  const ttl = Math.max(60, tok.expires_in);
  accessTokenExpiresAt = Date.now() + (ttl - skewSec) * 1000;
}

async function tokenRequest(form: Record<string, string>) {
  const body = qs.stringify(form);
  const { data } = await axios.post<OAuthTokenResponse>(TOKEN_URL, body, {
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    timeout: 30000,
    // If needed: httpsAgent with custom certificate and etc.
  });
  setTokens(data);
  return accessToken as string;
}

async function loginWithPassword(): Promise<string> {
  return tokenRequest({
    grant_type: "password",
    username: USERNAME,
    password: PASSWORD,
    client_id: CLIENT_ID,
    ...(CLIENT_SECRET ? { client_secret: CLIENT_SECRET } : {}),
    scope: SCOPE,
  });
}

async function refreshAccessToken(): Promise<string> {
  if (!refreshToken) return loginWithPassword();
  try {
    return await tokenRequest({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
      client_id: CLIENT_ID,
      ...(CLIENT_SECRET ? { client_secret: CLIENT_SECRET } : {}),
    });
  } catch {
    // If refresh token is expired or revoked, login again
    return loginWithPassword();
  }
}

/**
 * Returns a valid access token. It will take care of login/refresh.
 */
export async function getAccessToken(): Promise<string> {
  const valid = accessToken && Date.now() < accessTokenExpiresAt;
  if (valid) return accessToken as string;

  if (!refreshInFlight) {
    refreshInFlight = (accessToken ? refreshAccessToken() : loginWithPassword())
      .finally(() => (refreshInFlight = null));
  }
  return refreshInFlight;
}
