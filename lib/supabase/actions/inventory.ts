"use server";

import { consumeInventoryLotsFifo } from "@/lib/mappers/inventory-lots";
import type { InventoryLot } from "@/lib/types/domain";
import { INVENTORY_LOTS_TABLE } from "../table-names";
import { createSupabaseClient } from "../client";
import { syncInventorySummaryForComponent } from "./inventory-summary";
import { recordHistory, optionalValue, redirect, revalidatePath, requiredValue, stringifyHistoryValue } from "./shared";

export async function addInventoryAction(formData: FormData) {
  const supabase = await createSupabaseClient();
  const componentId = requiredValue(formData.get("component_id"), "Component id");
  const quantity = Number(requiredValue(formData.get("quantity_received"), "Quantity"));
  const purchasePrice = Number(requiredValue(formData.get("unit_cost"), "Unit cost"));
  const receivedAt = optionalValue(formData.get("received_at")) ?? new Date().toISOString();
  const source = optionalValue(formData.get("source"));
  const notes = optionalValue(formData.get("notes"));

  const result = await supabase.from(INVENTORY_LOTS_TABLE).insert({
    component_id: componentId,
    quantity_received: quantity,
    quantity_remaining: quantity,
    unit_cost: purchasePrice,
    received_at: receivedAt,
    source,
    notes
  });

  if (result.error) {
    throw new Error(result.error.message);
  }

  await syncInventorySummaryForComponent(supabase, componentId);

  await recordHistory({
    entity_type: "inventory_lot",
    entity_id: componentId,
    action_type: "create",
    summary: `Added inventory lot for component ${componentId} with quantity ${quantity}`,
    new_value: stringifyHistoryValue({
      component_id: componentId,
      quantity_received: quantity,
      quantity_remaining: quantity,
      unit_cost: purchasePrice,
      received_at: receivedAt,
      source,
      notes
    })
  });

  revalidatePath("/inventory");
  revalidatePath("/components");
  revalidatePath(`/components/${componentId}`);
  redirect("/inventory");
}

export async function adjustInventoryDeltaAction(formData: FormData) {
  const supabase = await createSupabaseClient();
  const componentId = requiredValue(formData.get("component_id"), "Component id");
  const mode = requiredValue(formData.get("mode"), "Mode") as "add" | "remove";
  const amount = Number(requiredValue(formData.get("amount"), "Amount"));
  const source = optionalValue(formData.get("source"));
  const notes = optionalValue(formData.get("notes"));
  const returnTo = optionalValue(formData.get("returnTo")) ?? "/inventory";

  if (mode === "add") {
    const unitCost = Number(requiredValue(formData.get("unit_cost"), "Unit cost"));
    const receivedAt = optionalValue(formData.get("received_at")) ?? new Date().toISOString();
    const insertResult = await supabase.from(INVENTORY_LOTS_TABLE).insert({
      component_id: componentId,
      quantity_received: amount,
      quantity_remaining: amount,
      unit_cost: unitCost,
      received_at: receivedAt,
      source,
      notes
    });

    if (insertResult.error) {
      throw new Error(insertResult.error.message);
    }

    await syncInventorySummaryForComponent(supabase, componentId);

    await recordHistory({
      entity_type: "inventory_lot",
      entity_id: componentId,
      action_type: "add",
      summary: `Added ${amount} to component ${componentId} as a new inventory lot`,
      new_value: stringifyHistoryValue({
        component_id: componentId,
        quantity_received: amount,
        quantity_remaining: amount,
        unit_cost: unitCost,
        received_at: receivedAt,
        source,
        notes
      })
    });

    revalidatePath("/components");
    revalidatePath("/inventory");
    revalidatePath("/purchasing");
    revalidatePath(`/components/${componentId}`);
    redirect(returnTo);
  }

  const lotsResult = await supabase
    .from(INVENTORY_LOTS_TABLE)
    .select("id,component_id,quantity_received,quantity_remaining,unit_cost,received_at,source,notes,created_at")
    .eq("component_id", componentId)
    .gt("quantity_remaining", 0)
    .order("received_at", { ascending: true })
    .order("created_at", { ascending: true });

  if (lotsResult.error) {
    throw new Error(lotsResult.error.message);
  }

  const consumption = consumeInventoryLotsFifo((lotsResult.data ?? []) as InventoryLot[], amount);
  for (const lot of consumption.updatedLots) {
    const updateResult = await supabase
      .from(INVENTORY_LOTS_TABLE)
      .update({ quantity_remaining: lot.quantity_remaining })
      .eq("id", lot.id);

    if (updateResult.error) {
      throw new Error(updateResult.error.message);
    }
  }

  await syncInventorySummaryForComponent(supabase, componentId);

  await recordHistory({
    entity_type: "inventory_lot",
    entity_id: componentId,
    action_type: "remove",
    summary: `Removed ${consumption.inventoryConsumed} from component ${componentId} using FIFO${consumption.remainingRequirement > 0 ? `, shortage ${consumption.remainingRequirement}` : ""}`,
    new_value: stringifyHistoryValue({
      component_id: componentId,
      requested_amount: amount,
      inventory_consumed: consumption.inventoryConsumed,
      remaining_requirement: consumption.remainingRequirement,
      source,
      notes
    })
  });

  revalidatePath("/components");
  revalidatePath("/inventory");
  revalidatePath("/purchasing");
  revalidatePath(`/components/${componentId}`);
  redirect(returnTo);
}

