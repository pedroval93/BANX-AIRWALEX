import { ChevronDown } from "lucide-react";
import { CardMini } from "@/components/card-faces";
import { Button, StatusChip } from "@/components/ui";
import type { CardStatus } from "@/lib/airwallex/types";
import { formatDateTime } from "@/lib/dates";
import { setShowTransactions, unassignCard } from "./actions";
import { PasswordLinkForm } from "./link-forms";

export type ClientItem = {
  id: string;
  name: string;
  email: string;
  hasName: boolean;
  lastSignInAt: string | null;
  showTransactions: boolean;
  cards: { id: string; name: string; last4: string; status: CardStatus | undefined }[];
};

export function ClientsList({ clients }: { clients: ClientItem[] }) {
  if (clients.length === 0) {
    return <p className="mt-10 text-muted">Aún no hay clientes. Invita al primero arriba.</p>;
  }

  return (
    <section className="mt-10" aria-labelledby="lista-clientes">
      <h2 id="lista-clientes" className="font-display text-2xl font-semibold tracking-tight">
        {clients.length === 1 ? "1 cliente" : `${clients.length} clientes`}
      </h2>
      <ul className="mt-4 divide-y divide-line overflow-hidden rounded-xl border border-line">
        {clients.map((client) => (
          <li key={client.id} className="p-4 sm:p-5">
            <div className="flex flex-wrap items-start justify-between gap-x-6 gap-y-3">
              <div className="min-w-0">
                <p className="truncate font-semibold">{client.name}</p>
                {client.hasName ? <p className="truncate text-sm text-muted">{client.email}</p> : null}
                <p className="mt-1 text-sm text-muted">
                  {client.lastSignInAt
                    ? `Último acceso: ${formatDateTime(client.lastSignInAt)}`
                    : "Invitado, aún no entra"}
                </p>
              </div>

              <form action={setShowTransactions} className="flex items-center gap-3">
                <input type="hidden" name="user_id" value={client.id} />
                <input type="hidden" name="show" value={String(!client.showTransactions)} />
                <span className="text-sm">
                  Gasto y movimientos:{" "}
                  <strong className={client.showTransactions ? "text-credit" : "text-muted"}>
                    {client.showTransactions ? "los ve" : "ocultos"}
                  </strong>
                </span>
                <Button type="submit" variant="quiet" className="min-h-9 px-3">
                  {client.showTransactions ? "Ocultar" : "Mostrar"}
                </Button>
              </form>
            </div>

            <details className="group mt-3">
              <summary className="inline-flex min-h-11 cursor-pointer list-none items-center gap-1.5 rounded-md text-sm font-medium hover:text-accent [&::-webkit-details-marker]:hidden">
                {client.cards.length === 1 ? "1 tarjeta" : `${client.cards.length} tarjetas`}
                <ChevronDown aria-hidden className="size-4 transition-transform group-open:rotate-180" />
              </summary>
              {client.cards.length === 0 ? (
                <p className="pb-2 text-sm text-muted">
                  Sin tarjetas. Asígnale desde la pestaña Tarjetas.
                </p>
              ) : (
                <ul className="mt-1 divide-y divide-line rounded-lg border border-line">
                  {client.cards.map((card) => (
                    <li key={card.id} className="flex items-center justify-between gap-4 px-3 py-2">
                      <span className="flex min-w-0 items-center gap-3 text-sm">
                        <CardMini />
                        <span className="min-w-0">
                          <span className="block truncate font-medium">{card.name}</span>
                          <span className="block text-muted tabular-nums">•••• {card.last4}</span>
                        </span>
                      </span>
                      <span className="flex items-center gap-3">
                        {card.status ? <StatusChip status={card.status} /> : null}
                        <form action={unassignCard}>
                          <input type="hidden" name="card_id" value={card.id} />
                          <Button type="submit" variant="danger" className="min-h-9 px-3">
                            Quitar
                          </Button>
                        </form>
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </details>

            <div className="mt-2">
              <PasswordLinkForm email={client.email} />
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
