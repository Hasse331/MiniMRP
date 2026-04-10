import { unstable_noStore as noStore } from "next/cache";
import type { HistoryEvent } from "@/lib/types/domain";
import { createSupabaseAdminClient } from "../admin-client";
import { HISTORY_EVENTS_TABLE, PRIVATE_SCHEMA } from "../table-names";
import { safeSelect } from "./shared";

export async function getHistoryEntries(): Promise<{ items: HistoryEvent[]; error: string | null }> {
  noStore();
  const supabase = createSupabaseAdminClient();
  const result = await safeSelect<HistoryEvent>(
    supabase
      .schema(PRIVATE_SCHEMA)
      .from(HISTORY_EVENTS_TABLE)
      .select("id,entity_type,entity_id,action_type,summary,old_value,new_value,created_at")
      .order("created_at", { ascending: false })
  );

  return {
    items: result.data,
    error: result.error
  };
}
