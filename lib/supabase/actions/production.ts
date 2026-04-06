"use server";

import { buildMrpRows, reserveInventoryForProduction } from "@/lib/mappers/mrp";
import { getSchemaSetupErrorMessage } from "@/lib/mappers/supabase-errors";
import { getVersionDetail } from "@/lib/supabase/queries/index";
import { createSupabaseClient } from "../client";
import { recordHistory, redirect, revalidatePath, requiredValue, stringifyHistoryValue } from "./shared";

export async function addProductionEntryAction(formData: FormData) {
  const supabase = createSupabaseClient();
  const versionId = requiredValue(formData.get("version_id"), "Version id");
  const quantity = Math.max(Number(requiredValue(formData.get("quantity"), "Quantity")), 1);
  const versionDetail = await getVersionDetail(versionId);

  if (versionDetail.error) {
    throw new Error(versionDetail.error);
  }

  if (!versionDetail.item) {
    throw new Error("Version not found.");
  }

  const mrpRows = buildMrpRows(versionDetail.item.components, quantity);
  const reservedRequirements = reserveInventoryForProduction(mrpRows);

  const result = await supabase
    .from("production_entries")
    .insert({
      version_id: versionId,
      quantity
    })
    .select("id,version_id,quantity,created_at")
    .single();

  if (result.error || !result.data) {
    throw new Error(result.error?.message ?? "Could not add production entry.");
  }

  if (reservedRequirements.length > 0) {
    const requirementsInsert = await supabase.from("production_requirements").insert(
      reservedRequirements.map((row) => ({
        production_entry_id: result.data.id,
        component_id: row.componentId,
        gross_requirement: row.grossRequirement,
        inventory_consumed: row.inventoryConsumed,
        net_requirement: row.netRequirement
      }))
    );

    if (requirementsInsert.error) {
      await supabase.from("production_entries").delete().eq("id", result.data.id);
      throw new Error(getSchemaSetupErrorMessage(requirementsInsert.error.message, "production_requirements"));
    }
  }

  for (const component of versionDetail.item.components) {
    const reservation = reservedRequirements.find((row) => row.componentId === component.component.id);
    if (!component.inventory?.id || !reservation) {
      continue;
    }

    const inventoryUpdate = await supabase
      .from("inventory")
      .update({ quantity_available: reservation.remainingInventory })
      .eq("id", component.inventory.id);

    if (inventoryUpdate.error) {
      await supabase.from("production_requirements").delete().eq("production_entry_id", result.data.id);
      await supabase.from("production_entries").delete().eq("id", result.data.id);
      throw new Error(inventoryUpdate.error.message);
    }
  }

  await recordHistory({
    entity_type: "production",
    entity_id: result.data.id,
    action_type: "create",
    summary: `Added version ${versionId} to production with quantity ${quantity} and consumed available inventory`,
    new_value: stringifyHistoryValue({
      ...result.data,
      requirements: reservedRequirements
    })
  });

  revalidatePath(`/versions/${versionId}`);
  revalidatePath("/inventory");
  revalidatePath("/components");
  revalidatePath("/production");
  revalidatePath("/purchasing");
  revalidatePath("/history");
  redirect("/production");
}
