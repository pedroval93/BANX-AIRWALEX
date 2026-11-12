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
