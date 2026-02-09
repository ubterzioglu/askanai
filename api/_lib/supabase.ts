import { createClient } from "@supabase/supabase-js";
import { mustGetEnv } from "./env";

let _admin: ReturnType<typeof createClient> | null = null;

export function supabaseAdmin() {
  if (_admin) return _admin;
  const url = mustGetEnv("SUPABASE_URL");
  const serviceKey = mustGetEnv("SUPABASE_SERVICE_ROLE_KEY");
  _admin = createClient(url, serviceKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
  return _admin;
}

export async function getUserIdFromToken(token: string): Promise<string | null> {
  const sb = supabaseAdmin();
  const { data, error } = await sb.auth.getUser(token);
  if (error || !data?.user?.id) return null;
  return data.user.id;
}

