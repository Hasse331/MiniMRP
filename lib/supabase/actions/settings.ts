"use server";

import { createSupabaseAdminClient } from "../admin-client";
import { APP_SETTINGS_TABLE, PRIVATE_SCHEMA } from "../table-names";
import { recordHistory, redirect, revalidatePath, requiredValue, stringifyHistoryValue } from "./shared";

export async function updateDefaultSafetyStockAction(formData: FormData) {
  const supabase = createSupabaseAdminClient();
  const value = Number(requiredValue(formData.get("default_safety_stock"), "Default safety stock"));
  const previous = await supabase
    .schema(PRIVATE_SCHEMA)
    .from(APP_SETTINGS_TABLE)
    .select("id,default_safety_stock")
    .eq("id", true)
    .maybeSingle();

  if (previous.error) {
    throw new Error(previous.error.message);
  }

  const result = await supabase.schema(PRIVATE_SCHEMA).from(APP_SETTINGS_TABLE).upsert({
    id: true,
    default_safety_stock: value
  });

  if (result.error) {
    throw new Error(result.error.message);
  }

  await recordHistory({
    entity_type: "settings",
    entity_id: "app_settings",
    action_type: "update",
    summary: `Updated default safety stock to ${value}`,
    old_value: stringifyHistoryValue(previous.data),
    new_value: stringifyHistoryValue({ id: true, default_safety_stock: value })
  });

  revalidatePath("/components");
  redirect("/components");
}
