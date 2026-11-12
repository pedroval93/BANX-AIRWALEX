import { describe, expect, it } from "vitest";
import type { CardTransaction } from "@/lib/airwallex/types";
import { countsAsSpend, summarizeSpend, transactionAmount } from "./spend";

function tx(partial: Partial<CardTransaction>): CardTransaction {
  return {
    id: "tx",
    card_id: "card",
    status: "CLEARED",
    fund_direction: "DEBIT",
    billing_amounts: { currency: "MXN" },
    created_at: "2026-11-01T10:00:00+00:00",
    ...partial,
  };
}

describe("transactionAmount", () => {
  it("is the debited amount for a cleared purchase", () => {
    expect(
      transactionAmount(tx({ billing_amounts: { currency: "MXN", total_debited: 250.5 } })),
    ).toBe(250.5);
  });

  it("is negative for a refund", () => {
    expect(
      transactionAmount(
        tx({ fund_direction: "CREDIT", billing_amounts: { currency: "MXN", total_credited: 80 } }),
      ),
    ).toBe(-80);
  });

  it("uses the pending amount for an authorization that has not been debited yet", () => {
    expect(
      transactionAmount(
        tx({ status: "AUTHORIZED", billing_amounts: { currency: "MXN", total_pending: 120 } }),
      ),
    ).toBe(120);
  });

  it("shows the declined amount for a declined transaction", () => {
    expect(
      transactionAmount(
        tx({ status: "DECLINED", billing_amounts: { currency: "MXN", total_declined: 999 } }),
      ),
    ).toBe(999);
  });
});

describe("countsAsSpend", () => {
  it("counts authorized and cleared transactions", () => {
    expect(countsAsSpend(tx({ status: "AUTHORIZED" }))).toBe(true);
    expect(countsAsSpend(tx({ status: "CLEARED" }))).toBe(true);
  });

  it("does not count declined, reversed or expired transactions", () => {
    expect(countsAsSpend(tx({ status: "DECLINED" }))).toBe(false);
    expect(countsAsSpend(tx({ status: "REVERSED" }))).toBe(false);
    expect(countsAsSpend(tx({ status: "EXPIRED" }))).toBe(false);
  });
});

describe("summarizeSpend", () => {
  it("adds purchases, subtracts refunds and skips declined transactions, per currency", () => {
    const summary = summarizeSpend([
      tx({ billing_amounts: { currency: "MXN", total_debited: 100.1 } }),
      tx({ billing_amounts: { currency: "MXN", total_debited: 200.2 } }),
      tx({ fund_direction: "CREDIT", billing_amounts: { currency: "MXN", total_credited: 50 } }),
      tx({ status: "DECLINED", billing_amounts: { currency: "MXN", total_declined: 1000 } }),
      tx({ billing_amounts: { currency: "USD", total_debited: 10 } }),
    ]);

    expect(summary).toEqual([
      { currency: "MXN", total: 250.3, count: 3 },
      { currency: "USD", total: 10, count: 1 },
    ]);
  });

  it("is empty when there are no transactions", () => {
    expect(summarizeSpend([])).toEqual([]);
  });
});
