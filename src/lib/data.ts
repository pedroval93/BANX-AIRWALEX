import "server-only";
import { getIssuing, type AirwallexCard, type CardTransaction } from "@/lib/airwallex";
import { primaryLimit, type LimitUsage } from "@/lib/cards/limits";
import { spendByCard, summarizeSpend, type SpendSummary } from "@/lib/cards/spend";
import { mapLimit } from "@/lib/concurrency";
import { monthRange } from "@/lib/dates";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export type Profile = {
  id: string;
  email: string;
  full_name: string | null;
  show_transactions: boolean;
};

// --- Datos del cliente (con su sesión: RLS solo deja ver lo suyo) ---

export async function getMyProfile(userId: string): Promise<Profile | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("id, email, full_name, show_transactions")
    .eq("id", userId)
    .maybeSingle();
  if (error) throw new Error(`No se pudo leer el perfil: ${error.message}`);
  return data;
}

export async function getMyCardIds(userId: string): Promise<string[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("card_assignments")
    .select("airwallex_card_id")
    .eq("user_id", userId)
    .order("created_at");
  if (error) throw new Error(`No se pudieron leer las tarjetas: ${error.message}`);
  return data.map((row) => row.airwallex_card_id);
}

export async function userOwnsCard(userId: string, cardId: string): Promise<boolean> {
  const ids = await getMyCardIds(userId);
  return ids.includes(cardId);
}

// --- Datos del admin (clave secreta: solo después de requireAdmin) ---

export type ClientRow = Profile & {
  invited: boolean;
  lastSignInAt: string | null;
  cardIds: string[];
};

export async function listClients(): Promise<ClientRow[]> {
  const admin = createAdminClient();
  const [profiles, assignments, users] = await Promise.all([
    admin
      .from("profiles")
      .select("id, email, full_name, show_transactions, created_at")
      .order("created_at", { ascending: false }),
    admin.from("card_assignments").select("user_id, airwallex_card_id").order("created_at"),
    admin.auth.admin.listUsers({ perPage: 1000 }),
  ]);
  if (profiles.error) throw new Error(profiles.error.message);
  if (assignments.error) throw new Error(assignments.error.message);
  if (users.error) throw new Error(users.error.message);

  const authById = new Map(users.data.users.map((u) => [u.id, u]));
  return profiles.data.map((p) => {
    const authUser = authById.get(p.id);
    return {
      id: p.id,
      email: p.email,
      full_name: p.full_name,
      show_transactions: p.show_transactions,
      lastSignInAt: authUser?.last_sign_in_at ?? null,
      invited: !authUser?.last_sign_in_at,
      cardIds: assignments.data.filter((a) => a.user_id === p.id).map((a) => a.airwallex_card_id),
    };
  });
}

export async function listAllCards(): Promise<{ cards: AirwallexCard[]; error: string | null }> {
  try {
    return { cards: await getIssuing().listCards(), error: null };
  } catch (error) {
    return {
      cards: [],
      error: error instanceof Error ? error.message : "Airwallex no respondió.",
    };
  }
}

// --- Resumen de cada tarjeta para las tablas ---

export type CardOverview = {
  card: AirwallexCard;
  spend: SpendSummary[];
  limit: LimitUsage | null;
};

/** La moneda que más aparece en los movimientos; sirve para mostrar "0.00 MXN". */
export function mainCurrency(spend: SpendSummary[][]): string {
  const counts = new Map<string, number>();
  for (const s of spend.flat()) counts.set(s.currency, (counts.get(s.currency) ?? 0) + s.count);
  return [...counts].sort((a, b) => b[1] - a[1])[0]?.[0] ?? "MXN";
}

async function limitsFor(cards: AirwallexCard[]): Promise<Map<string, LimitUsage | null>> {
  const issuing = getIssuing();
  // Las cerradas ya no tienen límite que mostrar.
  const open = cards.filter((c) => c.card_status !== "CLOSED");
  const usages = await mapLimit(open, 4, async (card) => {
    try {
      return primaryLimit(await issuing.getCardLimits(card.card_id));
    } catch {
      return null;
    }
  });
  return new Map(open.map((card, i) => [card.card_id, usages[i]]));
}

/** Admin: todas las tarjetas, con el gasto del mes y el uso del límite. */
export async function getAllCardsOverview(month: string): Promise<{
  rows: CardOverview[];
  error: string | null;
}> {
  const { cards, error } = await listAllCards();
  if (error) return { rows: [], error };

  const issuing = getIssuing();
  const [transactions, limits] = await Promise.all([
    issuing.listTransactions(monthRange(month)).catch(() => [] as CardTransaction[]),
    limitsFor(cards),
  ]);
  const spend = spendByCard(transactions);
  return {
    rows: cards.map((card) => ({
      card,
      spend: spend.get(card.card_id) ?? [],
      limit: limits.get(card.card_id) ?? null,
    })),
    error: null,
  };
}

/** Cliente: sus tarjetas. Gasto y límite solo si el admin le permite verlos. */
export async function getMyCardsOverview(
  cardIds: string[],
  month: string,
  withSpend: boolean,
): Promise<(CardOverview | { card: null; id: string })[]> {
  const issuing = getIssuing();
  return mapLimit(cardIds, 3, async (id) => {
    try {
      const card = await issuing.getCard(id);
      if (!withSpend) return { card, spend: [], limit: null };
      const [txs, limits] = await Promise.all([
        issuing.listCardTransactions(id, monthRange(month)).catch(() => [] as CardTransaction[]),
        card.card_status === "CLOSED" ? null : issuing.getCardLimits(id).catch(() => null),
      ]);
      return { card, spend: summarizeSpend(txs), limit: primaryLimit(limits) };
    } catch {
      return { card: null, id };
    }
  });
}
