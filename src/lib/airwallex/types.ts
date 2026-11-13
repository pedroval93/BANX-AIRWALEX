// Tipos de la API de Airwallex Issuing que usa la app.
// Referencia: https://www.airwallex.com/docs/api/issuing

export type CardStatus =
  | "PENDING"
  | "FAILED"
  | "INACTIVE"
  | "ACTIVE"
  | "LOST"
  | "STOLEN"
  | "CLOSED"
  | "BLOCKED"
  | "EXPIRED"
  | "UNKNOWN";

export type AirwallexCard = {
  card_id: string;
  /** Enmascarado, p. ej. "************4111". */
  card_number?: string;
  card_status?: CardStatus;
  brand?: string;
  cardholder_id?: string;
  nick_name?: string;
  /** Solo viene al pedir una tarjeta individual, no en la lista. */
  name_on_card?: string;
  form_factor?: "PHYSICAL" | "VIRTUAL";
  created_at?: string;
};

export type SensitiveCardDetails = {
  card_number: string;
  cvv: string;
  expiry_month: number;
  expiry_year: number;
  name_on_card: string;
};

export type CardTransactionStatus =
  | "AUTHORIZED"
  | "CLEARED"
  | "DECLINED"
  | "EXPIRED"
  | "REVERSED"
  | "VERIFIED"
  | "UNKNOWN";

export type TransactionAmounts = {
  currency: string;
  total_authorized?: number;
  total_credited?: number;
  total_debited?: number;
  total_declined?: number;
  total_expired?: number;
  total_pending?: number;
  total_reversed?: number;
};

export type CardTransaction = {
  id: string;
  card_id: string;
  status: CardTransactionStatus;
  fund_direction?: "DEBIT" | "CREDIT" | "NO_MOVEMENT";
  /** Montos en la moneda de la tarjeta. */
  billing_amounts: TransactionAmounts;
  /** Montos en la moneda del comercio. */
  transaction_amounts?: TransactionAmounts;
  merchant?: {
    name?: string;
    category_code?: string;
    city?: string;
    country?: string;
  };
  failure_reason?: string;
  created_at: string;
};

export type DateRange = { from: string; to: string };

export type LimitInterval = "PER_TRANSACTION" | "DAILY" | "WEEKLY" | "MONTHLY" | "ALL_TIME" | (string & {});

/** GET /api/v1/issuing/cards/{id}/limits: límites y lo que queda de cada uno. */
export type CardLimits = {
  currency: string;
  limits: { amount: number; interval: LimitInterval; remaining?: number }[];
};

export interface IssuingApi {
  listCards(): Promise<AirwallexCard[]>;
  getCard(cardId: string): Promise<AirwallexCard>;
  getCardDetails(cardId: string): Promise<SensitiveCardDetails>;
  getCardLimits(cardId: string): Promise<CardLimits>;
  listCardTransactions(cardId: string, range: DateRange): Promise<CardTransaction[]>;
  /** Movimientos de todas las tarjetas de la cuenta. */
  listTransactions(range: DateRange): Promise<CardTransaction[]>;
}
