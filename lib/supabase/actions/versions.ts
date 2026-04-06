"use server";

import { normalizeReferencesInput } from "@/lib/mappers/bom";
import { createSupabaseClient } from "../client";
import { recordHistory, redirect, revalidatePath, requiredValue, stringifyHistoryValue } from "./shared";

export async function attachPartToVersionAction(formData: FormData) {
  const supabase = createSupabaseClient();
  const versionId = requiredValue(formData.get("version_id"), "Version id");
  const componentId = requiredValue(formData.get("component_id"), "Component id");
  const references = normalizeReferencesInput(formData.get("references"));

  for (const reference of references) {
    const result = await supabase.from("component_references").upsert(
      {
        version_id: versionId,
        component_master_id: componentId,
        reference
      },
      { onConflict: "version_id,reference" }
    );

    if (result.error) {
      throw new Error(result.error.message);
    }
  }

  await recordHistory({
    entity_type: "version",
    entity_id: versionId,
    action_type: "attach_component",
    summary: `Attached component ${componentId} to version ${versionId} with references ${references.join(", ")}`,
    new_value: stringifyHistoryValue({ component_id: componentId, references })
  });

  revalidatePath(`/versions/${versionId}`);
  redirect(`/versions/${versionId}`);
}

export async function removePartFromVersionAction(formData: FormData) {
  const supabase = createSupabaseClient();
  const versionId = requiredValue(formData.get("version_id"), "Version id");
  const componentId = requiredValue(formData.get("component_id"), "Component id");
  const previous = await supabase
    .from("component_references")
    .select("version_id,component_master_id,reference")
    .eq("version_id", versionId)
    .eq("component_master_id", componentId);

  if (previous.error) {
    throw new Error(previous.error.message);
  }

  const result = await supabase
    .from("component_references")
    .delete()
    .eq("version_id", versionId)
    .eq("component_master_id", componentId);

  if (result.error) {
    throw new Error(result.error.message);
  }

  await recordHistory({
    entity_type: "version",
    entity_id: versionId,
    action_type: "remove_component",
    summary: `Removed component ${componentId} from version ${versionId}`,
    old_value: stringifyHistoryValue(previous.data)
  });

  revalidatePath(`/versions/${versionId}`);
  redirect(`/versions/${versionId}`);
}

export async function updateVersionAction(formData: FormData) {
  const supabase = createSupabaseClient();
  const id = requiredValue(formData.get("id"), "Version id");
  const versionNumber = requiredValue(formData.get("version_number"), "Version number");
  const previous = await supabase
    .from("product_versions")
    .select("id,product_id,version_number")
    .eq("id", id)
    .maybeSingle();
  if (previous.error) {
    throw new Error(previous.error.message);
  }

  const result = await supabase
    .from("product_versions")
    .update({ version_number: versionNumber })
    .eq("id", id);
  if (result.error) {
    throw new Error(result.error.message);
  }

  await recordHistory({
    entity_type: "version",
    entity_id: id,
    action_type: "update",
    summary: `Updated version name to "${versionNumber}"`,
    old_value: stringifyHistoryValue(previous.data),
    new_value: stringifyHistoryValue(previous.data ? { ...previous.data, version_number: versionNumber } : { id, version_number: versionNumber })
  });

  revalidatePath(`/versions/${id}`);
  redirect(`/versions/${id}`);
}

export async function deleteVersionAction(formData: FormData) {
  const supabase = createSupabaseClient();
  const id = requiredValue(formData.get("id"), "Version id");
  const productId = requiredValue(formData.get("product_id"), "Product id");
  const previous = await supabase
    .from("product_versions")
    .select("id,product_id,version_number")
    .eq("id", id)
    .maybeSingle();
  if (previous.error) {
    throw new Error(previous.error.message);
  }

  const result = await supabase.from("product_versions").delete().eq("id", id);
  if (result.error) {
    throw new Error(result.error.message);
  }

  await recordHistory({
    entity_type: "version",
    entity_id: id,
    action_type: "delete",
    summary: `Deleted version ${id}`,
    old_value: stringifyHistoryValue(previous.data)
  });

  revalidatePath(`/products/${productId}`);
  redirect(`/products/${productId}`);
}
