export function isStoredExternalUrl(value: string | null | undefined) {
  return /^https?:\/\//i.test(String(value ?? "").trim());
}

export function getStoredFileName(value: string | null | undefined) {
  const text = String(value ?? "").trim();
  if (!text) {
    return null;
  }

  const normalized = text.split("?")[0]?.replace(/\/+$/, "") ?? "";
  const parts = normalized.split("/");
  return parts[parts.length - 1] || null;
}

export function isImageFilePath(value: string | null | undefined) {
  const name = getStoredFileName(value)?.toLowerCase() ?? "";

  return [".png", ".jpg", ".jpeg", ".gif", ".webp", ".svg", ".avif"].some((extension) =>
    name.endsWith(extension)
  );
}

export function buildStorageObjectPath(
  scope: "products" | "versions",
  entityId: string,
  fileName: string,
  now = Date.now()
) {
  const trimmed = fileName.trim();
  const dotIndex = trimmed.lastIndexOf(".");
  const stem = dotIndex === -1 ? trimmed : trimmed.slice(0, dotIndex);
  const extension = dotIndex === -1 ? "" : trimmed.slice(dotIndex).toLowerCase();
  const safeStem = stem
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return `${scope}/${entityId}/${now}-${safeStem || "file"}${extension}`;
}
