"use client";

import { Search, UserRoundMinus, X } from "lucide-react";
import { useActionState, useEffect, useMemo, useRef, useState } from "react";
import { CardMini } from "@/components/card-faces";
import { Button, LimitBar, Select, StatusChip } from "@/components/ui";
import type { CardStatus } from "@/lib/airwallex/types";
import { matchesQuery } from "@/lib/cards/bulk";
import { formatAmount } from "@/lib/cards/format";
import type { LimitUsage } from "@/lib/cards/limits";
import type { SpendSummary } from "@/lib/cards/spend";
import { assignCards, unassignCards, type AssignState } from "./actions";

export type CardRow = {
  id: string;
  name: string;
  last4: string;
  status: CardStatus | undefined;
  clientId: string | null;
  spend: SpendSummary[];
  limit: LimitUsage | null;
};

export type ClientOption = { id: string; label: string };

type StatusFilter = "ACTIVE" | "OPEN" | "CLOSED" | "ALL";

const STATUS_FILTERS: { value: StatusFilter; label: string }[] = [
  { value: "ACTIVE", label: "Activas" },
  { value: "OPEN", label: "Todas menos cerradas" },
  { value: "CLOSED", label: "Cerradas" },
  { value: "ALL", label: "Todas" },
];

function statusMatches(filter: StatusFilter, status: CardStatus | undefined) {
  if (filter === "ALL") return true;
  if (filter === "ACTIVE") return status === "ACTIVE";
  if (filter === "CLOSED") return status === "CLOSED";
  return status !== "CLOSED";
}

const initial: AssignState = { error: null, assigned: 0 };
const plural = (n: number, one: string, many: string) => (n === 1 ? `1 ${one}` : `${n} ${many}`);

