"use server";

import { requireAdminAction } from "@/lib/auth/require-admin";
import { buildMrpRows, reserveInventoryForProduction } from "@/lib/mappers/mrp";
import { consumeInventoryLotsFifo } from "@/lib/mappers/inventory-lots";
import { planProductionCompletionConsumption } from "@/lib/mappers/production";
import { getSchemaSetupErrorMessage } from "@/lib/mappers/supabase-errors";
import type { InventoryLot } from "@/lib/types/domain";
import { getVersionDetail } from "@/lib/supabase/queries/index";
import { INVENTORY_LOTS_TABLE } from "../table-names";
import { createSupabaseClient } from "../client";
import { syncInventorySummaryForComponent } from "./inventory-summary";
import { recordHistory, redirect, revalidatePath, requiredValue, stringifyHistoryValue } from "./shared";

export async function addProductionEntryAction(formData: FormData) {
  await requireAdminAction("/production");
  const supabase = await createSupabaseClient();
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
    if (!reservation || reservation.inventoryConsumed <= 0) {
      continue;
    }

    const lotsResult = await supabase
      .from(INVENTORY_LOTS_TABLE)
      .select("id,component_id,quantity_received,quantity_remaining,unit_cost,received_at,source,notes,created_at")
      .eq("component_id", component.component.id)
      .gt("quantity_remaining", 0)
      .order("received_at", { ascending: true })
      .order("created_at", { ascending: true });

    if (lotsResult.error) {
      await supabase.from("production_requirements").delete().eq("production_entry_id", result.data.id);
      await supabase.from("production_entries").delete().eq("id", result.data.id);
      throw new Error(lotsResult.error.message);
    }

    const consumption = consumeInventoryLotsFifo(
      (lotsResult.data ?? []) as InventoryLot[],
      reservation.inventoryConsumed
    );

    for (const lot of consumption.updatedLots) {
      const inventoryUpdate = await supabase
        .from(INVENTORY_LOTS_TABLE)
        .update({ quantity_remaining: lot.quantity_remaining })
        .eq("id", lot.id);

      if (inventoryUpdate.error) {
        await supabase.from("production_requirements").delete().eq("production_entry_id", result.data.id);
        await supabase.from("production_entries").delete().eq("id", result.data.id);
        throw new Error(inventoryUpdate.error.message);
      }
    }

    await syncInventorySummaryForComponent(supabase, component.component.id);
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
  await requireAdminAction("/production");
  const supabase = await createSupabaseClient();
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
      .select("id,quantity_available,purchase_price")
      .eq("component_id", requirement.component_id)
      .maybeSingle();

    if (inventoryResult.error) {
      throw new Error(inventoryResult.error.message);
    }

    const lotInsert = await supabase.from(INVENTORY_LOTS_TABLE).insert({
      component_id: requirement.component_id,
      quantity_received: requirement.inventory_consumed,
      quantity_remaining: requirement.inventory_consumed,
      unit_cost: Number(inventoryResult.data?.purchase_price ?? 0),
      received_at: new Date().toISOString(),
      source: "production_cancel",
      notes: `Returned from cancelled production entry ${productionEntryId}`
    });

    if (lotInsert.error) {
      throw new Error(lotInsert.error.message);
    }

    await syncInventorySummaryForComponent(supabase, requirement.component_id);
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
  await requireAdminAction("/production");
  const supabase = await createSupabaseClient();
  const productionEntryId = requiredValue(formData.get("production_entry_id"), "Production entry id");

  const [previous, requirementsResult] = await Promise.all([
    supabase
      .from("production_entries")
      .select("id,version_id,quantity,status,completed_at,created_at")
      .eq("id", productionEntryId)
      .maybeSingle(),
    supabase
      .from("production_requirements")
      .select("id,component_id,gross_requirement,inventory_consumed,net_requirement")
      .eq("production_entry_id", productionEntryId)
  ]);

  if (previous.error) {
    throw new Error(previous.error.message);
  }

  if (requirementsResult.error) {
    throw new Error(requirementsResult.error.message);
  }

  if (!previous.data) {
    throw new Error("Production entry not found.");
  }

  const openRequirements = (requirementsResult.data ?? []).filter((item) => item.net_requirement > 0);
  let completionRequirementUpdates: Array<{ id: string; inventory_consumed: number; net_requirement: number }> = [];

  if (openRequirements.length > 0) {
    const componentIds = Array.from(new Set(openRequirements.map((item) => item.component_id)));
    const [componentsResult, lotsResult] = await Promise.all([
      supabase.from("components").select("id,name").in("id", componentIds),
      supabase
        .from(INVENTORY_LOTS_TABLE)
        .select("id,component_id,quantity_received,quantity_remaining,unit_cost,received_at,source,notes,created_at")
        .in("component_id", componentIds)
        .gt("quantity_remaining", 0)
        .order("received_at", { ascending: true })
        .order("created_at", { ascending: true })
    ]);

    if (componentsResult.error) {
      throw new Error(componentsResult.error.message);
    }

    if (lotsResult.error) {
      throw new Error(lotsResult.error.message);
    }

    const componentNames = Object.fromEntries((componentsResult.data ?? []).map((item) => [item.id, item.name]));
    const lotsByComponent = (lotsResult.data ?? []).reduce<Record<string, InventoryLot[]>>((groups, lot) => {
      if (!groups[lot.component_id]) {
        groups[lot.component_id] = [];
      }
      groups[lot.component_id]?.push(lot as InventoryLot);
      return groups;
    }, {});

    const completionPlan = planProductionCompletionConsumption({
      requirements: openRequirements,
      lotsByComponent,
      componentNames
    });

    if (!completionPlan.ok) {
      redirect(`/production?error=${encodeURIComponent(completionPlan.message)}`);
    }

    completionRequirementUpdates = completionPlan.requirementUpdates;

    for (const lot of completionPlan.lotUpdates) {
      const inventoryUpdate = await supabase
        .from(INVENTORY_LOTS_TABLE)
        .update({ quantity_remaining: lot.quantity_remaining })
        .eq("id", lot.id);

      if (inventoryUpdate.error) {
        throw new Error(inventoryUpdate.error.message);
      }
    }

    for (const requirement of completionPlan.requirementUpdates) {
      const requirementUpdate = await supabase
        .from("production_requirements")
        .update({
          inventory_consumed: requirement.inventory_consumed,
          net_requirement: requirement.net_requirement
        })
        .eq("id", requirement.id);

      if (requirementUpdate.error) {
        throw new Error(requirementUpdate.error.message);
      }
    }

    for (const componentId of completionPlan.affectedComponentIds) {
      await syncInventorySummaryForComponent(supabase, componentId);
    }
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
    summary:
      completionRequirementUpdates.length > 0
        ? `Marked production entry ${productionEntryId} as completed and consumed remaining net requirements from inventory`
        : `Marked production entry ${productionEntryId} as completed`,
    old_value: stringifyHistoryValue(previous.data),
    new_value: stringifyHistoryValue({
      ...previous.data,
      status: "completed",
      completed_at: completedAt,
      completed_requirement_updates: completionRequirementUpdates
    })
  });

  revalidatePath("/inventory");
  revalidatePath("/components");
  revalidatePath("/production");
  revalidatePath("/purchasing");
  revalidatePath("/history");
  redirect("/production");
}
