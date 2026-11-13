import type { CardLimits, LimitInterval } from "@/lib/airwallex/types";

export type LimitUsage = {
  currency: string;
  interval: LimitInterval;
  amount: number;
  used: number;
  /** 0 a 100, redondeado. */
  percent: number;
};

/**
 * El límite que se muestra en la tabla: el de gasto (total, mensual, etc.).
 * El límite por compra solo se usa si es el único que tiene la tarjeta.
 */
export function primaryLimit(limits: CardLimits | null | undefined): LimitUsage | null {
  if (!limits || limits.limits.length === 0) return null;
  const limit = limits.limits.find((l) => l.interval !== "PER_TRANSACTION") ?? limits.limits[0];
  const remaining = limit.remaining ?? limit.amount;
  const used = Math.round((limit.amount - remaining) * 100) / 100;
  const percent = limit.amount > 0 ? Math.round((used / limit.amount) * 100) : 0;
  return {
    currency: limits.currency,
    interval: limit.interval,
    amount: limit.amount,
    used: Math.max(0, used),
    percent: Math.min(100, Math.max(0, percent)),
  };
}

const INTERVAL_LABEL: Record<string, string> = {
  ALL_TIME: "total",
  MONTHLY: "al mes",
  WEEKLY: "a la semana",
  DAILY: "al día",
  PER_TRANSACTION: "por compra",
};

export function limitIntervalLabel(interval: LimitInterval): string {
  return INTERVAL_LABEL[interval] ?? interval.toLowerCase();
}
