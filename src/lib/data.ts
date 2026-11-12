import "server-only";
import { getIssuing, type AirwallexCard } from "@/lib/airwallex";
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
