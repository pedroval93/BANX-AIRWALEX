import { Suspense } from "react";
import { AppHeader } from "@/components/app-header";
import { CountUp } from "@/components/count-up";
import { Kpi, KpiRow, PageHeading, SpendValue, Tabs } from "@/components/page";
import { Skeleton } from "@/components/ui";
import { requireAdmin } from "@/lib/auth";
import { maskedCardNumber } from "@/lib/cards/format";
import { totalSpend } from "@/lib/cards/spend";
import { getAllCardsOverview, listAllCards, listClients, mainCurrency } from "@/lib/data";
import { monthName, parseMonth } from "@/lib/dates";
import { permissionsOf } from "@/lib/permissions";
import { CardsTable, type CardRow } from "./cards-table";
import { ClientsList } from "./clients-list";
import { InviteForm } from "./link-forms";

const last4 = (masked: string | undefined) => maskedCardNumber(masked).slice(-4);
const clientName = (c: { full_name: string | null; email: string }) => c.full_name || c.email;

async function CardsSection() {
  const month = parseMonth(undefined);
  const [clients, { rows, error }] = await Promise.all([listClients(), getAllCardsOverview(month)]);

  if (error) {
    return (
      <p role="alert" className="mt-8 rounded-xl bg-danger-wash p-4 text-sm text-danger">
        No se pudieron traer las tarjetas: {error}
      </p>
    );
  }

  const ownerOf = new Map(clients.flatMap((c) => c.cardIds.map((id) => [id, c.id] as const)));
  const tableRows: CardRow[] = rows
    .map(({ card, spend, limit }) => ({
      id: card.card_id,
      name: card.nick_name || "Sin nombre",
      last4: last4(card.card_number),
      status: card.card_status,
      clientId: ownerOf.get(card.card_id) ?? null,
      spend,
      limit,
    }))
    // Activas primero; después por nombre ("Test 2" antes que "Test 10").
    .sort(
      (a, b) =>
        Number(b.status === "ACTIVE") - Number(a.status === "ACTIVE") ||
        a.name.localeCompare(b.name, "es", { numeric: true }),
    );

  const active = tableRows.filter((r) => r.status === "ACTIVE");
  const currency = mainCurrency(rows.map((r) => r.spend));

  return (
    <>
      <KpiRow>
        <Kpi label={`Gasto de ${monthName(month)}`}>
          <SpendValue spend={totalSpend(rows.map((r) => r.spend))} fallbackCurrency={currency} />
        </Kpi>
        <Kpi label="Tarjetas activas">
          <CountUp value={active.length} />
        </Kpi>
        <Kpi label="Activas asignadas">
          <CountUp value={active.filter((r) => r.clientId).length} />{" "}
          <span className="text-2xl text-muted">de {active.length}</span>
        </Kpi>
      </KpiRow>
      <div className="mt-10">
        <CardsTable
          rows={tableRows}
          clients={clients.map((c) => ({ id: c.id, label: clientName(c) }))}
          defaultCurrency={currency}
          monthName={monthName(month)}
        />
      </div>
    </>
  );
}

async function ClientsSection() {
  const [clients, { cards }] = await Promise.all([listClients(), listAllCards()]);
  const cardsById = new Map(cards.map((c) => [c.card_id, c]));
  return (
    <ClientsList
      clients={clients.map((c) => ({
        id: c.id,
        name: clientName(c),
        email: c.email,
        hasName: Boolean(c.full_name),
        lastSignInAt: c.lastSignInAt,
        permissions: permissionsOf(c),
        cards: c.cardIds.map((id) => {
          const card = cardsById.get(id);
          return {
            id,
            name: card?.nick_name || (card ? "Sin nombre" : "Ya no existe"),
            last4: card ? last4(card.card_number) : id.slice(0, 4),
            status: card?.card_status,
          };
        }),
      }))}
    />
  );
}

function TableSkeleton() {
  return (
    <div aria-busy="true" aria-label="Trayendo tarjetas">
      <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <div key={i}>
            <Skeleton className="h-4 w-32" />
            <Skeleton className="mt-2 h-9 w-44" />
          </div>
        ))}
      </div>
      <Skeleton className="mt-10 h-11 w-full" />
      <div className="mt-6 space-y-2">
        {Array.from({ length: 6 }, (_, i) => (
          <Skeleton key={i} className="h-14 w-full" />
        ))}
      </div>
      <p className="mt-4 text-sm text-muted">Trayendo tarjetas…</p>
    </div>
  );
}

export default async function AdminPage({ searchParams }: PageProps<"/admin">) {
  const user = await requireAdmin();
  const { vista } = await searchParams;
  const tab = vista === "clientes" ? "clientes" : "tarjetas";

  return (
    <>
      <AppHeader user={user} section="admin" />
      <main className="mx-auto max-w-6xl px-4 pb-32">
        <PageHeading
          title={tab === "tarjetas" ? "Tarjetas" : "Clientes"}
          subtitle={
            tab === "tarjetas"
              ? "Asigna tarjetas a tus clientes y revisa cuánto gastan."
              : "Invita clientes y decide si ven su saldo y sus movimientos."
          }
        />
        <Tabs
          items={[
            { href: "/admin", label: "Tarjetas", active: tab === "tarjetas" },
            { href: "/admin?vista=clientes", label: "Clientes", active: tab === "clientes" },
          ]}
        />

        {tab === "tarjetas" ? (
          <Suspense fallback={<TableSkeleton />}>
            <CardsSection />
          </Suspense>
        ) : (
          <>
            <section className="mt-8 rounded-2xl bg-wash p-5 sm:p-6" aria-labelledby="invitar">
              <h2 id="invitar" className="font-display text-2xl font-semibold tracking-tight">
                Invitar cliente
              </h2>
              <p className="mb-4 mt-1 text-sm text-muted">
                Crea su cuenta y te da un enlace para que elija su contraseña. Tú se lo mandas.
              </p>
              <InviteForm />
            </section>
            <Suspense fallback={<Skeleton className="mt-10 h-64 w-full" />}>
              <ClientsSection />
            </Suspense>
          </>
        )}
      </main>
    </>
  );
}
