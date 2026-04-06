import { unstable_noStore as noStore } from "next/cache";
import type { AppSettings } from "@/lib/types/domain";
import { createSupabaseClient } from "../client";

export async function getAppSettings(): Promise<{ item: AppSettings | null; error: string | null }> {
  noStore();
  const supabase = createSupabaseClient();
  const result = await supabase
    .from("app_settings")
    .select("id,default_safety_stock")
    .eq("id", true)
    .maybeSingle<AppSettings>();

  if (result.error) {
    return { item: null, error: result.error.message };
  }

  return {
    item: result.data ?? { id: true, default_safety_stock: 25 },
    error: null
  };
}
