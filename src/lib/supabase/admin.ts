import "server-only";
import { createClient } from "@supabase/supabase-js";
import { supabaseSecretKey, supabaseUrl } from "@/lib/env";

// Cliente con la clave secreta: salta RLS. Úsalo solo en el servidor y
// solo después de comprobar quién es el usuario y qué puede hacer.
export function createAdminClient() {
  return createClient(supabaseUrl(), supabaseSecretKey(), {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
