import { describe, expect, it } from "vitest";
import { brandLabel, formatAmount, formatCardNumber, formatExpiry, maskedCardNumber } from "./format";

describe("formatAmount", () => {
  it("writes the amount with two decimals followed by the currency code", () => {
    expect(formatAmount(3645.4, "MXN")).toBe("3,645.40 MXN");
    expect(formatAmount(0, "USD")).toBe("0.00 USD");
  });
});

describe("formatCardNumber", () => {
  it("groups a 16-digit number in blocks of four", () => {
    expect(formatCardNumber("4111111111111111")).toBe("4111 1111 1111 1111");
  });

  it("ignores spaces already present", () => {
    expect(formatCardNumber("4111 1111 1111 1111")).toBe("4111 1111 1111 1111");
  });
});

describe("maskedCardNumber", () => {
  it("shows only the last four digits of an Airwallex masked number", () => {
    expect(maskedCardNumber("************4111")).toBe("•••• •••• •••• 4111");
  });

  it("returns dots only when there are no digits", () => {
    expect(maskedCardNumber("")).toBe("•••• •••• •••• ••••");
  });
});

describe("formatExpiry", () => {
  it("formats month and year as MM/YY", () => {
    expect(formatExpiry(1, 2027)).toBe("01/27");
  });
});

describe("brandLabel", () => {
  it("uppercases known brands regardless of casing", () => {
    expect(brandLabel("visa")).toBe("VISA");
    expect(brandLabel("MASTERCARD")).toBe("MASTERCARD");
  });

  it("falls back to an empty label when brand is missing", () => {
    expect(brandLabel(undefined)).toBe("");
  });
});
