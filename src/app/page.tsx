import { ChevronRight } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";
import { AppHeader } from "@/components/app-header";
import { CardMini } from "@/components/card-faces";
import { CountUp } from "@/components/count-up";
import { Kpi, KpiRow, PageHeading, SpendValue } from "@/components/page";
import { LimitBar, Skeleton, StatusChip } from "@/components/ui";
import { requireUser } from "@/lib/auth";
import { formatAmount, maskedCardNumber } from "@/lib/cards/format";
import { totalSpend } from "@/lib/cards/spend";
import { getMyCardIds, getMyCardsOverview, getMyProfile, mainCurrency } from "@/lib/data";
import { monthName, parseMonth } from "@/lib/dates";

async function MyCards({ cardIds, showSpend }: { cardIds: string[]; showSpend: boolean }) {
  const month = parseMonth(undefined);
  const entries = await getMyCardsOverview(cardIds, month, showSpend);
  const loaded = entries.flatMap((e) => (e.card ? [e] : []));
  const currency = mainCurrency(loaded.map((e) => e.spend));
  const cols = showSpend
    ? "sm:grid-cols-[minmax(0,1.4fr)_minmax(0,0.8fr)_minmax(0,1.2fr)_7rem_1.5rem]"
    : "sm:grid-cols-[minmax(0,1fr)_7rem_1.5rem]";

  return (
    <>
      {showSpend ? (
        <KpiRow>
          <Kpi label={`Gastado en ${monthName(month)}`}>
            <SpendValue spend={totalSpend(loaded.map((e) => e.spend))} fallbackCurrency={currency} />
          </Kpi>
          <Kpi label="Tarjetas">
            <CountUp value={entries.length} />
          </Kpi>
        </KpiRow>
      ) : null}

      <div className="mt-10 overflow-hidden rounded-xl border border-line">
        <div
          className={`hidden gap-4 border-b border-line bg-wash px-4 py-3 text-sm font-medium text-muted sm:grid ${cols}`}
          aria-hidden
        >
          <span>Tarjeta</span>
          {showSpend ? <span className="text-right">Gasto de {monthName(month)}</span> : null}
          {showSpend ? <span>Uso del límite</span> : null}
          <span>Estado</span>
          <span />
        </div>
        <ul className="divide-y divide-line">
          {entries.map((entry) =>
            entry.card ? (
              <li key={entry.card.card_id}>
                <Link
                  href={`/tarjetas/${entry.card.card_id}`}
                  className={`grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-3 px-4 py-3.5 transition-colors hover:bg-wash ${cols}`}
                >
                  <span className="flex min-w-0 items-center gap-3">
                    <CardMini />
                    <span className="min-w-0">
                      <span className="block truncate font-semibold">{entry.card.nick_name || "Tarjeta"}</span>
                      <span className="block text-sm text-muted tabular-nums">
                        •••• {maskedCardNumber(entry.card.card_number).slice(-4)}
                      </span>
                    </span>
                  </span>
                  {showSpend ? (
                    <span className="col-span-2 text-sm font-medium tabular-nums sm:col-span-1 sm:text-right">
                      <span className="text-muted sm:hidden">Gasto: </span>
                      {entry.spend.length
                        ? entry.spend.map((s) => formatAmount(s.total, s.currency)).join(" + ")
                        : formatAmount(0, currency)}
                    </span>
                  ) : null}
                  {showSpend ? (
                    <span className="col-span-2 sm:col-span-1">
                      <LimitBar usage={entry.limit} />
                    </span>
                  ) : null}
                  <span className="row-start-1 sm:row-auto">
                    <StatusChip status={entry.card.card_status} />
                  </span>
                  <ChevronRight aria-hidden className="hidden size-5 text-muted sm:block" />
                </Link>
              </li>
            ) : (
              <li key={entry.id} className="px-4 py-4 text-sm text-muted">
                No se pudo cargar una de tus tarjetas. Recarga la página en un momento.
              </li>
            ),
          )}
        </ul>
      </div>
    </>
  );
}

function ListSkeleton({ rows }: { rows: number }) {
  return (
    <div aria-busy="true" aria-label="Trayendo tus tarjetas" className="mt-10 space-y-2">
      {Array.from({ length: Math.min(rows, 6) }, (_, i) => (
        <Skeleton key={i} className="h-16 w-full" />
      ))}
    </div>
  );
}

export default async function HomePage() {
  const user = await requireUser();
  const [profile, cardIds] = await Promise.all([getMyProfile(user.id), getMyCardIds(user.id)]);
  const showSpend = profile?.show_transactions ?? false;
  const firstName = profile?.full_name?.split(" ")[0];

  return (
    <>
      <AppHeader user={user} section="home" />
      <main className="mx-auto max-w-6xl px-4 pb-24">
        <PageHeading
          title={firstName ? `Hola, ${firstName}` : "Tus tarjetas"}
          subtitle={
            cardIds.length
              ? `Abre una tarjeta para ver su número, vencimiento y CVV${showSpend ? ", y sus movimientos" : ""}.`
              : undefined
          }
        />
        {cardIds.length === 0 ? (
          <p className="mt-8 max-w-prose rounded-xl bg-wash p-5 text-muted">
            Todavía no tienes tarjetas asignadas. En cuanto te asignen una, aparecerá aquí.
          </p>
        ) : (
          <Suspense fallback={<ListSkeleton rows={cardIds.length} />}>
            <MyCards cardIds={cardIds} showSpend={showSpend} />
          </Suspense>
        )}
      </main>
    </>
  );
}
