import Link from "next/link";
import { AppHeader } from "@/components/app-header";
import { CardThumb } from "@/components/card-faces";
import { getIssuing, type AirwallexCard } from "@/lib/airwallex";
import { requireUser } from "@/lib/auth";
import { formatMoney, maskedCardNumber } from "@/lib/cards/format";
import { CARD_STATUS_LABEL } from "@/lib/cards/labels";
import { summarizeSpend, type SpendSummary } from "@/lib/cards/spend";
import { getMyCardIds, getMyProfile } from "@/lib/data";
import { monthLabel, monthRange, parseMonth } from "@/lib/dates";

type CardEntry = { id: string; card: AirwallexCard | null; spend: SpendSummary[] | null };

export default async function HomePage() {
  const user = await requireUser();
  const [profile, cardIds] = await Promise.all([getMyProfile(user.id), getMyCardIds(user.id)]);
  const showTransactions = profile?.show_transactions ?? false;
  const month = parseMonth(undefined);
  const issuing = getIssuing();

  const entries: CardEntry[] = await Promise.all(
    cardIds.map(async (id) => {
      try {
        const card = await issuing.getCard(id);
        const spend = showTransactions
          ? summarizeSpend(await issuing.listCardTransactions(id, monthRange(month)))
          : null;
        return { id, card, spend };
      } catch {
        return { id, card: null, spend: null };
      }
    }),
  );

  const firstName = profile?.full_name?.split(" ")[0];

  return (
    <>
      <AppHeader user={user} />
      <main className="mx-auto max-w-2xl px-4 pb-16">
        <h1 className="mt-4 text-3xl font-semibold tracking-tight">
          {firstName ? `Hola, ${firstName}` : "Tus tarjetas"}
        </h1>

        {entries.length === 0 ? (
          <p className="mt-6 max-w-prose text-muted">
            Todavía no tienes tarjetas asignadas. En cuanto te asignen una, aparecerá aquí.
          </p>
        ) : (
          <ul className="mt-8 grid gap-10 sm:grid-cols-2 sm:gap-8">
            {entries.map(({ id, card, spend }) => (
              <li key={id}>
                {card ? (
                  <Link href={`/tarjetas/${id}`} className="group block rounded-[18px]">
                    <CardThumb
                      data={{
                        nickname: card.nick_name || "Tarjeta",
                        brand: card.brand,
                        number: maskedCardNumber(card.card_number),
                        nameOnCard: card.name_on_card ?? "",
                        expiry: "••/••",
                        cvv: "•••",
                        revealed: false,
                      }}
                    />
                    <div className="mt-3 flex items-baseline justify-between gap-4">
                      <span className="font-medium group-hover:underline">
                        {card.nick_name || "Tarjeta"}
                      </span>
                      {card.card_status && card.card_status !== "ACTIVE" ? (
                        <span className="text-sm text-danger">
                          {CARD_STATUS_LABEL[card.card_status]}
                        </span>
                      ) : null}
                    </div>
                    {spend ? (
                      <p className="text-sm text-muted">
                        {spend.length === 0
                          ? `Sin gasto en ${monthLabel(month).toLowerCase()}`
                          : `Gastado en ${monthLabel(month).toLowerCase()}: ${spend
                              .map((s) => formatMoney(s.total, s.currency))
                              .join(" y ")}`}
                      </p>
                    ) : null}
                  </Link>
                ) : (
                  <div className="rounded-[18px] border border-dashed border-line p-6 text-sm text-muted">
                    No se pudo cargar esta tarjeta. Recarga la página en un momento.
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </main>
    </>
  );
}
