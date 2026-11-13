"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { requireAdmin } from "@/lib/auth";
import { parseAssignment, parseRemoval } from "@/lib/cards/bulk";
import { createAdminClient } from "@/lib/supabase/admin";

export type LinkState = { error: string | null; link: string | null; email: string | null };

async function siteOrigin(): Promise<string> {
  const h = await headers();
  const origin = h.get("origin");
  if (origin) return origin;
  const proto = h.get("x-forwarded-proto") ?? "https";
  return `${proto}://${h.get("x-forwarded-host") ?? h.get("host")}`;
}

function confirmLink(origin: string, tokenHash: string, type: "invite" | "recovery") {
  const url = new URL("/auth/confirm", origin);
  url.searchParams.set("token_hash", tokenHash);
  url.searchParams.set("type", type);
  return url.toString();
}

function readEmail(formData: FormData) {
  return String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
}

// Crea al cliente (si no existe) y devuelve un enlace para que cree su contraseña.
// No manda correo: el admin comparte el enlace por donde quiera.
export async function inviteClient(_prev: LinkState, formData: FormData): Promise<LinkState> {
  await requireAdmin();
  const email = readEmail(formData);
  const fullName = String(formData.get("full_name") ?? "").trim();
  if (!email.includes("@")) return { error: "Escribe un correo válido.", link: null, email: null };

  const admin = createAdminClient();
  let type: "invite" | "recovery" = "invite";
  let result = await admin.auth.admin.generateLink({
    type: "invite",
    email,
    options: { data: { full_name: fullName } },
  });

  // Si ya tiene cuenta, el enlace sirve para cambiar su contraseña.
  if (result.error && /already|exists|registered/i.test(`${result.error.code} ${result.error.message}`)) {
    type = "recovery";
    result = await admin.auth.admin.generateLink({ type: "recovery", email });
  }
  if (result.error || !result.data.properties) {
    return {
      error: `Supabase no pudo crear el enlace: ${result.error?.message ?? "sin detalle"}`,
      link: null,
      email: null,
    };
  }

  const userId = result.data.user.id;
  const profile = await admin
    .from("profiles")
    .upsert({ id: userId, email, ...(fullName ? { full_name: fullName } : {}) }, { onConflict: "id" });
  if (profile.error) {
    return { error: `No se pudo guardar el cliente: ${profile.error.message}`, link: null, email: null };
  }

  revalidatePath("/admin");
  return {
    error: null,
    link: confirmLink(await siteOrigin(), result.data.properties.hashed_token, type),
    email,
  };
}

export async function createPasswordLink(_prev: LinkState, formData: FormData): Promise<LinkState> {
  await requireAdmin();
  const email = readEmail(formData);
  const admin = createAdminClient();
  const { data, error } = await admin.auth.admin.generateLink({ type: "recovery", email });
  if (error || !data.properties) {
    return { error: `Supabase no pudo crear el enlace: ${error?.message ?? "sin detalle"}`, link: null, email: null };
  }
  return {
    error: null,
    link: confirmLink(await siteOrigin(), data.properties.hashed_token, "recovery"),
    email,
  };
}

export type AssignState = { error: string | null; assigned: number };

const MIGRATION_0003 =
  "Para que una tarjeta la vean varios clientes corre supabase/migrations/0003_shared_cards_and_card_details.sql en Supabase → SQL Editor.";

// Le da acceso a un cliente a todas las tarjetas marcadas.
// Los clientes que ya las veían las siguen viendo.
export async function assignCards(_prev: AssignState, formData: FormData): Promise<AssignState> {
  await requireAdmin();
  const parsed = parseAssignment(formData);
  if ("error" in parsed) return { error: parsed.error, assigned: 0 };

  const rows = parsed.cardIds.map((cardId) => ({ user_id: parsed.userId, airwallex_card_id: cardId }));
  const { error } = await createAdminClient()
    .from("card_assignments")
    .upsert(rows, { onConflict: "user_id,airwallex_card_id", ignoreDuplicates: true });
  if (error) {
    // Sin la migración 0003 no existe la regla (cliente, tarjeta) que usa el upsert.
    const missingMigration = /on conflict|airwallex_card_id_key/i.test(error.message);
    return {
      error: missingMigration ? MIGRATION_0003 : `No se pudieron asignar las tarjetas: ${error.message}`,
      assigned: 0,
    };
  }

  revalidatePath("/admin");
  return { error: null, assigned: rows.length };
}

// Quita las tarjetas marcadas: solo al cliente elegido o, si no se eligió, a todos.
export async function unassignCards(_prev: AssignState, formData: FormData): Promise<AssignState> {
  await requireAdmin();
  const parsed = parseRemoval(formData);
  if ("error" in parsed) return { error: parsed.error, assigned: 0 };

  let query = createAdminClient().from("card_assignments").delete().in("airwallex_card_id", parsed.cardIds);
  if (parsed.userId) query = query.eq("user_id", parsed.userId);
  const { error } = await query;
  if (error) return { error: `No se pudieron quitar las tarjetas: ${error.message}`, assigned: 0 };

  revalidatePath("/admin");
  return { error: null, assigned: parsed.cardIds.length };
}

// Le quita una tarjeta a un cliente; los demás que la ven la siguen viendo.
export async function unassignCard(formData: FormData) {
  await requireAdmin();
  const cardId = String(formData.get("card_id") ?? "");
  const userId = String(formData.get("user_id") ?? "");
  if (!cardId || !userId) return;

  const { error } = await createAdminClient()
    .from("card_assignments")
    .delete()
    .eq("airwallex_card_id", cardId)
    .eq("user_id", userId);
  if (error) throw new Error(`No se pudo quitar la tarjeta: ${error.message}`);
  revalidatePath("/admin");
}

export type PermissionState = { error: string | null };

const PERMISSION_COLUMN = {
  balance: "show_balance",
  transactions: "show_transactions",
  card_details: "show_card_details",
} as const;

const readPermission = (value: FormDataEntryValue | null): keyof typeof PERMISSION_COLUMN =>
  value === "balance" || value === "card_details" ? value : "transactions";

// Prende o apaga lo que un cliente puede ver: su saldo, sus movimientos o los datos de la tarjeta.
export async function setPermission(_prev: PermissionState, formData: FormData): Promise<PermissionState> {
  await requireAdmin();
  const userId = String(formData.get("user_id") ?? "");
  const which = readPermission(formData.get("permission"));
  const value = formData.get("value") === "true";
  if (!userId) return { error: "Falta el cliente." };

  const { error } = await createAdminClient()
    .from("profiles")
    .update({ [PERMISSION_COLUMN[which]]: value })
    .eq("id", userId);
  if (error) {
    const migration = /show_card_details/.test(error.message)
      ? "0003_shared_cards_and_card_details.sql"
      : /show_balance/.test(error.message)
        ? "0002_show_balance.sql"
        : null;
    return {
      error: migration
        ? `Para usar este permiso corre supabase/migrations/${migration} en Supabase → SQL Editor.`
        : `No se pudo cambiar el ajuste: ${error.message}`,
    };
  }
  revalidatePath("/admin");
  return { error: null };
}
