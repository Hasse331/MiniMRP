import { unstable_noStore as noStore } from "next/cache";
import type { HistoryEvent } from "@/lib/types/domain";
import { createSupabaseClient } from "../client";
import { safeSelect } from "./shared";

export async function getHistoryEntries(): Promise<{ items: HistoryEvent[]; error: string | null }> {
  noStore();
  const supabase = createSupabaseClient();
  const result = await safeSelect<HistoryEvent>(
    supabase
      .from("history_events")
      .select("id,entity_type,entity_id,action_type,summary,old_value,new_value,created_at")
      .order("created_at", { ascending: false })
  );

  return {
    items: result.data,
    error: result.error
  };
}
