"use client";

import { ChevronDown } from "lucide-react";
import { Fragment, useState } from "react";
import { CardMini } from "@/components/card-faces";
import { Button, StatusChip } from "@/components/ui";
import type { CardStatus } from "@/lib/airwallex/types";
import { formatDateTime } from "@/lib/dates";
import type { Permissions } from "@/lib/permissions";
import { unassignCard } from "./actions";
import { PasswordLinkForm } from "./link-forms";
import { PermissionSwitch } from "./permission-switch";

export type ClientItem = {
  id: string;
  name: string;
  email: string;
  hasName: boolean;
  lastSignInAt: string | null;
  permissions: Permissions;
  cards: { id: string; name: string; last4: string; status: CardStatus | undefined }[];
};

export function ClientsList({ clients }: { clients: ClientItem[] }) {
  const [open, setOpen] = useState<string | null>(null);

  if (clients.length === 0) {
    return <p className="mt-10 text-muted">Aún no hay clientes. Invita al primero arriba.</p>;
  }

  return (
    <section className="mt-10" aria-labelledby="lista-clientes">
      <h2 id="lista-clientes" className="font-display text-2xl font-semibold tracking-tight">
        {clients.length === 1 ? "1 cliente" : `${clients.length} clientes`}
      </h2>
      <p className="mt-1 text-sm text-muted">
        <strong className="font-medium text-ink">Saldo</strong> es el gasto del mes y lo que le queda disponible.{" "}
        <strong className="font-medium text-ink">Movimientos</strong> es la lista de compras de cada tarjeta.{" "}
        <strong className="font-medium text-ink">Datos de tarjeta</strong> es el número completo, el vencimiento y el
        CVV; sin este permiso solo ve la terminación.
      </p>

      <div className="mt-4 overflow-x-auto rounded-xl border border-line">
        <table className="w-full min-w-[920px] border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-line bg-wash text-muted">
              <th scope="col" className="py-3 pl-4 pr-3 font-medium">Cliente</th>
              <th scope="col" className="px-3 py-3 font-medium">Tarjetas</th>
              <th scope="col" className="px-3 py-3 font-medium">Último acceso</th>
              <th scope="col" className="px-3 py-3 font-medium">Ve su saldo</th>
              <th scope="col" className="px-3 py-3 font-medium">Ve sus movimientos</th>
              <th scope="col" className="py-3 pl-3 pr-4 font-medium">Ve datos de tarjeta</th>
            </tr>
          </thead>
          <tbody>
            {clients.map((client) => {
              const expanded = open === client.id;
              return (
                <Fragment key={client.id}>
                  <tr className={`border-b border-line last:border-b-0 ${expanded ? "bg-wash" : ""}`}>
                    <td className="py-3 pl-4 pr-3">
                      <span className="block max-w-64 truncate font-semibold">{client.name}</span>
                      {client.hasName ? <span className="block max-w-64 truncate text-muted">{client.email}</span> : null}
                    </td>
                    <td className="px-3 py-3">
                      <button
                        type="button"
                        onClick={() => setOpen(expanded ? null : client.id)}
                        aria-expanded={expanded}
                        aria-controls={`cliente-${client.id}`}
                        className="inline-flex min-h-11 cursor-pointer items-center gap-1.5 rounded-md font-medium hover:text-accent"
                      >
                        {client.cards.length === 1 ? "1 tarjeta" : `${client.cards.length} tarjetas`}
                        <ChevronDown aria-hidden className={`size-4 transition-transform ${expanded ? "rotate-180" : ""}`} />
                      </button>
                    </td>
                    <td className="px-3 py-3 text-muted">
                      {client.lastSignInAt ? formatDateTime(client.lastSignInAt) : "Invitado, aún no entra"}
                    </td>
                    <td className="px-3 py-1">
                      <PermissionSwitch
                        userId={client.id}
                        permission="balance"
                        on={client.permissions.balance}
                        label={`${client.name} ve su saldo`}
                      />
                    </td>
                    <td className="px-3 py-1">
                      <PermissionSwitch
                        userId={client.id}
                        permission="transactions"
                        on={client.permissions.transactions}
                        label={`${client.name} ve sus movimientos`}
                      />
                    </td>
                    <td className="py-1 pl-3 pr-4">
                      <PermissionSwitch
                        userId={client.id}
                        permission="card_details"
                        on={client.permissions.cardDetails}
                        label={`${client.name} ve los datos completos de sus tarjetas`}
                      />
                    </td>
                  </tr>
                  {expanded ? (
                    <tr id={`cliente-${client.id}`} className="border-b border-line bg-wash last:border-b-0">
                      <td colSpan={6} className="px-4 pb-4 pt-1">
                        {client.cards.length === 0 ? (
                          <p className="text-muted">Sin tarjetas. Asígnale desde la pestaña Tarjetas.</p>
                        ) : (
                          <ul className="divide-y divide-line overflow-hidden rounded-lg border border-line bg-paper">
                            {client.cards.map((card) => (
                              <li key={card.id} className="flex items-center justify-between gap-4 px-3 py-2">
                                <span className="flex min-w-0 items-center gap-3">
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
                                    <input type="hidden" name="user_id" value={client.id} />
                                    <Button
                                      type="submit"
                                      variant="danger"
                                      className="min-h-9 px-3"
                                      aria-label={`Quitarle ${card.name} a ${client.name}`}
                                    >
                                      Quitar
                                    </Button>
                                  </form>
                                </span>
                              </li>
                            ))}
                          </ul>
                        )}
                        <div className="mt-3">
                          <PasswordLinkForm email={client.email} />
                        </div>
                      </td>
                    </tr>
                  ) : null}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
