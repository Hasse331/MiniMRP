export function normalizeReferencesInput(value: FormDataEntryValue | null) {
  const text = String(value ?? "").trim();
  if (!text) {
    return ["-"];
  }

  const references = text
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

  return references.length > 0 ? references : ["-"];
}
