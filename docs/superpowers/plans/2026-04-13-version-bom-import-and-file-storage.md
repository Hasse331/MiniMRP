# Version BOM Import And File Storage Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement replace-all version BOM import, version attachment upload/preview/delete, and product main image upload/remove backed by Supabase Storage.

**Architecture:** Build two pure helper layers first: one for BOM import parsing and one for file-storage helpers. Then wire thin server actions around them, resolve stored paths to signed URLs in the query layer, and finally replace the placeholder version import and raw file-link UI with task-specific upload panels.

**Tech Stack:** Next.js App Router, React 19, TypeScript, Supabase JS, Supabase Storage, XLSX, Node test runner

---

## File Structure

- Create `lib/import/version-bom.ts` for BOM parsing, header aliases, duplicate/conflict detection, and insert-row building.
- Create `lib/mappers/file-storage.ts` for URL detection, filename extraction, image detection, and storage path building.
- Create `lib/supabase/storage.ts` for bucket constants plus signed URL, upload, and delete helpers.
- Create `tests/version-bom-import.test.ts` for BOM parser coverage.
- Create `tests/file-storage.test.ts` for file helper coverage.
- Create `features/versions/components/version-bom-import-form.tsx` for the real replace-all import modal body.
- Modify `lib/supabase/actions/versions.ts`, `lib/supabase/actions/products.ts`, `lib/supabase/actions/index.ts`, `lib/supabase/queries/versions.ts`, `lib/supabase/queries/products.ts`, `lib/types/domain.ts`, `app/versions/[id]/page.tsx`, `app/products/[id]/page.tsx`, `features/versions/components/version-header-actions.tsx`, `features/versions/components/version-attachments-panel.tsx`, `features/products/components/product-summary-panel.tsx`, and `app/globals.css`.

## Task 1: Build The Version BOM Import Parser

**Files:**
- Create: `tests/version-bom-import.test.ts`
- Create: `lib/import/version-bom.ts`

- [ ] **Step 1: Write the failing test**

```ts
import test from "node:test";
import assert from "node:assert/strict";
import * as XLSX from "xlsx";
import {
  VERSION_BOM_REQUIRED_FIELDS,
  buildVersionBomReferenceRows,
  normalizeVersionBomRows,
  parseVersionBomBuffer
} from "../lib/import/version-bom.ts";

function buildWorkbookBuffer(rows: Array<Array<string | number>>) {
  const workbook = XLSX.utils.book_new();
  const sheet = XLSX.utils.aoa_to_sheet(rows);
  XLSX.utils.book_append_sheet(workbook, sheet, "BOM");
  const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });
  return buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength);
}

test("version BOM import exposes the required logical fields", () => {
  assert.deepEqual(VERSION_BOM_REQUIRED_FIELDS, ["sku", "reference"]);
});

test("normalizeVersionBomRows expands repeated SKUs and comma-separated references", () => {
  const rows = normalizeVersionBomRows(
    parseVersionBomBuffer(buildWorkbookBuffer([["SKU", "Reference"], ["RES-10K", "R1, R2"], ["RES-10K", "R3"]]))
  );
  assert.deepEqual(rows, [
    { sku: "RES-10K", reference: "R1" },
    { sku: "RES-10K", reference: "R2" },
    { sku: "RES-10K", reference: "R3" }
  ]);
});

test("normalizeVersionBomRows rejects duplicate or conflicting references", () => {
  assert.throws(() => normalizeVersionBomRows(parseVersionBomBuffer(buildWorkbookBuffer([["sku", "reference"], ["RES-10K", "R1"], ["RES-10K", "R1"]]))), /Duplicate reference "R1"/i);
  assert.throws(() => normalizeVersionBomRows(parseVersionBomBuffer(buildWorkbookBuffer([["sku", "designator"], ["RES-10K", "R1"], ["RES-47K", "R1"]]))), /Reference "R1" is assigned to more than one SKU/i);
});

test("buildVersionBomReferenceRows rejects unknown SKUs", () => {
  assert.throws(() => buildVersionBomReferenceRows({ versionId: "ver-1", rows: [{ sku: "RES-10K", reference: "R1" }], components: [{ id: "cmp-1", sku: "CAP-100N" }] }), /Unknown SKU in BOM import: RES-10K/i);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --experimental-strip-types --test tests/version-bom-import.test.ts`
