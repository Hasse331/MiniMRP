import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

test("version reference update actions validate reference conflicts before deleting existing rows", () => {
  const sqliteSource = fs.readFileSync("lib/runtime/sqlite/actions.ts", "utf8");
  const sqliteUpdateBlock = sqliteSource.slice(
    sqliteSource.indexOf("export async function updateVersionComponentReferencesAction"),
    sqliteSource.indexOf("export async function importVersionBomAction")
  );

  const sqliteValidateIndex = sqliteUpdateBlock.indexOf("validateVersionComponentReferences(");
  const sqliteDeleteIndex = sqliteUpdateBlock.indexOf("delete from component_references");
  assert.equal(sqliteValidateIndex >= 0, true);
  assert.equal(sqliteDeleteIndex >= 0, true);
  assert.equal(sqliteValidateIndex < sqliteDeleteIndex, true);
  assert.equal(sqliteUpdateBlock.includes("bomImportError"), true);
});
