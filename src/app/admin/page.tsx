import { AppHeader } from "@/components/app-header";
import { Button } from "@/components/ui";
import type { AirwallexCard } from "@/lib/airwallex";
import { requireAdmin } from "@/lib/auth";
import { maskedCardNumber } from "@/lib/cards/format";
import { CARD_STATUS_LABEL } from "@/lib/cards/labels";
import { listAllCards, listClients } from "@/lib/data";
import { formatDateTime } from "@/lib/dates";
import { assignCard, setShowTransactions, unassignCard } from "./actions";
import { InviteForm, PasswordLinkForm } from "./link-forms";

function cardLabel(card: AirwallexCard | undefined, cardId: string) {
  if (!card) return `Tarjeta ${cardId.slice(0, 8)} (no aparece en Airwallex)`;
  const status =
    card.card_status && card.card_status !== "ACTIVE" ? `, ${CARD_STATUS_LABEL[card.card_status].toLowerCase()}` : "";
  return `${card.nick_name || "Sin nombre"}, ${maskedCardNumber(card.card_number).slice(-4)}${status}`;
}

export default async function AdminPage() {
  const user = await requireAdmin();
  const [clients, { cards, error: cardsError }] = await Promise.all([listClients(), listAllCards()]);

  const cardsById = new Map(cards.map((c) => [c.card_id, c]));
  const assigned = new Set(clients.flatMap((c) => c.cardIds));
  // Las tarjetas cerradas ya no se pueden usar: no se ofrecen para asignar.
  const free = cards.filter((c) => !assigned.has(c.card_id));
  const closedCount = free.filter((c) => c.card_status === "CLOSED").length;
  const unassigned = free
    .filter((c) => c.card_status !== "CLOSED")
    .sort((a, b) => (a.nick_name ?? "").localeCompare(b.nick_name ?? "", "es", { numeric: true }));

  return (
    <>
      <AppHeader user={user} />
      <main className="mx-auto max-w-2xl px-4 pb-20">
        <h1 className="mt-4 text-3xl font-semibold tracking-tight">Administrar</h1>

        <section className="mt-10" aria-labelledby="invitar">
          <h2 id="invitar" className="text-lg font-semibold">
            Invitar cliente
          </h2>
          <p className="mb-4 mt-1 text-sm text-muted">
            Crea su cuenta y te da un enlace para que elija su contraseña. Tú se lo mandas.
          </p>
          <InviteForm />
        </section>

        {cardsError ? (
          <p role="alert" className="mt-10 rounded-lg border border-danger/40 p-4 text-sm text-danger">
            No se pudieron traer las tarjetas de Airwallex: {cardsError}
          </p>
        ) : null}

        <section className="mt-12" aria-labelledby="clientes">
          <h2 id="clientes" className="text-lg font-semibold">
            Clientes ({clients.length})
          </h2>

          {clients.length === 0 ? (
            <p className="mt-3 text-muted">Aún no hay clientes. Invita al primero arriba.</p>
          ) : (
            <ul className="mt-4 divide-y divide-line border-y border-line">
              {clients.map((client) => (
                <li key={client.id} className="space-y-4 py-6">
                  <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                    <div className="min-w-0">
                      <p className="truncate font-semibold">{client.full_name || client.email}</p>
                      {client.full_name ? <p className="truncate text-sm text-muted">{client.email}</p> : null}
                    </div>
                    <p className="text-sm text-muted">
                      {client.lastSignInAt
                        ? `Último acceso: ${formatDateTime(client.lastSignInAt)}`
                        : "Invitado, aún no entra"}
                    </p>
                  </div>

                  <form action={setShowTransactions} className="flex items-center justify-between gap-4">
                    <input type="hidden" name="user_id" value={client.id} />
                    <input type="hidden" name="show" value={String(!client.show_transactions)} />
                    <span className="text-sm">
                      Gasto y movimientos:{" "}
                      <strong className={client.show_transactions ? "text-credit" : "text-muted"}>
                        {client.show_transactions ? "los ve" : "ocultos"}
                      </strong>
                    </span>
                    <Button type="submit" variant="quiet" className="py-1.5">
                      {client.show_transactions ? "Ocultar" : "Mostrar"}
                    </Button>
                  </form>

                  <div>
                    <p className="text-sm text-muted">Tarjetas</p>
                    {client.cardIds.length === 0 ? (
                      <p className="text-sm">Sin tarjetas asignadas.</p>
                    ) : (
                      <ul className="mt-1 space-y-1">
                        {client.cardIds.map((cardId) => (
                          <li key={cardId} className="flex items-center justify-between gap-4">
                            <span className="text-sm">{cardLabel(cardsById.get(cardId), cardId)}</span>
                            <form action={unassignCard}>
                              <input type="hidden" name="card_id" value={cardId} />
                              <Button type="submit" variant="danger" className="px-0 py-1">
                                Quitar
                              </Button>
                            </form>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>

                  {unassigned.length > 0 ? (
                    <form action={assignCard} className="flex gap-2">
                      <input type="hidden" name="user_id" value={client.id} />
                      <label className="sr-only" htmlFor={`card-${client.id}`}>
                        Tarjeta para asignar
                      </label>
                      <select
                        id={`card-${client.id}`}
                        name="card_id"
                        required
                        defaultValue=""
                        className="min-w-0 flex-1 rounded-md border border-line bg-surface px-3 py-2 text-sm"
                      >
                        <option value="" disabled>
                          Elige una tarjeta sin asignar
                        </option>
                        {unassigned.map((card) => (
                          <option key={card.card_id} value={card.card_id}>
                            {cardLabel(card, card.card_id)}
                          </option>
                        ))}
                      </select>
                      <Button type="submit" variant="quiet" className="py-2">
                        Asignar
                      </Button>
                    </form>
                  ) : null}

                  <PasswordLinkForm email={client.email} />
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="mt-12" aria-labelledby="sin-asignar">
          <h2 id="sin-asignar" className="text-lg font-semibold">
            Tarjetas sin asignar ({unassigned.length})
          </h2>
          {unassigned.length === 0 ? (
            <p className="mt-2 text-sm text-muted">Todas las tarjetas de Airwallex ya tienen dueño.</p>
          ) : (
            <ul className="mt-2 space-y-1 text-sm">
              {unassigned.map((card) => (
                <li key={card.card_id}>{cardLabel(card, card.card_id)}</li>
              ))}
            </ul>
          )}
          {closedCount > 0 ? (
            <p className="mt-3 text-sm text-muted">
              {closedCount === 1
                ? "1 tarjeta cerrada no aparece aquí."
                : `${closedCount} tarjetas cerradas no aparecen aquí.`}
            </p>
          ) : null}
        </section>
      </main>
    </>
  );
}
