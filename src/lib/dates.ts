import type { DateRange } from "@/lib/airwallex/types";

// Hora de Ciudad de México: UTC-6 todo el año (México quitó el horario de verano en 2022).
const MX_OFFSET_HOURS = 6;
const TIME_ZONE = "America/Mexico_City";

/** "YYYY-MM" válido o el mes actual en hora de México. */
export function parseMonth(value: string | undefined, now = new Date()): string {
  const match = /^(\d{4})-(\d{2})$/.exec(value ?? "");
  if (match && Number(match[2]) >= 1 && Number(match[2]) <= 12) return value!;
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: TIME_ZONE,
    year: "numeric",
    month: "2-digit",
  }).formatToParts(now);
  const year = parts.find((p) => p.type === "year")!.value;
  const month = parts.find((p) => p.type === "month")!.value;
  return `${year}-${month}`;
}

export function shiftMonth(month: string, delta: number): string {
  const [year, m] = month.split("-").map(Number);
  const date = new Date(Date.UTC(year, m - 1 + delta, 1));
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
}

export function monthRange(month: string): DateRange {
  const [year, m] = month.split("-").map(Number);
  const from = new Date(Date.UTC(year, m - 1, 1, MX_OFFSET_HOURS));
  const next = new Date(Date.UTC(year, m, 1, MX_OFFSET_HOURS));
  return { from: from.toISOString(), to: new Date(next.getTime() - 1).toISOString() };
}

export function monthLabel(month: string): string {
  const [year, m] = month.split("-").map(Number);
  const label = new Intl.DateTimeFormat("es-MX", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(year, m - 1, 15)));
  return label.charAt(0).toUpperCase() + label.slice(1);
}

export function formatDateTime(iso: string): string {
  return new Intl.DateTimeFormat("es-MX", {
    timeZone: TIME_ZONE,
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}
