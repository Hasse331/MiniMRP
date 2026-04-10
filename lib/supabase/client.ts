import { createSupabaseServerClient } from "./server-client";

export async function createSupabaseClient() {
  return createSupabaseServerClient();
}