Expected: FAIL because `lib/import/version-bom.ts` does not exist yet

- [ ] **Step 3: Write minimal implementation**

```ts
import * as XLSX from "xlsx";

export const VERSION_BOM_REQUIRED_FIELDS = ["sku", "reference"] as const;
const SKU_HEADERS = new Set(["sku", "component_sku"]);
const REFERENCE_HEADERS = new Set(["reference", "references", "ref", "designator"]);

type LooseRow = Record<string, unknown>;
type SheetRow = unknown[];

export interface VersionBomImportRow {
  sku: string;
  reference: string;
}

export async function parseVersionBomFile(file: File) {
  return parseVersionBomBuffer(await file.arrayBuffer());
}

export function parseVersionBomBuffer(buffer: ArrayBuffer) {
  const workbook = XLSX.read(buffer, { type: "array" });
  const firstSheetName = workbook.SheetNames[0];
  if (!firstSheetName) return [] as LooseRow[];
  const sheet = workbook.Sheets[firstSheetName];
  const rows = XLSX.utils.sheet_to_json<SheetRow>(sheet, { header: 1, defval: "", raw: false });
  const headerRowIndex = rows.findIndex((row) => hasLogicalHeaders(row));
  if (headerRowIndex === -1) throw new Error("Could not find BOM columns for SKU and reference.");
  const headers = (rows[headerRowIndex] ?? []).map((cell) => String(cell ?? "").trim());
  return rows.slice(headerRowIndex + 1).filter((row) => row.some((cell) => String(cell ?? "").trim().length > 0)).map((row) => Object.fromEntries(headers.map((header, index) => [header, String(row[index] ?? "").trim()])));
}

export function normalizeVersionBomRows(rows: LooseRow[]): VersionBomImportRow[] {
  const normalized: VersionBomImportRow[] = [];
  const skuByReference = new Map<string, string>();
  for (const [index, row] of rows.entries()) {
    const sku = readLogicalValue(row, SKU_HEADERS).trim();
    const references = readLogicalValue(row, REFERENCE_HEADERS).split(",").map((value) => value.trim()).filter(Boolean);
    if (!sku) throw new Error(`Import row ${index + 1}: missing required value for sku`);
    if (references.length === 0) throw new Error(`Import row ${index + 1}: missing required value for reference`);
    for (const reference of references) {
      const existingSku = skuByReference.get(reference);
      if (existingSku && existingSku !== sku) throw new Error(`Reference "${reference}" is assigned to more than one SKU.`);
      if (existingSku === sku) throw new Error(`Duplicate reference "${reference}" in BOM import.`);
      skuByReference.set(reference, sku);
      normalized.push({ sku, reference });
    }
  }
  return normalized;
}

export function buildVersionBomReferenceRows(args: { versionId: string; rows: VersionBomImportRow[]; components: Array<{ id: string; sku: string }> }) {
  const componentIdBySku = new Map(args.components.map((component) => [component.sku.trim().toUpperCase(), component.id]));
  return args.rows.map((row) => {
    const componentId = componentIdBySku.get(row.sku.trim().toUpperCase());
    if (!componentId) throw new Error(`Unknown SKU in BOM import: ${row.sku}`);
    return { version_id: args.versionId, component_master_id: componentId, reference: row.reference };
  });
}

function hasLogicalHeaders(row: SheetRow) {
  const headers = new Set(row.map((cell) => String(cell ?? "").trim().toLowerCase()));
  return Array.from(SKU_HEADERS).some((header) => headers.has(header)) && Array.from(REFERENCE_HEADERS).some((header) => headers.has(header));
}

function readLogicalValue(row: LooseRow, acceptedHeaders: Set<string>) {
  for (const [key, value] of Object.entries(row)) {
    if (acceptedHeaders.has(key.trim().toLowerCase())) return String(value ?? "");
  }
  return "";
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --experimental-strip-types --test tests/version-bom-import.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add tests/version-bom-import.test.ts lib/import/version-bom.ts
git commit -m "feat: add version BOM import parser"
```

## Task 2: Add Pure File Storage Helpers

