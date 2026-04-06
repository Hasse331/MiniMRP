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
      quantity,
      status: "under_production"
    })
    .select("id,version_id,quantity,status,completed_at,created_at")
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

export async function cancelProductionEntryAction(formData: FormData) {
  const supabase = createSupabaseClient();
  const productionEntryId = requiredValue(formData.get("production_entry_id"), "Production entry id");

  const [entryResult, requirementsResult] = await Promise.all([
    supabase
      .from("production_entries")
      .select("id,version_id,quantity,status,completed_at,created_at")
      .eq("id", productionEntryId)
      .maybeSingle(),
    supabase
      .from("production_requirements")
      .select("id,production_entry_id,component_id,gross_requirement,inventory_consumed,net_requirement,created_at")
      .eq("production_entry_id", productionEntryId)
  ]);

  if (entryResult.error) {
    throw new Error(entryResult.error.message);
  }

  if (requirementsResult.error) {
    throw new Error(requirementsResult.error.message);
  }

  if (!entryResult.data) {
    throw new Error("Production entry not found.");
  }

  for (const requirement of requirementsResult.data ?? []) {
    if (requirement.inventory_consumed <= 0) {
      continue;
    }

    const inventoryResult = await supabase
      .from("inventory")
      .select("id,quantity_available")
      .eq("component_id", requirement.component_id)
      .maybeSingle();

    if (inventoryResult.error) {
      throw new Error(inventoryResult.error.message);
    }

    if (inventoryResult.data) {
      const updateResult = await supabase
        .from("inventory")
        .update({
          quantity_available: Number(inventoryResult.data.quantity_available) + requirement.inventory_consumed
        })
        .eq("id", inventoryResult.data.id);

      if (updateResult.error) {
        throw new Error(updateResult.error.message);
      }
    } else {
      const insertResult = await supabase.from("inventory").insert({
        component_id: requirement.component_id,
        quantity_available: requirement.inventory_consumed
      });

      if (insertResult.error) {
        throw new Error(insertResult.error.message);
      }
    }
  }

  const deleteResult = await supabase.from("production_entries").delete().eq("id", productionEntryId);
  if (deleteResult.error) {
    throw new Error(deleteResult.error.message);
  }

  await recordHistory({
    entity_type: "production",
    entity_id: productionEntryId,
    action_type: "cancel",
    summary: `Cancelled production entry ${productionEntryId} and returned reserved inventory`,
    old_value: stringifyHistoryValue({
      entry: entryResult.data,
      requirements: requirementsResult.data ?? []
    })
  });

  revalidatePath("/inventory");
  revalidatePath("/components");
  revalidatePath("/production");
  revalidatePath("/purchasing");
  revalidatePath("/history");
  redirect("/production");
}

export async function completeProductionEntryAction(formData: FormData) {
  const supabase = createSupabaseClient();
  const productionEntryId = requiredValue(formData.get("production_entry_id"), "Production entry id");

  const previous = await supabase
    .from("production_entries")
    .select("id,version_id,quantity,status,completed_at,created_at")
    .eq("id", productionEntryId)
    .maybeSingle();

  if (previous.error) {
    throw new Error(previous.error.message);
  }

  if (!previous.data) {
    throw new Error("Production entry not found.");
  }

  const completedAt = new Date().toISOString();
  const result = await supabase
    .from("production_entries")
    .update({
      status: "completed",
      completed_at: completedAt
    })
    .eq("id", productionEntryId);

  if (result.error) {
    throw new Error(result.error.message);
  }

  await recordHistory({
    entity_type: "production",
    entity_id: productionEntryId,
    action_type: "complete",
    summary: `Marked production entry ${productionEntryId} as completed`,
    old_value: stringifyHistoryValue(previous.data),
    new_value: stringifyHistoryValue({
      ...previous.data,
      status: "completed",
      completed_at: completedAt
    })
  });

  revalidatePath("/production");
  revalidatePath("/purchasing");
  revalidatePath("/history");
  redirect("/production");
}
