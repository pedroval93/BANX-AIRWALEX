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
  /** Espera base antes de reintentar un 429. */
  retryDelayMs?: number;
};

const DAY_MS = 86_400_000;
// Airwallex sin rango de fechas solo devuelve 30 días, y no acepta rangos de más de 90.
// Por eso la lista de tarjetas se pide en ventanas de casi 90 días hacia atrás.
const CARD_WINDOW_MS = 90 * DAY_MS - 1000;
// Se deja de buscar tras dos años seguidos sin tarjetas nuevas (8 ventanas).
const EMPTY_WINDOWS_TO_STOP = 8;
// Tope de ventanas (unos 12 años) por si la API cambia.
const MAX_WINDOWS = 50;
// Tope de páginas para no quedarse en un ciclo si la API cambia.
const MAX_PAGES = 50;
// Airwallex responde 429 si se le pide mucho a la vez: se reintenta con espera creciente.
const MAX_ATTEMPTS = 4;
// Renovar el token un minuto antes de que caduque (dura 30 minutos).
const TOKEN_MARGIN_MS = 60_000;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export function createAirwallexClient({
  clientId,
  apiKey,
  baseUrl,
  fetchImpl = fetch,
  retryDelayMs = 1000,
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

    for (let attempt = 1; ; attempt++) {
      const res = await fetchImpl(url, {
        method: "GET",
        headers: { authorization: `Bearer ${await getToken()}` },
        cache: "no-store",
      });
      if (res.ok) return (await res.json()) as T;
      if (res.status === 429 && attempt < MAX_ATTEMPTS) {
        await sleep(retryDelayMs * attempt);
        continue;
      }
      throw await readError(res);
    }
  }

  async function listCardsCreatedBetween(from: Date, to: Date): Promise<AirwallexCard[]> {
    const cards: AirwallexCard[] = [];
    for (let page = 0; page < MAX_PAGES; page++) {
      const body = await get<{ items: AirwallexCard[]; has_more: boolean }>(
        "/api/v1/issuing/cards",
        {
          page_num: String(page),
          page_size: "200",
          from_created_at: from.toISOString(),
          to_created_at: to.toISOString(),
        },
      );
      cards.push(...body.items);
      if (!body.has_more) break;
    }
    return cards;
  }

  return {
    async listCards() {
      const byId = new Map<string, AirwallexCard>();
      let to = new Date();
      let emptyInARow = 0;
      // Una ventana a la vez: en paralelo Airwallex responde 429.
      for (let w = 0; w < MAX_WINDOWS && emptyInARow < EMPTY_WINDOWS_TO_STOP; w++) {
        const from = new Date(to.getTime() - CARD_WINDOW_MS);
        const cards = await listCardsCreatedBetween(from, to);
        for (const card of cards) if (!byId.has(card.card_id)) byId.set(card.card_id, card);
        emptyInARow = cards.length === 0 ? emptyInARow + 1 : 0;
        to = from;
      }
      return [...byId.values()];
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