**Files:**
- Create: `tests/file-storage.test.ts`
- Create: `lib/mappers/file-storage.ts`

- [ ] **Step 1: Write the failing test**

```ts
import test from "node:test";
import assert from "node:assert/strict";
import { buildStorageObjectPath, getStoredFileName, isImageFilePath, isStoredExternalUrl } from "../lib/mappers/file-storage.ts";

test("file storage helpers classify stored values correctly", () => {
  assert.equal(isStoredExternalUrl("https://example.com/file.pdf"), true);
  assert.equal(isStoredExternalUrl("versions/ver-1/file.pdf"), false);
  assert.equal(getStoredFileName("versions/ver-1/1700000000000-gerber-top.png"), "1700000000000-gerber-top.png");
  assert.equal(getStoredFileName(""), null);
  assert.equal(isImageFilePath("products/prod-1/photo.JPG"), true);
  assert.equal(isImageFilePath("versions/ver-1/bom.pdf"), false);
  assert.equal(buildStorageObjectPath("versions", "ver-1", "Gerber Top.png", 1700000000000), "versions/ver-1/1700000000000-gerber-top.png");
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --experimental-strip-types --test tests/file-storage.test.ts`
Expected: FAIL because `lib/mappers/file-storage.ts` does not exist yet

- [ ] **Step 3: Write minimal implementation**

```ts
export function isStoredExternalUrl(value: string | null | undefined) {
  return /^https?:\/\//i.test(String(value ?? "").trim());
}

export function getStoredFileName(value: string | null | undefined) {
  const text = String(value ?? "").trim();
  if (!text) return null;
  const normalized = text.split("?")[0]?.replace(/\/+$/, "") ?? "";
  const parts = normalized.split("/");
  return parts[parts.length - 1] || null;
}

export function isImageFilePath(value: string | null | undefined) {
  const name = getStoredFileName(value)?.toLowerCase() ?? "";
  return [".png", ".jpg", ".jpeg", ".gif", ".webp", ".svg", ".avif"].some((extension) => name.endsWith(extension));
}

export function buildStorageObjectPath(scope: "products" | "versions", entityId: string, fileName: string, now = Date.now()) {
  const trimmed = fileName.trim();
  const dotIndex = trimmed.lastIndexOf(".");
  const stem = dotIndex === -1 ? trimmed : trimmed.slice(0, dotIndex);
  const extension = dotIndex === -1 ? "" : trimmed.slice(dotIndex).toLowerCase();
  const safeStem = stem.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  return `${scope}/${entityId}/${now}-${safeStem || "file"}${extension}`;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --experimental-strip-types --test tests/file-storage.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add tests/file-storage.test.ts lib/mappers/file-storage.ts
git commit -m "feat: add file storage helpers"
```

## Task 3: Implement BOM Replace-All And Version Attachment Actions

**Files:**
- Create: `lib/supabase/storage.ts`
- Modify: `lib/supabase/actions/versions.ts`
- Modify: `lib/supabase/actions/index.ts`

- [ ] **Step 1: Run the helper tests before wiring actions**

Run: `node --experimental-strip-types --test tests/version-bom-import.test.ts tests/file-storage.test.ts`
Expected: PASS

- [ ] **Step 2: Add shared storage helpers**

```ts
import type { SupabaseClient } from "@supabase/supabase-js";
import { buildStorageObjectPath, isStoredExternalUrl } from "@/lib/mappers/file-storage";

export const PRODUCT_IMAGES_BUCKET = "product-images";
export const VERSION_ATTACHMENTS_BUCKET = "version-attachments";

export async function resolveStoredFileUrl(supabase: SupabaseClient, bucket: string, storedValue: string | null) {
  if (!storedValue) return null;
  if (isStoredExternalUrl(storedValue)) return storedValue;
  const signed = await supabase.storage.from(bucket).createSignedUrl(storedValue, 60 * 60);
  if (signed.error) throw new Error(signed.error.message);
  return signed.data.signedUrl;
}

export async function uploadStoredFile(args: { supabase: SupabaseClient; bucket: string; scope: "products" | "versions"; entityId: string; file: File }) {
  const path = buildStorageObjectPath(args.scope, args.entityId, args.file.name);
  const result = await args.supabase.storage.from(args.bucket).upload(path, args.file, { cacheControl: "3600", upsert: false, contentType: args.file.type || undefined });
  if (result.error) throw new Error(result.error.message);
  return path;
}

export async function deleteStoredFileIfPresent(args: { supabase: SupabaseClient; bucket: string; storedValue: string | null | undefined }) {
  if (!args.storedValue || isStoredExternalUrl(args.storedValue)) return;
  const result = await args.supabase.storage.from(args.bucket).remove([args.storedValue]);
  if (result.error) throw new Error(result.error.message);
}
```

