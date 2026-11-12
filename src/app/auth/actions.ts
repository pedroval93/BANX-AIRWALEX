"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type FormState = { error: string | null };

export async function login(_prev: FormState, formData: FormData): Promise<FormState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  if (!email || !password) return { error: "Escribe tu correo y tu contraseña." };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { error: "El correo o la contraseña no coinciden." };

  redirect("/");
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

const LINK_TYPES = ["invite", "recovery"] as const;
type LinkType = (typeof LINK_TYPES)[number];

// Se usa desde el enlace de invitación o de cambio de contraseña.
// Verifica el enlace y guarda la contraseña en un solo paso (con un botón, para que
// las vistas previas de WhatsApp o del correo no gasten el enlace).
export async function setPasswordFromLink(_prev: FormState, formData: FormData): Promise<FormState> {
  const tokenHash = String(formData.get("token_hash") ?? "");
  const type = String(formData.get("type") ?? "") as LinkType;
  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirm") ?? "");

  if (!tokenHash || !LINK_TYPES.includes(type)) {
    return { error: "Este enlace no es válido. Pide uno nuevo a quien te invitó." };
  }
  if (password.length < 8) return { error: "La contraseña debe tener al menos 8 caracteres." };
  if (password !== confirm) return { error: "Las contraseñas no coinciden." };

  const supabase = await createClient();
  const { error: verifyError } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });
  if (verifyError) {
    return { error: "Este enlace ya se usó o caducó. Pide uno nuevo a quien te invitó." };
  }

  const { error } = await supabase.auth.updateUser({ password });
  if (error) return { error: `No se pudo guardar la contraseña: ${error.message}` };

  redirect("/");
}
