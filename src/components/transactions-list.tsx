import type { CardTransaction } from "@/lib/airwallex";
import { formatAmount } from "@/lib/cards/format";
import { TX_STATUS_LABEL } from "@/lib/cards/labels";
import { countsAsSpend, transactionAmount } from "@/lib/cards/spend";
import { formatDateTime } from "@/lib/dates";

export function TransactionsList({ transactions }: { transactions: CardTransaction[] }) {
  if (transactions.length === 0) {
    return <p className="rounded-xl bg-wash px-4 py-10 text-center text-muted">No hay movimientos en este mes.</p>;
  }

  const sorted = [...transactions].sort((a, b) => b.created_at.localeCompare(a.created_at));

  return (
    <ul className="divide-y divide-line overflow-hidden rounded-xl border border-line">
      {sorted.map((tx) => {
        const amount = transactionAmount(tx);
        const counted = countsAsSpend(tx);
        const isRefund = counted && amount < 0;
        const status = TX_STATUS_LABEL[tx.status];
        return (
          <li key={tx.id} className="flex items-start justify-between gap-4 px-4 py-3.5">
            <div className="min-w-0">
              <p className="truncate font-medium">{tx.merchant?.name || "Comercio sin nombre"}</p>
              <p className="text-sm text-muted">
                {formatDateTime(tx.created_at)}
                {status ? (
                  <span
                    className={`ml-2 rounded px-1.5 py-0.5 text-xs font-medium ${
                      counted ? "bg-wash text-ink" : "bg-danger-wash text-danger"
                    }`}
                  >
                    {status}
                  </span>
                ) : null}
                {tx.failure_reason ? <span className="block text-danger">{tx.failure_reason}</span> : null}
              </p>
            </div>
            <p
              className={`shrink-0 text-right font-semibold tabular-nums ${
                !counted ? "text-muted line-through" : isRefund ? "text-credit" : ""
              }`}
            >
              {isRefund ? "+" : counted ? "−" : ""}
              {formatAmount(Math.abs(amount), tx.billing_amounts.currency)}
            </p>
          </li>
        );
      })}
    </ul>
  );
}
