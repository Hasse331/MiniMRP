"use server";

import type { SupabaseClient } from "@supabase/supabase-js";
import { calculateInventorySummaryFromLots } from "@/lib/mappers/inventory-lots";
import type { InventoryLot } from "@/lib/types/domain";
import { INVENTORY_LOTS_TABLE } from "../table-names";

export async function syncInventorySummaryForComponent(
  supabase: SupabaseClient,
  componentId: string
) {
  const lotsResult = await supabase
    .from(INVENTORY_LOTS_TABLE)
    .select("id,component_id,quantity_received,quantity_remaining,unit_cost,received_at,source,notes,created_at")
    .eq("component_id", componentId)
    .order("received_at", { ascending: true })
    .order("created_at", { ascending: true });

  if (lotsResult.error) {
    throw new Error(lotsResult.error.message);
  }

  const summary = calculateInventorySummaryFromLots((lotsResult.data ?? []) as InventoryLot[]);
  const summaryResult = await supabase.from("inventory").upsert(
    {
      component_id: componentId,
      quantity_available: summary.quantity_available,
      purchase_price: summary.purchase_price
    },
    { onConflict: "component_id" }
  );

  if (summaryResult.error) {
    throw new Error(summaryResult.error.message);
  }

  return summary;
}

export async function syncInventorySummariesForComponents(
  supabase: SupabaseClient,
  componentIds: string[]
) {
  const uniqueComponentIds = Array.from(new Set(componentIds.filter(Boolean)));
  for (const componentId of uniqueComponentIds) {
    await syncInventorySummaryForComponent(supabase, componentId);
  }
}