export async function updateInventoryLotAction(formData: FormData) {
  const supabase = await createSupabaseClient();
  const id = requiredValue(formData.get("id"), "Inventory lot id");
  const componentId = requiredValue(formData.get("component_id"), "Component id");
  const quantityReceived = Number(requiredValue(formData.get("quantity_received"), "Quantity received"));
  const quantityRemaining = Number(requiredValue(formData.get("quantity_remaining"), "Quantity remaining"));
  const unitCost = Number(requiredValue(formData.get("unit_cost"), "Unit cost"));
  const receivedAt = requiredValue(formData.get("received_at"), "Received at");
  const source = optionalValue(formData.get("source"));
  const notes = optionalValue(formData.get("notes"));
  const returnTo = optionalValue(formData.get("returnTo")) ?? `/components/${componentId}`;

  if (quantityReceived <= 0) {
    throw new Error("Quantity received must be greater than zero.");
  }

  if (quantityRemaining < 0 || quantityRemaining > quantityReceived) {
    throw new Error("Quantity remaining must be between zero and quantity received.");
  }

  if (unitCost < 0) {
    throw new Error("Unit cost cannot be negative.");
  }

  const previous = await supabase
    .from(INVENTORY_LOTS_TABLE)
    .select("id,component_id,quantity_received,quantity_remaining,unit_cost,received_at,source,notes,created_at")
    .eq("id", id)
    .maybeSingle();

  if (previous.error) {
    throw new Error(previous.error.message);
  }

  const result = await supabase
    .from(INVENTORY_LOTS_TABLE)
    .update({
      quantity_received: quantityReceived,
      quantity_remaining: quantityRemaining,
      unit_cost: unitCost,
      received_at: receivedAt,
      source,
      notes
    })
    .eq("id", id);

  if (result.error) {
    throw new Error(result.error.message);
  }

  await syncInventorySummaryForComponent(supabase, componentId);

  await recordHistory({
    entity_type: "inventory_lot",
    entity_id: id,
    action_type: "update",
    summary: `Updated inventory lot ${id}`,
    old_value: stringifyHistoryValue(previous.data),
    new_value: stringifyHistoryValue({
      id,
      component_id: componentId,
      quantity_received: quantityReceived,
      quantity_remaining: quantityRemaining,
      unit_cost: unitCost,
      received_at: receivedAt,
      source,
      notes
    })
  });

  revalidatePath("/inventory");
  revalidatePath("/components");
  revalidatePath("/purchasing");
  revalidatePath(`/components/${componentId}`);
  redirect(returnTo);
}

export async function deleteInventoryLotAction(formData: FormData) {
  const supabase = await createSupabaseClient();
  const id = requiredValue(formData.get("id"), "Inventory lot id");
  const componentId = requiredValue(formData.get("component_id"), "Component id");
  const returnTo = optionalValue(formData.get("returnTo")) ?? `/components/${componentId}`;

  const previous = await supabase
    .from(INVENTORY_LOTS_TABLE)
    .select("id,component_id,quantity_received,quantity_remaining,unit_cost,received_at,source,notes,created_at")
    .eq("id", id)
    .maybeSingle();

  if (previous.error) {
    throw new Error(previous.error.message);
  }

  const result = await supabase.from(INVENTORY_LOTS_TABLE).delete().eq("id", id);
  if (result.error) {
    throw new Error(result.error.message);
  }

  await syncInventorySummaryForComponent(supabase, componentId);

  await recordHistory({
    entity_type: "inventory_lot",
    entity_id: id,
    action_type: "delete",
    summary: `Deleted inventory lot ${id}`,
    old_value: stringifyHistoryValue(previous.data)
  });

  revalidatePath("/inventory");
  revalidatePath("/components");
  revalidatePath("/purchasing");
  revalidatePath(`/components/${componentId}`);
  redirect(returnTo);
}
