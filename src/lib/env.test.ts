import { afterEach, describe, expect, it, vi } from "vitest";
import { isAdminEmail, parseAdminEmails } from "./env";

afterEach(() => vi.unstubAllEnvs());

describe("parseAdminEmails", () => {
  it("splits a comma separated list, trimming and lowercasing", () => {
    expect(parseAdminEmails(" Pedro@Ejemplo.com, otro@ejemplo.com ,")).toEqual([
      "pedro@ejemplo.com",
      "otro@ejemplo.com",
    ]);
  });
});

describe("isAdminEmail", () => {
  it("matches emails listed in ADMIN_EMAILS without caring about case", () => {
    vi.stubEnv("ADMIN_EMAILS", "pedro@ejemplo.com");
    expect(isAdminEmail("PEDRO@ejemplo.com")).toBe(true);
  });

  it("rejects everyone when ADMIN_EMAILS is empty", () => {
    vi.stubEnv("ADMIN_EMAILS", "");
    expect(isAdminEmail("pedro@ejemplo.com")).toBe(false);
  });

  it("rejects a missing email", () => {
    vi.stubEnv("ADMIN_EMAILS", "pedro@ejemplo.com");
    expect(isAdminEmail(undefined)).toBe(false);
  });
});
