import type { ComponentProps, ReactNode } from "react";
import type { CardStatus } from "@/lib/airwallex/types";
import { formatAmount } from "@/lib/cards/format";
import { CARD_STATUS_LABEL } from "@/lib/cards/labels";
import { limitIntervalLabel, type LimitUsage } from "@/lib/cards/limits";

const inputClass =
  "w-full rounded-lg border border-line-strong bg-paper px-3 py-2.5 text-base text-ink outline-none transition-colors placeholder:text-muted focus:border-accent";

export function Field({
  label,
  hint,
  ...input
}: { label: string; hint?: string } & ComponentProps<"input">) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium">{label}</span>
      <input {...input} className={inputClass} />
      {hint ? <span className="mt-1 block text-sm text-muted">{hint}</span> : null}
    </label>
  );
}

export function Select({
  label,
  className = "",
  children,
  ...select
}: { label: string } & ComponentProps<"select">) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-1.5 block text-sm font-medium">{label}</span>
      <select {...select} className={`${inputClass} cursor-pointer pr-8`}>
        {children}
      </select>
    </label>
  );
}

export function Button({
  variant = "primary",
  className = "",
  ...props
}: { variant?: "primary" | "quiet" | "danger" | "ghost" } & ComponentProps<"button">) {
  const styles = {
    // Naranja de marca con texto negro: 5.5:1.
    primary: "bg-accent text-accent-ink hover:brightness-110 active:brightness-95",
    quiet: "border border-line-strong bg-paper text-ink hover:border-ink",
    danger: "text-danger hover:bg-danger-wash",
    ghost: "text-ink hover:bg-wash",
  }[variant];
  return (
    <button
      {...props}
      className={`inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-lg px-4 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-45 ${styles} ${className}`}
    />
  );
}

export function ErrorText({ children }: { children: ReactNode }) {
  if (!children) return null;
  return (
    <p role="alert" className="text-sm text-danger">
      {children}
    </p>
  );
}

export function DemoBanner() {
  return (
    <div className="bg-highlight px-4 py-2 text-center text-sm text-[#2f3b3b]">
      Modo de prueba: estas tarjetas y movimientos son de ejemplo. Conecta las claves de Airwallex
      para ver las reales.
    </div>
  );
}

const STATUS_TONE: Record<CardStatus, string> = {
  ACTIVE: "bg-highlight text-[#2f3b3b]",
  PENDING: "bg-wash text-ink ring-1 ring-line",
  INACTIVE: "bg-wash text-ink ring-1 ring-line",
  BLOCKED: "bg-wash text-ink ring-1 ring-line",
  LOST: "bg-danger-wash text-danger",
  STOLEN: "bg-danger-wash text-danger",
  FAILED: "bg-danger-wash text-danger",
  CLOSED: "text-muted ring-1 ring-line",
  EXPIRED: "text-muted ring-1 ring-line",
  UNKNOWN: "text-muted ring-1 ring-line",
};

export function StatusChip({ status }: { status: CardStatus | undefined }) {
  const s = status ?? "UNKNOWN";
  return (
    <span
      className={`inline-flex items-center whitespace-nowrap rounded-md px-2 py-0.5 text-[0.8125rem] font-medium ${STATUS_TONE[s]}`}
    >
      {CARD_STATUS_LABEL[s]}
    </span>
  );
}

/** Porcentaje, barra y "6,000.00 USD total". El número va junto a la barra: no depende del color. */
export function LimitBar({ usage }: { usage: LimitUsage | null }) {
  if (!usage) return <span className="text-sm text-muted">Sin límite</span>;
  const high = usage.percent >= 90;
  return (
    <div className="min-w-44">
      <div className="flex items-baseline justify-between gap-3 text-sm">
        <span className="font-semibold tabular-nums">{usage.percent}%</span>
        <span className="truncate text-muted tabular-nums">
          {formatAmount(usage.amount, usage.currency)} {limitIntervalLabel(usage.interval)}
        </span>
      </div>
      <div
        className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-line"
        role="meter"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={usage.percent}
        aria-label="Uso del límite"
      >
        <div
          className={`bar-fill h-full rounded-full ${high ? "bg-danger" : "bg-accent"}`}
          style={{ "--fill": usage.percent / 100 } as React.CSSProperties}
        />
      </div>
    </div>
  );
}

export function Skeleton({ className = "" }: { className?: string }) {
  return <div aria-hidden className={`skeleton rounded-md ${className}`} />;
}
