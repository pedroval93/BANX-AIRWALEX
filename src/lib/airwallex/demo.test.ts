import { describe, expect, it } from "vitest";
import { monthRange } from "@/lib/dates";
import { createDemoIssuing } from "./demo";

describe("demo issuing data", () => {
  it("offers a few active cards with masked numbers", async () => {
    const cards = await createDemoIssuing().listCards();
    expect(cards.length).toBeGreaterThan(0);
    for (const card of cards) expect(card.card_number).toMatch(/^\*{12}\d{4}$/);
  });

  it("returns details whose last four digits match the masked number", async () => {
    const api = createDemoIssuing();
    const [card] = await api.listCards();
    const details = await api.getCardDetails(card.card_id);
    expect(details.card_number.slice(-4)).toBe(card.card_number!.slice(-4));
  });

  it("only returns transactions inside the requested range", async () => {
    const api = createDemoIssuing(new Date("2026-11-12T12:00:00Z"));
    const [card] = await api.listCards();
    const range = monthRange("2026-11");
    const txs = await api.listCardTransactions(card.card_id, range);
    expect(txs.length).toBeGreaterThan(0);
    for (const tx of txs) {
      expect(tx.created_at >= range.from && tx.created_at <= range.to).toBe(true);
    }
  });

  it("fails for a card that does not exist", async () => {
    await expect(createDemoIssuing().getCard("nope")).rejects.toThrow();
  });
});
