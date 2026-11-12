"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { requireAdmin } from "@/lib/auth";
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

// Asignar una tarjeta que ya tenía otro cliente la cambia de dueño.
export async function assignCard(formData: FormData) {
  await requireAdmin();
  const userId = String(formData.get("user_id") ?? "");
  const cardId = String(formData.get("card_id") ?? "");
  if (!userId || !cardId) return;

  const { error } = await createAdminClient()
    .from("card_assignments")
    .upsert({ user_id: userId, airwallex_card_id: cardId }, { onConflict: "airwallex_card_id" });
  if (error) throw new Error(`No se pudo asignar la tarjeta: ${error.message}`);
  revalidatePath("/admin");
}

export async function unassignCard(formData: FormData) {
  await requireAdmin();
  const cardId = String(formData.get("card_id") ?? "");
  if (!cardId) return;

  const { error } = await createAdminClient()
    .from("card_assignments")
    .delete()
    .eq("airwallex_card_id", cardId);
  if (error) throw new Error(`No se pudo quitar la tarjeta: ${error.message}`);
  revalidatePath("/admin");
}

export async function setShowTransactions(formData: FormData) {
  await requireAdmin();
  const userId = String(formData.get("user_id") ?? "");
  const show = formData.get("show") === "true";
  if (!userId) return;

  const { error } = await createAdminClient()
    .from("profiles")
    .update({ show_transactions: show })
    .eq("id", userId);
  if (error) throw new Error(`No se pudo cambiar el ajuste: ${error.message}`);
  revalidatePath("/admin");
}