- [ ] **Step 3: Implement version actions**

```ts
import { buildVersionBomReferenceRows, normalizeVersionBomRows, parseVersionBomFile } from "@/lib/import/version-bom";
import { VERSION_ATTACHMENTS_BUCKET, deleteStoredFileIfPresent, uploadStoredFile } from "../storage";

export async function importVersionBomAction(formData: FormData) {
  const supabase = createSupabaseAdminClient();
  const versionId = requiredValue(formData.get("version_id"), "Version id");
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) redirectVersionError(versionId, "bomImportError", "Import file is required.");
  try {
    const normalizedRows = normalizeVersionBomRows(await parseVersionBomFile(file));
    if (normalizedRows.length === 0) redirectVersionError(versionId, "bomImportError", "The selected file did not contain any import rows.");
    const skuList = Array.from(new Set(normalizedRows.map((row) => row.sku.trim().toUpperCase())));
    const componentsResult = await supabase.from("components").select("id,sku");
    if (componentsResult.error) throw new Error(componentsResult.error.message);
    const referenceRows = buildVersionBomReferenceRows({ versionId, rows: normalizedRows, components: (componentsResult.data ?? []).map((row) => ({ id: String(row.id), sku: String(row.sku) })) });
    const previous = await supabase.schema(PRIVATE_SCHEMA).from(COMPONENT_REFERENCES_TABLE).select("version_id,component_master_id,reference").eq("version_id", versionId);
    if (previous.error) throw new Error(previous.error.message);
    const deleteResult = await supabase.schema(PRIVATE_SCHEMA).from(COMPONENT_REFERENCES_TABLE).delete().eq("version_id", versionId);
    if (deleteResult.error) throw new Error(deleteResult.error.message);
    const insertResult = await supabase.schema(PRIVATE_SCHEMA).from(COMPONENT_REFERENCES_TABLE).insert(referenceRows);
    if (insertResult.error) throw new Error(insertResult.error.message);
    await recordHistory({ entity_type: "version", entity_id: versionId, action_type: "import_bom", summary: `Replaced BOM by import for version ${versionId}`, old_value: stringifyHistoryValue(previous.data), new_value: stringifyHistoryValue({ file_name: file.name, references: referenceRows.length, skus: skuList.length }) });
  } catch (error) {
    redirectVersionError(versionId, "bomImportError", error instanceof Error ? error.message : "Could not import BOM.");
  }
  revalidatePath(`/versions/${versionId}`);
  redirect(`/versions/${versionId}`);
}

export async function uploadVersionAttachmentAction(formData: FormData) {
  const supabase = createSupabaseAdminClient();
  const versionId = requiredValue(formData.get("version_id"), "Version id");
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) redirectVersionError(versionId, "attachmentError", "Attachment file is required.");
  let storedPath: string | null = null;
  try {
    storedPath = await uploadStoredFile({ supabase, bucket: VERSION_ATTACHMENTS_BUCKET, scope: "versions", entityId: versionId, file });
    const insertResult = await supabase.schema(PRIVATE_SCHEMA).from(ATTACHMENTS_TABLE).insert({ version_id: versionId, file_path: storedPath });
    if (insertResult.error) throw new Error(insertResult.error.message);
    await recordHistory({ entity_type: "attachment", entity_id: versionId, action_type: "upload", summary: `Uploaded attachment ${file.name} for version ${versionId}`, new_value: stringifyHistoryValue({ version_id: versionId, file_path: storedPath }) });
  } catch (error) {
    if (storedPath) await deleteStoredFileIfPresent({ supabase, bucket: VERSION_ATTACHMENTS_BUCKET, storedValue: storedPath }).catch(() => undefined);
    redirectVersionError(versionId, "attachmentError", error instanceof Error ? error.message : "Could not upload attachment.");
  }
  revalidatePath(`/versions/${versionId}`);
  redirect(`/versions/${versionId}`);
}

export async function deleteVersionAttachmentAction(formData: FormData) {
  const supabase = createSupabaseAdminClient();
  const versionId = requiredValue(formData.get("version_id"), "Version id");
  const attachmentId = requiredValue(formData.get("attachment_id"), "Attachment id");
  const previous = await supabase.schema(PRIVATE_SCHEMA).from(ATTACHMENTS_TABLE).select("id,version_id,file_path").eq("id", attachmentId).maybeSingle<{ id: string; version_id: string; file_path: string }>();
  if (previous.error || !previous.data) throw new Error(previous.error?.message ?? "Attachment not found.");
  await deleteStoredFileIfPresent({ supabase, bucket: VERSION_ATTACHMENTS_BUCKET, storedValue: previous.data.file_path });
  const deleteResult = await supabase.schema(PRIVATE_SCHEMA).from(ATTACHMENTS_TABLE).delete().eq("id", attachmentId);
  if (deleteResult.error) throw new Error(deleteResult.error.message);
  await recordHistory({ entity_type: "attachment", entity_id: versionId, action_type: "delete", summary: `Deleted attachment ${attachmentId} from version ${versionId}`, old_value: stringifyHistoryValue(previous.data) });
  revalidatePath(`/versions/${versionId}`);
  redirect(`/versions/${versionId}`);
}

function redirectVersionError(versionId: string, key: "bomImportError" | "attachmentError", message: string): never {
  redirect(`/versions/${versionId}?${key}=${encodeURIComponent(message)}`);
}
```

