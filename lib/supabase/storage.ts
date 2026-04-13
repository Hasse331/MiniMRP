import type { SupabaseClient } from "@supabase/supabase-js";
import { buildStorageObjectPath, isStoredExternalUrl } from "@/lib/mappers/file-storage";

export const PRODUCT_IMAGES_BUCKET = "product-images";
export const VERSION_ATTACHMENTS_BUCKET = "version-attachments";

export async function resolveStoredFileUrl(
  supabase: SupabaseClient,
  bucket: string,
  storedValue: string | null
) {
  if (!storedValue) {
    return null;
  }

  if (isStoredExternalUrl(storedValue)) {
    return storedValue;
  }

  const signed = await supabase.storage.from(bucket).createSignedUrl(storedValue, 60 * 60);
  if (signed.error) {
    throw new Error(signed.error.message);
  }

  return signed.data.signedUrl;
}

export async function uploadStoredFile(args: {
  supabase: SupabaseClient;
  bucket: string;
  scope: "products" | "versions";
  entityId: string;
  file: File;
}) {
  const path = buildStorageObjectPath(args.scope, args.entityId, args.file.name);
  const result = await args.supabase.storage.from(args.bucket).upload(path, args.file, {
    cacheControl: "3600",
    upsert: false,
    contentType: args.file.type || undefined
  });

  if (result.error) {
    throw new Error(result.error.message);
  }

  return path;
}

export async function deleteStoredFileIfPresent(args: {
  supabase: SupabaseClient;
  bucket: string;
  storedValue: string | null | undefined;
}) {
  if (!args.storedValue || isStoredExternalUrl(args.storedValue)) {
    return;
  }

  const result = await args.supabase.storage.from(args.bucket).remove([args.storedValue]);
  if (result.error) {
    throw new Error(result.error.message);
  }
}
