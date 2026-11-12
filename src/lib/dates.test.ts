import { describe, expect, it } from "vitest";
import { monthRange, parseMonth, shiftMonth } from "./dates";

describe("parseMonth", () => {
  it("accepts a YYYY-MM value", () => {
    expect(parseMonth("2026-03", new Date("2026-11-12T12:00:00Z"))).toBe("2026-03");
  });

  it("falls back to the current month for missing or invalid values", () => {
    const now = new Date("2026-11-12T12:00:00Z");
    expect(parseMonth(undefined, now)).toBe("2026-11");
    expect(parseMonth("2026-13", now)).toBe("2026-11");
    expect(parseMonth("hola", now)).toBe("2026-11");
  });
});

describe("shiftMonth", () => {
  it("moves across year boundaries", () => {
    expect(shiftMonth("2026-01", -1)).toBe("2025-12");
    expect(shiftMonth("2025-12", 1)).toBe("2026-01");
  });
});

describe("monthRange", () => {
  it("covers the whole month in Mexico City time", () => {
    expect(monthRange("2026-11")).toEqual({
      from: "2026-11-01T06:00:00.000Z",
      to: "2026-12-01T05:59:59.999Z",
    });
  });
});
