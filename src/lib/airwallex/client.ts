import type {
  AirwallexCard,
  CardTransaction,
  DateRange,
  IssuingApi,
  SensitiveCardDetails,
} from "./types";

export class AirwallexError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly code?: string,
  ) {
    super(message);
    this.name = "AirwallexError";
  }
}

type Options = {
  clientId: string;
  apiKey: string;
  baseUrl: string;
  fetchImpl?: typeof fetch;
};

// Airwallex sin rango de fechas solo devuelve los últimos 30 días.
const HISTORY_START = "2015-01-01T00:00:00+0000";
// Tope de páginas para no quedarse en un ciclo si la API cambia.
const MAX_PAGES = 50;
// Renovar el token un minuto antes de que caduque (dura 30 minutos).
const TOKEN_MARGIN_MS = 60_000;

export function createAirwallexClient({
  clientId,
  apiKey,
  baseUrl,
  fetchImpl = fetch,
}: Options): IssuingApi {
  let token: { value: string; expiresAt: number } | null = null;

  async function readError(res: Response): Promise<AirwallexError> {
    const body = (await res.json().catch(() => ({}))) as { code?: string; message?: string };
    return new AirwallexError(
      body.message ?? `Airwallex respondió ${res.status}`,
      res.status,
      body.code,
    );
  }

  async function getToken(): Promise<string> {
    if (token && token.expiresAt - TOKEN_MARGIN_MS > Date.now()) return token.value;

    const res = await fetchImpl(`${baseUrl}/api/v1/authentication/login`, {
      method: "POST",
      headers: { "x-client-id": clientId, "x-api-key": apiKey },
      cache: "no-store",
    });
    if (!res.ok) throw await readError(res);

    const body = (await res.json()) as { token: string; expires_at: string };
    token = { value: body.token, expiresAt: Date.parse(body.expires_at) || Date.now() };
    return token.value;
  }

  async function get<T>(path: string, params: Record<string, string> = {}): Promise<T> {
    const url = new URL(path, baseUrl);
    for (const [key, value] of Object.entries(params)) url.searchParams.set(key, value);

    const res = await fetchImpl(url, {
      method: "GET",
      headers: { authorization: `Bearer ${await getToken()}` },
      cache: "no-store",
    });
    if (!res.ok) throw await readError(res);
    return (await res.json()) as T;
  }

  return {
    async listCards() {
      const cards: AirwallexCard[] = [];
      for (let page = 0; page < MAX_PAGES; page++) {
        const body = await get<{ items: AirwallexCard[]; has_more: boolean }>(
          "/api/v1/issuing/cards",
          {
            page_num: String(page),
            page_size: "200",
            from_created_at: HISTORY_START,
            to_created_at: new Date().toISOString(),
          },
        );
        cards.push(...body.items);
        if (!body.has_more) break;
      }
      return cards;
    },

    getCard(cardId) {
      return get<AirwallexCard>(`/api/v1/issuing/cards/${encodeURIComponent(cardId)}`);
    },

    async getCardDetails(cardId) {
      const body = await get<SensitiveCardDetails>(
        `/api/v1/issuing/cards/${encodeURIComponent(cardId)}/details`,
      );
      return {
        card_number: body.card_number,
        cvv: body.cvv,
        expiry_month: body.expiry_month,
        expiry_year: body.expiry_year,
        name_on_card: body.name_on_card,
      };
    },

    async listCardTransactions(cardId: string, range: DateRange) {
      const items: CardTransaction[] = [];
      let bookmark: string | null = null;
      for (let page = 0; page < MAX_PAGES; page++) {
        const params: Record<string, string> = {
          card_id: cardId,
          from_created_at: range.from,
          to_created_at: range.to,
          page_size: "100",
        };
        if (bookmark) params.page = bookmark;

        const body: { items: CardTransaction[]; page_after?: string | null } = await get(
          "/api/v1/issuing/card_transactions",
          params,
        );
        items.push(...body.items);
        bookmark = body.page_after ?? null;
        if (!bookmark || body.items.length === 0) break;
      }
      return items;
    },
  };
}
