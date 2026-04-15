export function rowsToCsv(rows: Array<Record<string, string | number | null>>) {
  if (rows.length === 0) {
    return "";
  }

  const headers = Object.keys(rows[0]);
  const escapeCell = (value: string | number | null) => {
    const stringValue = value === null ? "" : String(value);
    const sanitizedValue =
      typeof value === "string" && /^[=+\-@]/.test(stringValue)
        ? `'${stringValue}`
        : stringValue;
    if (sanitizedValue.includes(",") || sanitizedValue.includes("\"") || sanitizedValue.includes("\n")) {
      return `"${sanitizedValue.replaceAll("\"", "\"\"")}"`;
    }
    return sanitizedValue;
  };

  return [headers.join(","), ...rows.map((row) => headers.map((header) => escapeCell(row[header] ?? "")).join(","))].join("\n");
}
