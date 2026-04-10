import { createClient } from "@supabase/supabase-js";
import { getSupabaseAdminEnv } from "./env";

export function createSupabaseAdminClient() {
  const { url, secretKey } = getSupabaseAdminEnv();

  if (!url || !secretKey) {
    throw new Error("Supabase admin environment variables are missing.");
  }

  return createClient(url, secretKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  });
}
