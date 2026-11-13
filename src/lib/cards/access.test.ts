import { describe, expect, it } from "vitest";
import { clientsByCard, ownersLabel } from "./access";

describe("clientsByCard", () => {
  it("lists every client that can see each card", () => {
    const map = clientsByCard([
      { id: "ana", cardIds: ["c1", "c2"] },
      { id: "luis", cardIds: ["c1"] },
    ]);
    expect(map.get("c1")).toEqual(["ana", "luis"]);
    expect(map.get("c2")).toEqual(["ana"]);
  });

  it("has nothing for a card nobody can see", () => {
    expect(clientsByCard([{ id: "ana", cardIds: [] }]).get("c1")).toBeUndefined();
  });
});

describe("ownersLabel", () => {
  it("says the card has nobody yet", () => {
    expect(ownersLabel([])).toBe("Sin asignar");
  });

  it("shows one or two names in full", () => {
    expect(ownersLabel(["Ana"])).toBe("Ana");
    expect(ownersLabel(["Ana", "Luis"])).toBe("Ana y Luis");
  });

  it("counts the rest after two names", () => {
    expect(ownersLabel(["Ana", "Luis", "Eva"])).toBe("Ana, Luis y 1 más");
    expect(ownersLabel(["Ana", "Luis", "Eva", "Teo"])).toBe("Ana, Luis y 2 más");
  });
});
