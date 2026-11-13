import type { CardTransaction } from "@/lib/airwallex/types";

// Cómo se calcula el gasto (revisar contra datos reales del sandbox de Airwallex):
// - Cuentan las compras autorizadas (pendientes) y liquidadas.
// - Las devoluciones restan.
// - Rechazadas, revertidas y caducadas se muestran pero no cuentan.

export function transactionAmount(tx: CardTransaction): number {
  const b = tx.billing_amounts ?? { currency: "" };
  switch (tx.status) {
    case "DECLINED":
      return b.total_declined ?? 0;
    case "EXPIRED":
      return b.total_expired ?? 0;
    case "REVERSED":
      return b.total_reversed ?? 0;
  }
  const net = (b.total_debited ?? 0) - (b.total_credited ?? 0);
  if (net !== 0) return net;
  return b.total_pending || b.total_authorized || 0;
}

export function countsAsSpend(tx: CardTransaction): boolean {
  return tx.status === "AUTHORIZED" || tx.status === "CLEARED";
}

export type SpendSummary = { currency: string; total: number; count: number };

export function summarizeSpend(transactions: CardTransaction[]): SpendSummary[] {
  const byCurrency = new Map<string, SpendSummary>();
  for (const tx of transactions) {
    if (!countsAsSpend(tx)) continue;
    const currency = tx.billing_amounts.currency;
    const entry = byCurrency.get(currency) ?? { currency, total: 0, count: 0 };
    entry.total = Math.round((entry.total + transactionAmount(tx)) * 100) / 100;
    entry.count += 1;
    byCurrency.set(currency, entry);
  }
  return [...byCurrency.values()];
}

/** Gasto de cada tarjeta a partir de los movimientos de toda la cuenta. */
export function spendByCard(transactions: CardTransaction[]): Map<string, SpendSummary[]> {
  const grouped = new Map<string, CardTransaction[]>();
  for (const tx of transactions) {
    const list = grouped.get(tx.card_id) ?? [];
    list.push(tx);
    grouped.set(tx.card_id, list);
  }
  return new Map([...grouped].map(([cardId, txs]) => [cardId, summarizeSpend(txs)]));
}

/** Suma el gasto de varias tarjetas, por moneda. */
export function totalSpend(summaries: SpendSummary[][]): SpendSummary[] {
  const byCurrency = new Map<string, SpendSummary>();
  for (const s of summaries.flat()) {
    const entry = byCurrency.get(s.currency) ?? { currency: s.currency, total: 0, count: 0 };
    entry.total = Math.round((entry.total + s.total) * 100) / 100;
    entry.count += s.count;
    byCurrency.set(s.currency, entry);
  }
  return [...byCurrency.values()];
}
