import Link from "next/link";
import { notFound } from "next/navigation";
import { AppHeader } from "@/components/app-header";
import { CardVisual } from "@/components/card-visual";
import { TransactionsList } from "@/components/transactions-list";
import { getIssuing, type AirwallexCard, type CardTransaction } from "@/lib/airwallex";
import { requireUser } from "@/lib/auth";
import { formatMoney, maskedCardNumber } from "@/lib/cards/format";
import { CARD_STATUS_LABEL } from "@/lib/cards/labels";
import { summarizeSpend } from "@/lib/cards/spend";
import { getMyProfile, userOwnsCard } from "@/lib/data";
import { monthLabel, monthRange, parseMonth, shiftMonth } from "@/lib/dates";

export default async function CardPage({ params, searchParams }: PageProps<"/tarjetas/[cardId]">) {
  const user = await requireUser();
  const { cardId } = await params;
  const { mes } = await searchParams;

  if (!(await userOwnsCard(user.id, cardId))) notFound();

  const issuing = getIssuing();
  const profile = await getMyProfile(user.id);
  const showTransactions = profile?.show_transactions ?? false;
  const month = parseMonth(typeof mes === "string" ? mes : undefined);
  const currentMonth = parseMonth(undefined);

  let card: AirwallexCard;
  try {
    card = await issuing.getCard(cardId);
  } catch {
    return (
      <>
        <AppHeader user={user} />
        <main className="mx-auto max-w-2xl px-4">
          <p className="mt-6 text-muted">No se pudo cargar esta tarjeta. Recarga la página en un momento.</p>
        </main>
      </>
    );
  }

  let transactions: CardTransaction[] | null = null;
  let transactionsError = false;
  if (showTransactions) {
    try {
      transactions = await issuing.listCardTransactions(cardId, monthRange(month));
    } catch {
      transactionsError = true;
    }
  }
  const spend = transactions ? summarizeSpend(transactions) : [];
  const status = card.card_status;

  return (
    <>
      <AppHeader user={user} />
      <main className="mx-auto max-w-2xl px-4 pb-16">
        <Link href="/" className="text-sm text-muted hover:text-ink">
          Tus tarjetas
        </Link>
        <div className="mt-2 flex items-baseline justify-between gap-4">
          <h1 className="text-2xl font-semibold tracking-tight">{card.nick_name || "Tarjeta"}</h1>
          {status && status !== "ACTIVE" ? (
            <span className="text-sm text-danger">{CARD_STATUS_LABEL[status]}</span>
          ) : null}
        </div>

        <div className="mt-6 max-w-md">
          <CardVisual
            cardId={cardId}
            nickname={card.nick_name || "Tarjeta"}
            brand={card.brand}
            maskedNumber={maskedCardNumber(card.card_number)}
            nameOnCard={card.name_on_card ?? ""}
            canReveal={status === "ACTIVE"}
          />
        </div>

        {showTransactions ? (
          <section className="mt-12" aria-labelledby="movimientos">
            <div className="flex items-center justify-between gap-2">
              <Link
                href={`/tarjetas/${cardId}?mes=${shiftMonth(month, -1)}`}
                className="rounded-md px-2 py-1 text-sm text-accent hover:bg-accent/10"
                aria-label="Mes anterior"
              >
                ‹ {monthLabel(shiftMonth(month, -1)).split(" ")[0]}
              </Link>
              <h2 id="movimientos" className="text-lg font-semibold">
                {monthLabel(month)}
              </h2>
              {month < currentMonth ? (
                <Link
                  href={`/tarjetas/${cardId}?mes=${shiftMonth(month, 1)}`}
                  className="rounded-md px-2 py-1 text-sm text-accent hover:bg-accent/10"
                  aria-label="Mes siguiente"
                >
                  {monthLabel(shiftMonth(month, 1)).split(" ")[0]} ›
                </Link>
              ) : (
                <span className="w-16" aria-hidden />
              )}
            </div>

            {transactionsError ? (
              <p className="mt-6 text-muted">No se pudieron traer los movimientos. Intenta de nuevo en un momento.</p>
            ) : (
              <>
                <div className="mt-6">
                  <p className="text-sm text-muted">Gastado</p>
                  <p className="text-4xl font-semibold tracking-tight tabular-nums">
                    {spend.length === 0
                      ? formatMoney(0, "MXN")
                      : spend.map((s) => formatMoney(s.total, s.currency)).join(" + ")}
                  </p>
                </div>
                <div className="mt-6">
                  <TransactionsList transactions={transactions ?? []} />
                </div>
              </>
            )}
          </section>
        ) : null}
      </main>
    </>
  );
}
