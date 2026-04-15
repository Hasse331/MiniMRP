import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

test("production SQL does not grant blanket authenticated access to public DML or private schema usage", () => {
  const schemaSql = readFileSync(
    new URL("../supabase/production/01_schemas.sql", import.meta.url),
    "utf8"
  );
  const grantsSql = readFileSync(
    new URL("../supabase/production/02_grants.sql", import.meta.url),
    "utf8"
  );

  assert.equal(
    schemaSql.includes("grant usage on schema private to authenticated;"),
    false
  );
  assert.equal(
    grantsSql.includes("grant select, insert, update, delete on all tables in schema public to authenticated;"),
    false
  );
  assert.equal(
    grantsSql.includes("grant usage, select on all sequences in schema public to authenticated;"),
    false
  );
  assert.equal(
    grantsSql.includes("alter default privileges in schema public\ngrant select, insert, update, delete on tables to authenticated;"),
    false
  );
  assert.equal(
    grantsSql.includes("alter default privileges in schema public\ngrant usage, select on sequences to authenticated;"),
    false
  );
});
