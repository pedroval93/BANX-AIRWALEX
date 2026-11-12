import "server-only";
import { createAirwallexClient } from "./client";
import { createDemoIssuing } from "./demo";
import type { IssuingApi } from "./types";

const BASE_URLS = {
  sandbox: "https://api.sandbox.airwallex.com",
  production: "https://api.airwallex.com",
} as const;

/** Sin claves de Airwallex la app usa datos de ejemplo. */
export function isDemoMode(): boolean {
  return !process.env.AIRWALLEX_CLIENT_ID || !process.env.AIRWALLEX_API_KEY;
}

let client: IssuingApi | null = null;

export function getIssuing(): IssuingApi {
  if (isDemoMode()) return createDemoIssuing();
  if (!client) {
    const env = process.env.AIRWALLEX_ENV === "production" ? "production" : "sandbox";
    client = createAirwallexClient({
      clientId: process.env.AIRWALLEX_CLIENT_ID!,
      apiKey: process.env.AIRWALLEX_API_KEY!,
      baseUrl: BASE_URLS[env],
    });
  }
  return client;
}

export { AirwallexError } from "./client";
export type * from "./types";
