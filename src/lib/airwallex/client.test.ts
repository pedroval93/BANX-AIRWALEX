import { describe, expect, it } from "vitest";
import { AirwallexError, createAirwallexClient } from "./client";

type Call = { url: URL; method: string; headers: Record<string, string> };

// Servidor falso de Airwallex: responde por ruta y registra cada llamada.
function fakeAirwallex(routes: Record<string, (url: URL) => { status?: number; body: unknown }>) {
  const calls: Call[] = [];
  const fetchImpl = async (input: string | URL | Request, init?: RequestInit) => {
    const url = new URL(String(input));
    const headers = Object.fromEntries(new Headers(init?.headers).entries());
    calls.push({ url, method: init?.method ?? "GET", headers });
    const handler = routes[`${init?.method ?? "GET"} ${url.pathname}`];
    if (!handler) return new Response(JSON.stringify({ code: "not_found" }), { status: 404 });
    const { status = 200, body } = handler(url);
    return new Response(JSON.stringify(body), { status });
  };
  return { calls, fetchImpl: fetchImpl as typeof fetch };
}

const login = () => ({
  status: 201,
  body: { token: "tok-1", expires_at: new Date(Date.now() + 30 * 60_000).toISOString() },
});

function client(fetchImpl: typeof fetch) {
  return createAirwallexClient({
    clientId: "client-id",
    apiKey: "api-key",
    baseUrl: "https://api.sandbox.airwallex.com",
    fetchImpl,
  });
}

describe("Airwallex client", () => {
  it("logs in with the client id and api key, then sends the bearer token", async () => {
    const { calls, fetchImpl } = fakeAirwallex({
      "POST /api/v1/authentication/login": login,
      "GET /api/v1/issuing/cards/card-1": () => ({
        body: { card_id: "card-1", card_number: "************4111", card_status: "ACTIVE" },
      }),
    });

    const card = await client(fetchImpl).getCard("card-1");

    expect(card.card_id).toBe("card-1");
    expect(calls[0].headers["x-client-id"]).toBe("client-id");
    expect(calls[0].headers["x-api-key"]).toBe("api-key");
    expect(calls[1].headers["authorization"]).toBe("Bearer tok-1");
  });

  it("reuses the token for later requests instead of logging in again", async () => {
    const { calls, fetchImpl } = fakeAirwallex({
      "POST /api/v1/authentication/login": login,
      "GET /api/v1/issuing/cards/card-1": () => ({ body: { card_id: "card-1" } }),
    });
    const api = client(fetchImpl);

    await api.getCard("card-1");
    await api.getCard("card-1");

    expect(calls.filter((c) => c.url.pathname.endsWith("/login"))).toHaveLength(1);
  });

  it("lists every card across pages", async () => {
    const { calls, fetchImpl } = fakeAirwallex({
      "POST /api/v1/authentication/login": login,
      "GET /api/v1/issuing/cards": (url) =>
        url.searchParams.get("page_num") === "0"
          ? { body: { has_more: true, items: [{ card_id: "a" }] } }
          : { body: { has_more: false, items: [{ card_id: "b" }] } },
    });

    const cards = await client(fetchImpl).listCards();

    expect(cards.map((c) => c.card_id)).toEqual(["a", "b"]);
    const listCall = calls.find((c) => c.url.pathname === "/api/v1/issuing/cards")!;
    // Sin rango de fechas Airwallex solo devuelve 30 días; pedimos todo el historial.
    expect(listCall.url.searchParams.get("from_created_at")).toBeTruthy();
    expect(listCall.url.searchParams.get("to_created_at")).toBeTruthy();
  });

  it("lists a card's transactions in a date range following page bookmarks", async () => {
    const { calls, fetchImpl } = fakeAirwallex({
      "POST /api/v1/authentication/login": login,
      "GET /api/v1/issuing/card_transactions": (url) =>
        url.searchParams.get("page")
          ? { body: { items: [{ id: "t2" }], page_after: null } }
          : { body: { items: [{ id: "t1" }], page_after: "next-page" } },
    });

    const txs = await client(fetchImpl).listCardTransactions("card-1", {
      from: "2026-11-01T06:00:00.000Z",
      to: "2026-12-01T05:59:59.999Z",
    });

    expect(txs.map((t) => t.id)).toEqual(["t1", "t2"]);
    const first = calls.find((c) => c.url.pathname === "/api/v1/issuing/card_transactions")!;
    expect(first.url.searchParams.get("card_id")).toBe("card-1");
    expect(first.url.searchParams.get("from_created_at")).toBe("2026-11-01T06:00:00.000Z");
    expect(first.url.searchParams.get("to_created_at")).toBe("2026-12-01T05:59:59.999Z");
    const second = calls.filter((c) => c.url.pathname === "/api/v1/issuing/card_transactions")[1];
    expect(second.url.searchParams.get("page")).toBe("next-page");
  });

  it("reads the sensitive details of a card", async () => {
    const { fetchImpl } = fakeAirwallex({
      "POST /api/v1/authentication/login": login,
      "GET /api/v1/issuing/cards/card-1/details": () => ({
        body: {
          card_number: "4111111111111111",
          cvv: "123",
          expiry_month: 1,
          expiry_year: 2028,
          name_on_card: "ANA LOPEZ",
        },
      }),
    });

    const details = await client(fetchImpl).getCardDetails("card-1");

    expect(details).toEqual({
      card_number: "4111111111111111",
      cvv: "123",
      expiry_month: 1,
      expiry_year: 2028,
      name_on_card: "ANA LOPEZ",
    });
  });

  it("throws an AirwallexError with status and code when Airwallex rejects a request", async () => {
    const { fetchImpl } = fakeAirwallex({
      "POST /api/v1/authentication/login": login,
      "GET /api/v1/issuing/cards/card-1/details": () => ({
        status: 403,
        body: { code: "access_denied", message: "Not allowed" },
      }),
    });

    const error = await client(fetchImpl)
      .getCardDetails("card-1")
      .catch((e: unknown) => e);

    expect(error).toBeInstanceOf(AirwallexError);
    expect(error).toMatchObject({ status: 403, code: "access_denied" });
  });
});
