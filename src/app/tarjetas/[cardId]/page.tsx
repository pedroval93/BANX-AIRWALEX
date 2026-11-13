import { ArrowLeft, ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AppHeader } from "@/components/app-header";
import { CardVisual } from "@/components/card-visual";
import { Kpi, KpiRow, SpendValue } from "@/components/page";
import { TransactionsList } from "@/components/transactions-list";
import { LimitBar, StatusChip } from "@/components/ui";
import { getIssuing, type AirwallexCard, type CardLimits, type CardTransaction } from "@/lib/airwallex";
import { requireUser } from "@/lib/auth";
import { maskedCardNumber } from "@/lib/cards/format";
import { primaryLimit } from "@/lib/cards/limits";
import { summarizeSpend } from "@/lib/cards/spend";
import { getMyProfile, mainCurrency, userOwnsCard } from "@/lib/data";
import { monthLabel, monthName, monthRange, parseMonth, shiftMonth } from "@/lib/dates";
import { permissionsOf } from "@/lib/permissions";

const monthLink =
  "inline-flex min-h-11 items-center gap-1 rounded-lg px-3 text-sm font-medium transition-colors hover:bg-wash";

export default async function CardPage({ params, searchParams }: PageProps<"/tarjetas/[cardId]">) {
  const user = await requireUser();
  const { cardId } = await params;
  const { mes } = await searchParams;

  if (!(await userOwnsCard(user.id, cardId))) notFound();

  const issuing = getIssuing();
  const profile = await getMyProfile(user.id);
  const can = permissionsOf(profile);
  // La columna derecha aparece si puede ver su saldo, sus movimientos o ambos.
  const showMonth = can.balance || can.transactions;
  const month = parseMonth(typeof mes === "string" ? mes : undefined);
  const currentMonth = parseMonth(undefined);

  let card: AirwallexCard;
  try {
    card = await issuing.getCard(cardId);
  } catch {
    return (
      <>
        <AppHeader user={user} />
        <main className="mx-auto max-w-6xl px-4">
          <p className="mt-8 text-muted">No se pudo cargar esta tarjeta. Recarga la página en un momento.</p>
        </main>
      </>
    );
  }

  let transactions: CardTransaction[] | null = null;
  let limits: CardLimits | null = null;
  let transactionsError = false;
  if (showMonth) {
    const [txs, lim] = await Promise.allSettled([
      issuing.listCardTransactions(cardId, monthRange(month)),
      !can.balance || card.card_status === "CLOSED" ? Promise.resolve(null) : issuing.getCardLimits(cardId),
    ]);
    if (txs.status === "fulfilled") transactions = txs.value;
    else transactionsError = true;
    if (lim.status === "fulfilled") limits = lim.value;
  }
  const spend = transactions ? summarizeSpend(transactions) : [];
  const status = card.card_status;

  return (
    <>
      <AppHeader user={user} />
      <main className="mx-auto max-w-6xl px-4 pb-24">
        <Link href="/" className="mt-6 inline-flex min-h-11 items-center gap-2 text-sm text-muted hover:text-ink">
          <ArrowLeft aria-hidden className="size-4" />
          Tus tarjetas
        </Link>
        <div className="mt-1 flex flex-wrap items-center gap-3">
          <h1 className="font-display text-5xl font-semibold leading-none tracking-tight">
            {card.nick_name || "Tarjeta"}
          </h1>
          <StatusChip status={status} />
        </div>

        <div className={`mt-8 grid gap-12 ${showMonth ? "lg:grid-cols-[minmax(0,25rem)_minmax(0,1fr)]" : ""}`}>
          <div className="w-full max-w-md">
            <CardVisual
              cardId={cardId}
              nickname={card.nick_name || "Tarjeta"}
              brand={card.brand}
              maskedNumber={maskedCardNumber(card.card_number)}
              canReveal={status === "ACTIVE"}
            />
          </div>

          {showMonth ? (
            <section aria-labelledby="movimientos" className="min-w-0">
              <div className="flex items-center justify-between gap-2 border-b border-line pb-3">
                <Link
                  href={`/tarjetas/${cardId}?mes=${shiftMonth(month, -1)}`}
                  className={monthLink}
                  aria-label={`Ver ${monthLabel(shiftMonth(month, -1))}`}
                >
                  <ChevronLeft aria-hidden className="size-4" />
                  <span className="capitalize">{monthName(shiftMonth(month, -1))}</span>
                </Link>
                <h2 id="movimientos" className="font-display text-2xl font-semibold tracking-tight">
                  {monthLabel(month)}
                </h2>
                {month < currentMonth ? (
                  <Link
                    href={`/tarjetas/${cardId}?mes=${shiftMonth(month, 1)}`}
                    className={monthLink}
                    aria-label={`Ver ${monthLabel(shiftMonth(month, 1))}`}
                  >
                    <span className="capitalize">{monthName(shiftMonth(month, 1))}</span>
                    <ChevronRight aria-hidden className="size-4" />
                  </Link>
                ) : (
                  <span className="w-24" aria-hidden />
                )}
              </div>

              {transactionsError ? (
                <p className="mt-6 text-muted">No se pudieron traer los movimientos. Intenta de nuevo en un momento.</p>
              ) : (
                <>
                  {can.balance ? (
                    <KpiRow>
                      <Kpi label="Gastado">
                        <SpendValue spend={spend} fallbackCurrency={mainCurrency([spend])} />
                      </Kpi>
                      {limits ? (
                        <div>
                          <dt className="text-sm text-muted">Saldo disponible</dt>
                          <dd className="mt-2">
                            <LimitBar usage={primaryLimit(limits)} mode="available" />
                          </dd>
                        </div>
                      ) : null}
                    </KpiRow>
                  ) : null}
                  {can.transactions ? (
                    <div className="mt-8">
                      <TransactionsList transactions={transactions ?? []} />
                    </div>
                  ) : null}
                </>
              )}
            </section>
          ) : null}
        </div>
      </main>
    </>
  );
}
