import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createSupabaseAdminClient } from "../admin-client";
import { HISTORY_EVENTS_TABLE, PRIVATE_SCHEMA } from "../table-names";

export { revalidatePath, redirect };

export async function recordHistory(args: {
  entity_type: string;
  entity_id?: string | null;
  action_type: string;
  summary: string;
  old_value?: string | null;
  new_value?: string | null;
}) {
  try {
    const supabase = createSupabaseAdminClient();
    await supabase.schema(PRIVATE_SCHEMA).from(HISTORY_EVENTS_TABLE).insert({
      entity_type: args.entity_type,
      entity_id: args.entity_id ?? null,
      action_type: args.action_type,
      summary: args.summary,
      old_value: args.old_value ?? null,
      new_value: args.new_value ?? null
    });
  } catch {
    // Keep UI actions functional even if history table is not yet applied.
  }
}

export function optionalValue(value: FormDataEntryValue | null) {
  const text = String(value ?? "").trim();
  return text.length ? text : null;
}

export function requiredValue(value: FormDataEntryValue | null, field: string) {
  const text = String(value ?? "").trim();
  if (!text) {
    throw new Error(`${field} is required.`);
  }
  return text;
}

export function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function stringifyHistoryValue(value: unknown) {
  return JSON.stringify(value);
}
