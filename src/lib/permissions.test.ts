import { describe, expect, it } from "vitest";
import { permissionsOf } from "./permissions";

describe("permissionsOf", () => {
  it("reads the balance and transactions permissions separately", () => {
    expect(permissionsOf({ show_balance: true, show_transactions: false })).toEqual({
      balance: true,
      transactions: false,
    });
    expect(permissionsOf({ show_balance: false, show_transactions: true })).toEqual({
      balance: false,
      transactions: true,
    });
  });

  it("uses the transactions permission for the balance until the new column exists", () => {
    expect(permissionsOf({ show_transactions: true })).toEqual({ balance: true, transactions: true });
    expect(permissionsOf({ show_transactions: false })).toEqual({ balance: false, transactions: false });
  });

  it("shows nothing when there is no profile", () => {
    expect(permissionsOf(null)).toEqual({ balance: false, transactions: false });
  });
});