- [ ] **Step 4: Re-export the new actions**

```ts
export {
  attachPartToVersionAction,
  deleteVersionAttachmentAction,
  deleteVersionAction,
  importVersionBomAction,
  removePartFromVersionAction,
  updateVersionComponentReferencesAction,
  updateVersionAction,
  uploadVersionAttachmentAction
} from "./versions";
```

- [ ] **Step 5: Run focused verification**

Run: `node --experimental-strip-types --test tests/version-bom-import.test.ts tests/file-storage.test.ts`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add lib/supabase/storage.ts lib/supabase/actions/versions.ts lib/supabase/actions/index.ts
git commit -m "feat: add version BOM import and attachment actions"
```

## Task 4: Resolve Stored Paths In The Query Layer

**Files:**
- Modify: `lib/types/domain.ts`
- Modify: `lib/supabase/queries/versions.ts`
- Modify: `lib/supabase/queries/products.ts`

- [ ] **Step 1: Update domain types**

```ts
export interface Product {
  id: string;
  name: string;
  image: string | null;
  image_path: string | null;
}

export interface Attachment {
  id: string;
  version_id: string;
  file_path: string;
  file_url: string | null;
  file_name: string | null;
  is_image: boolean;
}
```

- [ ] **Step 2: Resolve product image and attachment URLs**

```ts
import { getStoredFileName, isImageFilePath } from "@/lib/mappers/file-storage";
import { PRODUCT_IMAGES_BUCKET, VERSION_ATTACHMENTS_BUCKET, resolveStoredFileUrl } from "../storage";

const productImageUrl = await resolveStoredFileUrl(adminSupabase, PRODUCT_IMAGES_BUCKET, productResult.data.image);

const attachmentItems = await Promise.all(
  attachmentsResult.data.map(async (attachment) => ({
    ...attachment,
    file_url: await resolveStoredFileUrl(adminSupabase, VERSION_ATTACHMENTS_BUCKET, attachment.file_path),
    file_name: getStoredFileName(attachment.file_path),
    is_image: isImageFilePath(attachment.file_path)
  }))
);
```

- [ ] **Step 3: Keep the product result shape stable**

```ts
item: {
  ...productResult.data,
  image: productImageUrl,
  image_path: productResult.data.image,
  versions: versionsResult.data
}
```

- [ ] **Step 4: Run verification**

Run: `node --experimental-strip-types --test tests/file-storage.test.ts`
Expected: PASS

Run: `npm run typecheck`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add lib/types/domain.ts lib/supabase/queries/versions.ts lib/supabase/queries/products.ts
git commit -m "feat: resolve stored file paths in queries"
```

