import { describe, expect, it } from "vitest";
import { permissionsOf } from "./permissions";

describe("permissionsOf", () => {
  it("reads the balance and transactions permissions separately", () => {
    expect(permissionsOf({ show_balance: true, show_transactions: false, show_card_details: true })).toEqual({
      balance: true,
      transactions: false,
      cardDetails: true,
    });
    expect(permissionsOf({ show_balance: false, show_transactions: true, show_card_details: true })).toEqual({
      balance: false,
      transactions: true,
      cardDetails: true,
    });
  });

  it("can show movements while hiding the full card data", () => {
    expect(permissionsOf({ show_balance: true, show_transactions: true, show_card_details: false })).toEqual({
      balance: true,
      transactions: true,
      cardDetails: false,
    });
  });

  it("uses the transactions permission for the balance until the new column exists", () => {
    expect(permissionsOf({ show_transactions: true })).toMatchObject({ balance: true, transactions: true });
    expect(permissionsOf({ show_transactions: false })).toMatchObject({ balance: false, transactions: false });
  });

  it("keeps showing the card data until the card data column exists", () => {
    expect(permissionsOf({ show_transactions: false }).cardDetails).toBe(true);
  });

  it("shows nothing when there is no profile", () => {
    expect(permissionsOf(null)).toEqual({ balance: false, transactions: false, cardDetails: false });
  });
});
