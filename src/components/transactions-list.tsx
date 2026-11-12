import type { CardTransaction } from "@/lib/airwallex";
import { formatMoney } from "@/lib/cards/format";
import { TX_STATUS_LABEL } from "@/lib/cards/labels";
import { countsAsSpend, transactionAmount } from "@/lib/cards/spend";
import { formatDateTime } from "@/lib/dates";

export function TransactionsList({ transactions }: { transactions: CardTransaction[] }) {
  if (transactions.length === 0) {
    return <p className="py-6 text-muted">No hay movimientos en este mes.</p>;
  }

  const sorted = [...transactions].sort((a, b) => b.created_at.localeCompare(a.created_at));

  return (
    <ul className="divide-y divide-line border-y border-line">
      {sorted.map((tx) => {
        const amount = transactionAmount(tx);
        const counted = countsAsSpend(tx);
        const isRefund = counted && amount < 0;
        const status = TX_STATUS_LABEL[tx.status];
        return (
          <li key={tx.id} className="flex items-start justify-between gap-4 py-3.5">
            <div className="min-w-0">
              <p className="truncate font-medium">{tx.merchant?.name || "Comercio sin nombre"}</p>
              <p className="text-sm text-muted">
                {formatDateTime(tx.created_at)}
                {status ? <span className={counted ? "" : "text-danger"}>{`, ${status.toLowerCase()}`}</span> : null}
                {tx.failure_reason ? <span className="text-danger">{`: ${tx.failure_reason}`}</span> : null}
              </p>
            </div>
            <p
              className={`shrink-0 text-right font-medium tabular-nums ${
                !counted ? "text-muted line-through" : isRefund ? "text-credit" : ""
              }`}
            >
              {isRefund ? "+" : counted ? "−" : ""}
              {formatMoney(Math.abs(amount), tx.billing_amounts.currency)}
            </p>
          </li>
        );
      })}
    </ul>
  );
}