## Task 5: Add Product Image Actions

**Files:**
- Modify: `lib/supabase/actions/products.ts`
- Modify: `lib/supabase/actions/index.ts`

- [ ] **Step 1: Add upload and remove actions**

```ts
import { PRODUCT_IMAGES_BUCKET, deleteStoredFileIfPresent, uploadStoredFile } from "../storage";

export async function uploadProductImageAction(formData: FormData) {
  const supabase = createSupabaseAdminClient();
  const id = requiredValue(formData.get("id"), "Product id");
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) redirectProductImageError(id, "Product image file is required.");
  const previous = await supabase.from("products").select("id,name,image").eq("id", id).maybeSingle();
  if (previous.error || !previous.data) throw new Error(previous.error?.message ?? "Product not found.");
  let storedPath: string | null = null;
  try {
    storedPath = await uploadStoredFile({ supabase, bucket: PRODUCT_IMAGES_BUCKET, scope: "products", entityId: id, file });
    await deleteStoredFileIfPresent({ supabase, bucket: PRODUCT_IMAGES_BUCKET, storedValue: previous.data.image });
    const updateResult = await supabase.from("products").update({ image: storedPath }).eq("id", id);
    if (updateResult.error) throw new Error(updateResult.error.message);
    await recordHistory({ entity_type: "product", entity_id: id, action_type: "upload_image", summary: `Uploaded product image for ${previous.data.name}`, old_value: stringifyHistoryValue(previous.data), new_value: stringifyHistoryValue({ ...previous.data, image: storedPath }) });
  } catch (error) {
    if (storedPath) await deleteStoredFileIfPresent({ supabase, bucket: PRODUCT_IMAGES_BUCKET, storedValue: storedPath }).catch(() => undefined);
    redirectProductImageError(id, error instanceof Error ? error.message : "Could not upload product image.");
  }
  revalidatePath("/products");
  revalidatePath(`/products/${id}`);
  redirect(`/products/${id}`);
}

export async function removeProductImageAction(formData: FormData) {
  const supabase = createSupabaseAdminClient();
  const id = requiredValue(formData.get("id"), "Product id");
  const previous = await supabase.from("products").select("id,name,image").eq("id", id).maybeSingle();
  if (previous.error || !previous.data) throw new Error(previous.error?.message ?? "Product not found.");
  await deleteStoredFileIfPresent({ supabase, bucket: PRODUCT_IMAGES_BUCKET, storedValue: previous.data.image });
  const updateResult = await supabase.from("products").update({ image: null }).eq("id", id);
  if (updateResult.error) throw new Error(updateResult.error.message);
  await recordHistory({ entity_type: "product", entity_id: id, action_type: "remove_image", summary: `Removed product image from ${previous.data.name}`, old_value: stringifyHistoryValue(previous.data), new_value: stringifyHistoryValue({ ...previous.data, image: null }) });
  revalidatePath("/products");
  revalidatePath(`/products/${id}`);
  redirect(`/products/${id}`);
}

function redirectProductImageError(productId: string, message: string): never {
  redirect(`/products/${productId}?imageError=${encodeURIComponent(message)}`);
}
```

- [ ] **Step 2: Re-export the new product actions**

```ts
export {
  createProductAction,
  createVersionAction,
  removeProductImageAction,
  updateProductAction,
  uploadProductImageAction
} from "./products";
```

- [ ] **Step 3: Run verification**

Run: `npm run typecheck`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add lib/supabase/actions/products.ts lib/supabase/actions/index.ts
git commit -m "feat: add product image actions"
```

## Task 6: Replace The Placeholder UI

**Files:**
- Create: `features/versions/components/version-bom-import-form.tsx`
- Modify: `app/versions/[id]/page.tsx`
- Modify: `app/products/[id]/page.tsx`
- Modify: `features/versions/components/version-header-actions.tsx`
- Modify: `features/versions/components/version-attachments-panel.tsx`
- Modify: `features/products/components/product-summary-panel.tsx`
- Modify: `app/globals.css`

- [ ] **Step 1: Create the dedicated BOM import form**

```tsx
"use client";

