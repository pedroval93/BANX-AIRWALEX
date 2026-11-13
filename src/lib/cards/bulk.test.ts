import { describe, expect, it } from "vitest";
import { matchesQuery, parseAssignment, parseCardIds } from "./bulk";

function form(entries: [string, string][]) {
  const data = new FormData();
  for (const [key, value] of entries) data.append(key, value);
  return data;
}

describe("parseAssignment", () => {
  it("reads the client and every selected card", () => {
    const result = parseAssignment(
      form([
        ["user_id", "user-1"],
        ["card_id", "card-a"],
        ["card_id", "card-b"],
      ]),
    );
    expect(result).toEqual({ userId: "user-1", cardIds: ["card-a", "card-b"] });
  });

  it("drops repeated and empty card ids", () => {
    const result = parseAssignment(
      form([
        ["user_id", "user-1"],
        ["card_id", "card-a"],
        ["card_id", ""],
        ["card_id", "card-a"],
      ]),
    );
    expect(result).toEqual({ userId: "user-1", cardIds: ["card-a"] });
  });

  it("asks for a client when none is chosen", () => {
    expect(parseAssignment(form([["card_id", "card-a"]]))).toEqual({
      error: "Elige a qué cliente asignar las tarjetas.",
    });
  });

  it("asks for at least one card", () => {
    expect(parseAssignment(form([["user_id", "user-1"]]))).toEqual({
      error: "Marca al menos una tarjeta.",
    });
  });
});

describe("parseCardIds", () => {
  it("reads the selected cards without repeats", () => {
    expect(
      parseCardIds(
        form([
          ["card_id", "a"],
          ["card_id", "a"],
          ["card_id", "b"],
        ]),
      ),
    ).toEqual({ cardIds: ["a", "b"] });
  });

  it("asks for at least one card", () => {
    expect(parseCardIds(form([]))).toEqual({ error: "Marca al menos una tarjeta." });
  });
});

describe("matchesQuery", () => {
  it("matches everything when the search is empty", () => {
    expect(matchesQuery("TikTok Test 0001 8425", "  ")).toBe(true);
  });

  it("ignores case and accents", () => {
    expect(matchesQuery("Publicidad México 1234", "mexico")).toBe(true);
    expect(matchesQuery("Publicidad Mexico 1234", "MÉXICO")).toBe(true);
  });

  it("needs every word of the search, in any order", () => {
    expect(matchesQuery("TikTok Test 0001 8425", "8425 tiktok")).toBe(true);
    expect(matchesQuery("TikTok Test 0001 8425", "tiktok 9999")).toBe(false);
  });
});
