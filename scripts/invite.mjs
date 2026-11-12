// Crea un enlace de invitación sin entrar a la app. Útil para la primera cuenta (el admin).
//
// Uso:
//   node --env-file=.env.local scripts/invite.mjs tu@correo.com https://tu-app.vercel.app
//
// Si el correo ya tiene cuenta, crea un enlace para cambiar la contraseña.
import { createClient } from "@supabase/supabase-js";

const [email, origin = "http://localhost:3000"] = process.argv.slice(2);
if (!email) {
  console.error("Falta el correo. Uso: node --env-file=.env.local scripts/invite.mjs correo [url-de-la-app]");
  process.exit(1);
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const secret = process.env.SUPABASE_SECRET_KEY;
if (!url || !secret) {
  console.error("Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SECRET_KEY en .env.local");
  process.exit(1);
}

const admin = createClient(url, secret, { auth: { persistSession: false, autoRefreshToken: false } });

let type = "invite";
let result = await admin.auth.admin.generateLink({ type, email });
if (result.error && /already|exists|registered/i.test(`${result.error.code} ${result.error.message}`)) {
  type = "recovery";
  result = await admin.auth.admin.generateLink({ type, email });
}
if (result.error) {
  console.error("Supabase no pudo crear el enlace:", result.error.message);
  process.exit(1);
}

const link = new URL("/auth/confirm", origin);
link.searchParams.set("token_hash", result.data.properties.hashed_token);
link.searchParams.set("type", type);
console.log(`\nAbre este enlace para ${type === "invite" ? "crear" : "cambiar"} la contraseña de ${email}:\n\n${link}\n`);
