import Link from "next/link";
import type { ReactNode } from "react";
import { CountUp } from "./count-up";
import type { SpendSummary } from "@/lib/cards/spend";
import { formatAmount } from "@/lib/cards/format";

export function PageHeading({ title, subtitle, children }: { title: string; subtitle?: string; children?: ReactNode }) {
  return (
    <div className="mt-8 flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0">
        <h1 className="font-display text-5xl font-semibold leading-none tracking-tight">{title}</h1>
        {subtitle ? <p className="mt-2 max-w-prose text-muted">{subtitle}</p> : null}
      </div>
      {children}
    </div>
  );
}

export function Tabs({ items }: { items: { href: string; label: string; active: boolean }[] }) {
  return (
    <nav className="mt-6 flex gap-6 border-b border-line text-[0.95rem]" aria-label="Secciones">
      {items.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          aria-current={item.active ? "page" : undefined}
          className={`-mb-px border-b-2 pb-3 transition-colors ${
            item.active ? "border-accent font-semibold" : "border-transparent text-muted hover:text-ink"
          }`}
        >
          {item.label}
        </Link>
      ))}
    </nav>
  );
}

export function KpiRow({ children }: { children: ReactNode }) {
  return (
    <dl className="mt-8 grid grid-cols-1 gap-6 sm:auto-cols-fr sm:grid-flow-col sm:gap-0 sm:divide-x sm:divide-line [&>div]:sm:px-8 [&>div:first-child]:sm:pl-0">
      {children}
    </dl>
  );
}

export function Kpi({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <dt className="text-sm text-muted">{label}</dt>
      <dd className="mt-1 font-display text-4xl font-semibold leading-none tracking-tight">{children}</dd>
    </div>
  );
}

/** Gasto con su moneda; si hay más de una moneda, las demás van abajo en pequeño. */
export function SpendValue({ spend, fallbackCurrency }: { spend: SpendSummary[]; fallbackCurrency: string }) {
  const [main, ...rest] = spend.length ? [...spend].sort((a, b) => b.count - a.count) : [];
  return (
    <>
      <CountUp value={main?.total ?? 0} decimals={2} suffix={` ${main?.currency ?? fallbackCurrency}`} />
      {rest.length ? (
        <span className="mt-1 block font-sans text-sm font-normal tracking-normal text-muted">
          y {rest.map((s) => formatAmount(s.total, s.currency)).join(" y ")}
        </span>
      ) : null}
    </>
  );
}