export function CardsTable({
  rows,
  clients,
  defaultCurrency,
  monthName,
}: {
  rows: CardRow[];
  clients: ClientOption[];
  defaultCurrency: string;
  monthName: string;
}) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<StatusFilter>("ACTIVE");
  const [owner, setOwner] = useState("all");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [target, setTarget] = useState("");
  const [toast, setToast] = useState<string | null>(null);

  const clientLabel = useMemo(() => new Map(clients.map((c) => [c.id, c.label])), [clients]);

  function done(message: string) {
    setSelected(new Set());
    setToast(message);
  }

  const [assignState, assignAction, assigning] = useActionState(async (prev: AssignState, fd: FormData) => {
    const result = await assignCards(prev, fd);
    if (!result.error) {
      const who = clientLabel.get(String(fd.get("user_id"))) ?? "el cliente";
      done(`Asignaste ${plural(result.assigned, "tarjeta", "tarjetas")} a ${who}.`);
    }
    return result;
  }, initial);

  const [unassignState, unassignAction, unassigning] = useActionState(async (prev: AssignState, fd: FormData) => {
    const result = await unassignCards(prev, fd);
    if (!result.error) done(`Quitaste el dueño de ${plural(result.assigned, "tarjeta", "tarjetas")}.`);
    return result;
  }, initial);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(timer);
  }, [toast]);

  const visible = useMemo(
    () =>
      rows.filter((row) => {
        if (!statusMatches(status, row.status)) return false;
        if (owner === "none" && row.clientId) return false;
        if (owner !== "all" && owner !== "none" && row.clientId !== owner) return false;
        const who = row.clientId ? (clientLabel.get(row.clientId) ?? "") : "sin asignar";
        return matchesQuery(`${row.name} ${row.last4} ${who}`, query);
      }),
    [rows, status, owner, query, clientLabel],
  );

  const selectedIds = [...selected].filter((id) => rows.some((r) => r.id === id));
  const allVisibleSelected = visible.length > 0 && visible.every((r) => selected.has(r.id));
  const someVisibleSelected = visible.some((r) => selected.has(r.id));

  const headerBox = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (headerBox.current) headerBox.current.indeterminate = someVisibleSelected && !allVisibleSelected;
  }, [someVisibleSelected, allVisibleSelected]);

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleVisible() {
    setSelected((prev) => {
      const next = new Set(prev);
      if (allVisibleSelected) for (const r of visible) next.delete(r.id);
      else for (const r of visible) next.add(r.id);
      return next;
    });
  }

  const filtersOn = query.trim() !== "" || status !== "ACTIVE" || owner !== "all";
  const error = assignState.error ?? unassignState.error;
  const busy = assigning || unassigning;

  return (
    <form>
      {selectedIds.map((id) => (
        <input key={id} type="hidden" name="card_id" value={id} />
      ))}

      <div className="flex flex-wrap items-end gap-3">
        <Select
          label="Estado"
          value={status}
          onChange={(e) => setStatus(e.target.value as StatusFilter)}
          className="w-full sm:w-52"
        >
          {STATUS_FILTERS.map((f) => (
            <option key={f.value} value={f.value}>
              {f.label}
            </option>
          ))}
        </Select>
        <Select label="Cliente" value={owner} onChange={(e) => setOwner(e.target.value)} className="w-full sm:w-56">
          <option value="all">Todos</option>
          <option value="none">Sin asignar</option>
          {clients.map((c) => (
            <option key={c.id} value={c.id}>
              {c.label}
            </option>
          ))}
        </Select>
        <label className="block min-w-0 flex-1 basis-72">
          <span className="mb-1.5 block text-sm font-medium">Buscar</span>
          <span className="relative block">
            <Search aria-hidden className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Nombre de la tarjeta, últimos 4 dígitos o cliente"
              autoComplete="off"
              className="w-full rounded-lg border border-line-strong bg-paper py-2.5 pl-9 pr-3 text-base outline-none transition-colors placeholder:text-muted focus:border-accent"
            />
          </span>
        </label>
      </div>

      <p className="mt-4 text-sm text-muted" aria-live="polite">
        {plural(visible.length, "tarjeta", "tarjetas")}
        {filtersOn ? (
          <>
            {" · "}
            <button
              type="button"
              className="cursor-pointer font-medium text-ink underline underline-offset-2 hover:text-accent"
              onClick={() => {
                setQuery("");
                setStatus("ACTIVE");
                setOwner("all");
              }}
            >
              Quitar filtros
            </button>
          </>
        ) : null}
      </p>

      <div className="mt-2 overflow-x-auto rounded-xl border border-line">
        <table className="w-full min-w-[760px] border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-line bg-wash text-muted">
              <th scope="col" className="w-12 py-3 pl-4">
                <input
                  ref={headerBox}
                  type="checkbox"
                  checked={allVisibleSelected}
                  onChange={toggleVisible}
                  disabled={visible.length === 0}
                  aria-label="Marcar todas las que se ven"
                  className="size-4 cursor-pointer accent-[var(--accent)]"
                />
              </th>
              <th scope="col" className="px-3 py-3 font-medium">Tarjeta</th>
              <th scope="col" className="px-3 py-3 font-medium">Cliente</th>
              <th scope="col" className="px-3 py-3 text-right font-medium">Gasto de {monthName}</th>
              <th scope="col" className="px-3 py-3 font-medium">Uso del límite</th>
              <th scope="col" className="py-3 pl-3 pr-4 font-medium">Estado</th>
            </tr>
          </thead>
          <tbody>
            {visible.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-14 text-center text-muted">
                  Ninguna tarjeta coincide con los filtros.
                </td>
              </tr>
            ) : (
              visible.map((row) => {
                const isSelected = selected.has(row.id);
                const spend = row.spend.length
                  ? row.spend.map((s) => formatAmount(s.total, s.currency)).join(" + ")
                  : formatAmount(0, defaultCurrency);
                return (
                  <tr
                    key={row.id}
                    onClick={(e) => {
                      if ((e.target as HTMLElement).closest("input,button,a,select")) return;
                      toggle(row.id);
                    }}
                    className={`cursor-pointer border-b border-line transition-colors last:border-b-0 ${
                      isSelected ? "bg-highlight/70" : "hover:bg-wash"
                    }`}
                  >
                    <td className="py-3 pl-4">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggle(row.id)}
                        aria-label={`Marcar ${row.name}, terminación ${row.last4}`}
                        className="size-4 cursor-pointer accent-[var(--accent)]"
                      />
                    </td>
                    <td className="px-3 py-3">
                      <span className="flex items-center gap-3">
                        <CardMini />
                        <span className="min-w-0">
                          <span className="block truncate font-semibold">{row.name}</span>
                          <span className="block text-muted tabular-nums">•••• {row.last4}</span>
                        </span>
                      </span>
                    </td>
                    <td className="px-3 py-3">
                      {row.clientId ? (
                        <span className="font-medium">{clientLabel.get(row.clientId) ?? "Cliente"}</span>
                      ) : (
                        <span className="text-muted">Sin asignar</span>
                      )}
                    </td>
                    <td className="px-3 py-3 text-right font-medium tabular-nums">
                      {row.status === "CLOSED" && row.spend.length === 0 ? <span className="text-muted">—</span> : spend}
                    </td>
                    <td className="px-3 py-3">
                      {row.status === "CLOSED" ? <span className="text-muted">—</span> : <LimitBar usage={row.limit} />}
                    </td>
                    <td className="py-3 pl-3 pr-4">
                      <StatusChip status={row.status} />
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Barra de acciones: aparece al marcar tarjetas. */}
      <div
        className="dock fixed bottom-4 left-1/2 z-20 w-[min(100%-2rem,52rem)] rounded-2xl bg-night p-3 text-night-ink shadow-[0_20px_50px_-20px_rgba(0,0,0,0.6)]"
        data-open={selectedIds.length > 0}
        inert={selectedIds.length === 0}
      >
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
          <p className="px-2 text-sm font-semibold" aria-live="polite">
            {plural(selectedIds.length, "marcada", "marcadas")}
          </p>
          <label className="sr-only" htmlFor="bulk-target">
            Asignar a
          </label>
          <select
            id="bulk-target"
            name="user_id"
            value={target}
            onChange={(e) => setTarget(e.target.value)}
            className="min-h-11 min-w-0 flex-1 basis-48 cursor-pointer rounded-lg border border-white/20 bg-white/10 px-3 text-sm text-white outline-none focus:border-accent [&>option]:text-[#2f3b3b]"
          >
            <option value="">Asignar a…</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.label}
              </option>
            ))}
          </select>
          <Button type="submit" formAction={assignAction} disabled={busy || !target}>
            {assigning ? "Asignando…" : "Asignar"}
          </Button>
          <Button
            type="submit"
            formAction={unassignAction}
            variant="ghost"
            disabled={busy}
            className="text-white hover:bg-white/10"
          >
            <UserRoundMinus aria-hidden className="size-4" />
            {unassigning ? "Quitando…" : "Quitar dueño"}
          </Button>
          <button
            type="button"
            onClick={() => setSelected(new Set())}
            className="ml-auto inline-flex size-11 cursor-pointer items-center justify-center rounded-lg text-white/75 transition-colors hover:bg-white/10 hover:text-white"
            aria-label="Desmarcar todas"
          >
            <X aria-hidden className="size-5" />
          </button>
        </div>
        {error ? (
          <p role="alert" className="px-2 pt-2 text-sm text-[#ffb3a6]">
            {error}
          </p>
        ) : null}
      </div>

      {/* Aviso de lo que se hizo. */}
      <div
        role="status"
        className="dock fixed bottom-4 left-1/2 z-10 rounded-xl bg-highlight px-4 py-3 text-sm font-medium text-[#2f3b3b] shadow-lg"
        data-open={Boolean(toast) && selectedIds.length === 0}
      >
        {toast}
      </div>
    </form>
  );
}
