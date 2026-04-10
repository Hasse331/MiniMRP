import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { getSupabaseBrowserEnv } from "./env";

export async function createSupabaseServerClient() {
  const { url, publishableKey } = getSupabaseBrowserEnv();

  if (!url || !publishableKey) {
    throw new Error("Supabase server environment variables are missing.");
  }

  const cookieStore = await cookies();

  return createServerClient(url, publishableKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          for (const cookie of cookiesToSet) {
            cookieStore.set(cookie.name, cookie.value, cookie.options);
          }
        } catch {
          // Server components cannot always write cookies directly.
        }
      }
    }
  });
}
