import type {
  AirwallexCard,
  CardTransaction,
  CardTransactionStatus,
  IssuingApi,
  SensitiveCardDetails,
} from "./types";

// Datos de ejemplo para ver la app sin claves de Airwallex.
// Los números son tarjetas de prueba públicas, no tarjetas reales.

const CARDS: (AirwallexCard & { details: SensitiveCardDetails })[] = [
  {
    card_id: "demo-card-1",
    card_number: "************4242",
    card_status: "ACTIVE",
    brand: "visa",
    nick_name: "Gastos operativos",
    name_on_card: "ANA LOPEZ",
    form_factor: "VIRTUAL",
    details: {
      card_number: "4242424242424242",
      cvv: "123",
      expiry_month: 9,
      expiry_year: 2029,
      name_on_card: "ANA LOPEZ",
    },
  },
  {
    card_id: "demo-card-2",
    card_number: "************5100",
    card_status: "ACTIVE",
    brand: "mastercard",
    nick_name: "Viajes",
    name_on_card: "ANA LOPEZ",
    form_factor: "VIRTUAL",
    details: {
      card_number: "5555555555555100",
      cvv: "456",
      expiry_month: 3,
      expiry_year: 2030,
      name_on_card: "ANA LOPEZ",
    },
  },
  {
    card_id: "demo-card-3",
    card_number: "************0005",
    card_status: "ACTIVE",
    brand: "visa",
    nick_name: "Suscripciones",
    name_on_card: "LUIS PEREZ",
    form_factor: "VIRTUAL",
    details: {
      card_number: "4000056655660005",
      cvv: "789",
      expiry_month: 12,
      expiry_year: 2028,
      name_on_card: "LUIS PEREZ",
    },
  },
];

const MERCHANTS = [
  { name: "Amazon México", category_code: "5942", city: "Ciudad de México", country: "MX" },
  { name: "Uber", category_code: "4121", city: "Ciudad de México", country: "MX" },
  { name: "Costco Wholesale", category_code: "5300", city: "Guadalajara", country: "MX" },
  { name: "Google Workspace", category_code: "5734", city: "Mountain View", country: "US" },
  { name: "Aeroméxico", category_code: "3005", city: "Ciudad de México", country: "MX" },
  { name: "OXXO", category_code: "5411", city: "Monterrey", country: "MX" },
];

const PATTERN: { daysAgo: number; amount: number; status: CardTransactionStatus; refund?: boolean }[] =
  [
    { daysAgo: 0, amount: 389.5, status: "AUTHORIZED" },
    { daysAgo: 2, amount: 1249, status: "CLEARED" },
    { daysAgo: 4, amount: 162.3, status: "CLEARED" },
    { daysAgo: 6, amount: 2999, status: "DECLINED" },
    { daysAgo: 9, amount: 540, status: "CLEARED" },
    { daysAgo: 11, amount: 540, status: "CLEARED", refund: true },
    { daysAgo: 15, amount: 87.9, status: "CLEARED" },
    { daysAgo: 21, amount: 4320, status: "CLEARED" },
    { daysAgo: 28, amount: 215, status: "CLEARED" },
    { daysAgo: 36, amount: 1780, status: "CLEARED" },
    { daysAgo: 44, amount: 99, status: "CLEARED" },
    { daysAgo: 53, amount: 640.75, status: "CLEARED" },
  ];

function transactionsFor(cardId: string, cardIndex: number, now: Date): CardTransaction[] {
  return PATTERN.map((p, i) => {
    const merchant = MERCHANTS[(i + cardIndex * 2) % MERCHANTS.length];
    const created = new Date(now.getTime() - p.daysAgo * 86_400_000 - i * 3_600_000);
    const amount = Math.round(p.amount * (1 + cardIndex * 0.35) * 100) / 100;
    const billing =
      p.status === "DECLINED"
        ? { currency: "MXN", total_declined: amount }
        : p.status === "AUTHORIZED"
          ? { currency: "MXN", total_pending: amount, total_authorized: amount }
          : p.refund
            ? { currency: "MXN", total_credited: amount }
            : { currency: "MXN", total_debited: amount };
    return {
      id: `${cardId}-tx-${i}`,
      card_id: cardId,
      status: p.status,
      fund_direction: p.refund ? "CREDIT" : "DEBIT",
      billing_amounts: billing,
      merchant,
      failure_reason: p.status === "DECLINED" ? "Fondos insuficientes" : undefined,
      created_at: created.toISOString(),
    };
  });
}

function findCard(cardId: string) {
  const card = CARDS.find((c) => c.card_id === cardId);
  if (!card) throw new Error(`Tarjeta de ejemplo no encontrada: ${cardId}`);
  return card;
}

/** La tarjeta tal como la devuelve Airwallex, sin los datos sensibles. */
function publicCard(card: (typeof CARDS)[number]): AirwallexCard {
  return {
    card_id: card.card_id,
    card_number: card.card_number,
    card_status: card.card_status,
    brand: card.brand,
    nick_name: card.nick_name,
    name_on_card: card.name_on_card,
    form_factor: card.form_factor,
  };
}

export function createDemoIssuing(now = new Date()): IssuingApi {
  return {
    async listCards() {
      // La lista de Airwallex no trae el nombre impreso en la tarjeta.
      return CARDS.map((card) => ({ ...publicCard(card), name_on_card: undefined }));
    },
    async getCard(cardId) {
      return publicCard(findCard(cardId));
    },
    async getCardDetails(cardId) {
      return { ...findCard(cardId).details };
    },
    async listCardTransactions(cardId, range) {
      const index = CARDS.indexOf(findCard(cardId));
      return transactionsFor(cardId, index, now)
        .filter((tx) => tx.created_at >= range.from && tx.created_at <= range.to)
        .sort((a, b) => b.created_at.localeCompare(a.created_at));
    },
  };
}
