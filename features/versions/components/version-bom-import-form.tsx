"use client";

import { useState } from "react";
import { importVersionBomAction } from "@/lib/supabase/actions";
import {
  normalizeVersionBomRows,
  parseVersionBomFile,
  VERSION_BOM_REQUIRED_FIELDS
} from "@/lib/import/version-bom";
import { Notice } from "@/shared/ui";

export function VersionBomImportForm(props: {
  versionId: string;
  initialError?: string | null;
}) {
  const [rows, setRows] = useState<Array<{ sku: string; reference: string }>>([]);
  const [error, setError] = useState<string | null>(null);
  const [serverError, setServerError] = useState<string | null>(props.initialError ?? null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [rowCount, setRowCount] = useState(0);
  const [uniqueSkuCount, setUniqueSkuCount] = useState(0);

  async function onFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) {
      setRows([]);
      setFileName(null);
      setRowCount(0);
      setUniqueSkuCount(0);
      setError(null);
      setServerError(null);
      return;
    }

    setFileName(file.name);
    setServerError(null);

    try {
      const normalized = normalizeVersionBomRows(await parseVersionBomFile(file));
      setRowCount(normalized.length);
      setUniqueSkuCount(new Set(normalized.map((row) => row.sku)).size);
      setRows(normalized.slice(0, 12));
      setError(null);
    } catch (reason) {
      setRows([]);
      setRowCount(0);
      setUniqueSkuCount(0);
      setError(reason instanceof Error ? reason.message : "Could not read the selected BOM file.");
    }
  }

  return (
    <form
      action={importVersionBomAction}
      className="stack"
      onSubmit={(event) => {
        if (error) {
          event.preventDefault();
        }
      }}
    >
      <input type="hidden" name="version_id" value={props.versionId} />

      <Notice error>
        This import replaces the entire BOM of the current version. MiniMRP deletes the current
        references and rebuilds the BOM from this file.
      </Notice>

      <div className="import-notes">
        <div className="small muted">
          Required columns: {VERSION_BOM_REQUIRED_FIELDS.join(", ")}
        </div>
        <div className="small muted">
          Same SKU can appear on multiple rows, or references can be in one cell separated with commas.
        </div>
        <div className="small muted">
          Quantity is not imported. It is calculated from the number of references.
        </div>
        <div className="small muted">
          Valid examples: <code>RES-10K,R1</code> and <code>RES-10K,"R1, R2, R3"</code>
        </div>
      </div>

      <div className="field-group">
        <label htmlFor={`version-bom-file-${props.versionId}`}>BOM file</label>
        <input
          id={`version-bom-file-${props.versionId}`}
          className="input"
          type="file"
          name="file"
          accept=".csv,.xlsx,.xls,.ods"
          required
          onChange={onFileChange}
        />
      </div>

      <div className="small muted">Supported formats: CSV, Excel, and ODS. First sheet only.</div>
      <div className="small muted">Loaded file: {fileName ?? "-"}</div>
      <div className="small muted">Detected rows: {rowCount} | Unique SKUs: {uniqueSkuCount}</div>
      {rowCount > rows.length ? (
        <div className="small muted">Previewing first {rows.length} rows.</div>
      ) : null}

      {serverError ? <Notice error>{serverError}</Notice> : null}
      {error ? <Notice error>{error}</Notice> : null}

      {rows.length > 0 ? (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>SKU</th>
                <th>Reference</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, index) => (
                <tr key={`${row.sku}-${row.reference}-${index}`}>
                  <td>{row.sku}</td>
                  <td>{row.reference}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}

      <button className="button primary" type="submit">
        Replace BOM
      </button>
    </form>
  );
}
