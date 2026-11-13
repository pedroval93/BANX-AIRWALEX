import { describe, expect, it } from "vitest";
import { limitIntervalLabel, primaryLimit } from "./limits";

describe("primaryLimit", () => {
  it("uses the spending limit, not the per-purchase one", () => {
    const usage = primaryLimit({
      currency: "USD",
      limits: [
        { amount: 50000, interval: "PER_TRANSACTION", remaining: 50000 },
        { amount: 6000, interval: "ALL_TIME", remaining: 531.47 },
      ],
    });
    expect(usage).toEqual({
      currency: "USD",
      interval: "ALL_TIME",
      amount: 6000,
      used: 5468.53,
      remaining: 531.47,
      percent: 91,
    });
  });

  it("caps the percentage between 0 and 100", () => {
    const over = primaryLimit({ currency: "MXN", limits: [{ amount: 100, interval: "MONTHLY", remaining: -20 }] });
    expect(over?.percent).toBe(100);
    const untouched = primaryLimit({ currency: "MXN", limits: [{ amount: 100, interval: "MONTHLY", remaining: 100 }] });
    expect(untouched?.percent).toBe(0);
  });

  it("falls back to the per-purchase limit when it is the only one", () => {
    const usage = primaryLimit({ currency: "MXN", limits: [{ amount: 500, interval: "PER_TRANSACTION" }] });
    expect(usage).toMatchObject({ interval: "PER_TRANSACTION", amount: 500, used: 0, percent: 0 });
  });

  it("returns nothing when the card has no limits", () => {
    expect(primaryLimit({ currency: "MXN", limits: [] })).toBeNull();
    expect(primaryLimit(null)).toBeNull();
  });
});

describe("limitIntervalLabel", () => {
  it("names each interval in Spanish", () => {
    expect(limitIntervalLabel("ALL_TIME")).toBe("total");
    expect(limitIntervalLabel("MONTHLY")).toBe("al mes");
    expect(limitIntervalLabel("PER_TRANSACTION")).toBe("por compra");
  });
});