import { useMemo, useState } from "react";
import { importVersionBomAction } from "@/lib/supabase/actions";
import { normalizeVersionBomRows, parseVersionBomFile, VERSION_BOM_REQUIRED_FIELDS } from "@/lib/import/version-bom";
import { Notice } from "@/shared/ui";

export function VersionBomImportForm(props: { versionId: string; initialError?: string | null }) {
  const [rows, setRows] = useState<Array<{ sku: string; reference: string }>>([]);
  const [error, setError] = useState<string | null>(props.initialError ?? null);
  const [fileName, setFileName] = useState<string | null>(null);
  const uniqueSkuCount = useMemo(() => new Set(rows.map((row) => row.sku)).size, [rows]);

  async function onFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    try {
      const normalized = normalizeVersionBomRows(await parseVersionBomFile(file));
      setRows(normalized.slice(0, 12));
      setError(null);
    } catch (reason) {
      setRows([]);
      setError(reason instanceof Error ? reason.message : "Could not read the selected BOM file.");
    }
  }

  return (
    <form action={importVersionBomAction} className="stack" onSubmit={(event) => error ? event.preventDefault() : undefined}>
      <input type="hidden" name="version_id" value={props.versionId} />
      <Notice error>This import replaces the entire BOM of the current version. The file only needs {VERSION_BOM_REQUIRED_FIELDS.join(" + ")}.</Notice>
      <div className="small muted">Same SKU can appear on multiple rows, or references can be in one cell separated with commas. Quantity is calculated from references.</div>
      <input className="input" type="file" name="file" accept=".csv,.xlsx,.xls,.ods" required onChange={onFileChange} />
      <div className="small muted">Loaded file: {fileName ?? "-"}</div>
      <div className="small muted">Preview rows: {rows.length} | Unique SKUs: {uniqueSkuCount}</div>
      {props.initialError ? <Notice error>{props.initialError}</Notice> : null}
      {error ? <Notice error>{error}</Notice> : null}
      <button className="button primary" type="submit">Replace BOM</button>
    </form>
  );
}
```

- [ ] **Step 2: Replace raw attachment and product image rendering**

```tsx
<VersionAttachmentsPanel version={item} initialError={searchParams.attachmentError ?? null} />
<ProductSummaryPanel product={item} imageError={searchParams.imageError ?? null} />
```

```tsx
<VersionBomImportForm versionId={versionId} initialError={props.bomImportError} />
```

```tsx
{attachment.is_image && attachment.file_url ? (
  <div className="image-frame attachment-preview">
    <img src={attachment.file_url} alt={attachment.file_name ?? "Attachment"} />
  </div>
) : null}
```

- [ ] **Step 3: Add minimal styles**

```css
.attachment-grid { display: grid; gap: 12px; }
.attachment-card { display: grid; gap: 10px; padding: 12px; border: 1px solid var(--line); border-radius: 12px; background: var(--panel-soft); }
.attachment-preview { min-height: 140px; }
```

- [ ] **Step 4: Run verification**

Run: `npm run typecheck`
Expected: PASS

Run: `npm test`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add features/versions/components/version-bom-import-form.tsx app/versions/[id]/page.tsx app/products/[id]/page.tsx features/versions/components/version-header-actions.tsx features/versions/components/version-attachments-panel.tsx features/products/components/product-summary-panel.tsx app/globals.css
git commit -m "feat: add BOM import and file upload UI"
```

## Task 7: Final Verification And Storage Notes

**Files:**
- Modify: `README.md` (only if the storage setup note is missing)

- [ ] **Step 1: Run the final verification commands**

Run: `node --experimental-strip-types --test tests/version-bom-import.test.ts tests/file-storage.test.ts`
Expected: PASS

Run: `npm test`
Expected: PASS

Run: `npm run typecheck`
Expected: PASS

- [ ] **Step 2: Add or confirm the short storage setup note**

```md
## Storage setup

- Create private bucket `version-attachments`
- Create private bucket `product-images`
- Confirm `.env.development` has `NEXT_PUBLIC_SUPABASE_URL` and a service-role key via `SUPABASE_SECRET_KEY` or `SUPABASE_SERVICE_ROLE_KEY`
```

- [ ] **Step 3: Commit**

```bash
git add README.md
git commit -m "docs: add storage setup notes"
```
