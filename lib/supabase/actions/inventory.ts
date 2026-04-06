"use server";

import { applyInventoryAdjustment } from "@/lib/mappers/inventory";
import { createSupabaseClient } from "../client";
import { recordHistory, optionalValue, redirect, revalidatePath, requiredValue, stringifyHistoryValue } from "./shared";

export async function addInventoryAction(formData: FormData) {
  const supabase = createSupabaseClient();
  const componentId = requiredValue(formData.get("component_id"), "Component id");
  const quantity = Number(requiredValue(formData.get("quantity_available"), "Quantity"));
  const purchasePrice = optionalValue(formData.get("purchase_price"));

  const result = await supabase.from("inventory").insert({
    component_id: componentId,
    quantity_available: quantity,
    purchase_price: purchasePrice ? Number(purchasePrice) : null
  });

  if (result.error) {
    throw new Error(result.error.message);
  }

  await recordHistory({
    entity_type: "inventory",
    entity_id: componentId,
    action_type: "create",
    summary: `Added inventory for component ${componentId} with quantity ${quantity}`,
    new_value: stringifyHistoryValue({
      component_id: componentId,
      quantity_available: quantity,
      purchase_price: purchasePrice ? Number(purchasePrice) : null
    })
  });

  revalidatePath("/inventory");
  revalidatePath("/components");
  redirect("/inventory");
}

export async function adjustInventoryDeltaAction(formData: FormData) {
  const supabase = createSupabaseClient();
  const componentId = requiredValue(formData.get("component_id"), "Component id");
  const mode = requiredValue(formData.get("mode"), "Mode") as "add" | "remove";
  const amount = Number(requiredValue(formData.get("amount"), "Amount"));
  const currentQuantity = Number(requiredValue(formData.get("current_quantity"), "Current quantity"));
  const nextQuantity = applyInventoryAdjustment(currentQuantity, mode, amount);

  const result = await supabase.from("inventory").upsert(
    {
      component_id: componentId,
      quantity_available: nextQuantity
    },
    { onConflict: "component_id" }
  );

  if (result.error) {
    throw new Error(result.error.message);
  }

  await recordHistory({
    entity_type: "inventory",
    entity_id: componentId,
    action_type: "adjust",
    summary: `${mode === "add" ? "Added" : "Removed"} ${amount} for component ${componentId}, new quantity ${nextQuantity}`,
    old_value: stringifyHistoryValue({ component_id: componentId, quantity_available: currentQuantity }),
    new_value: stringifyHistoryValue({ component_id: componentId, quantity_available: nextQuantity })
  });

  revalidatePath("/components");
  revalidatePath("/inventory");
  revalidatePath("/purchasing");
  redirect("/inventory");
}

export async function deleteInventoryAction(formData: FormData) {
  const supabase = createSupabaseClient();
  const id = requiredValue(formData.get("id"), "Inventory id");
  const previous = await supabase
    .from("inventory")
    .select("id,component_id,quantity_available,purchase_price")
    .eq("id", id)
    .maybeSingle();

  if (previous.error) {
    throw new Error(previous.error.message);
  }

  const result = await supabase.from("inventory").delete().eq("id", id);
  if (result.error) {
    throw new Error(result.error.message);
  }

  await recordHistory({
    entity_type: "inventory",
    entity_id: id,
    action_type: "delete",
    summary: `Deleted inventory row ${id}`,
    old_value: stringifyHistoryValue(previous.data)
  });

  revalidatePath("/inventory");
  revalidatePath("/components");
  redirect("/inventory");
}
