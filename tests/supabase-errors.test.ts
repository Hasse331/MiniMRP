import test from "node:test";
import assert from "node:assert/strict";
import { getSchemaSetupErrorMessage, isMissingTableError } from "../lib/mappers/supabase-errors.ts";

test("isMissingTableError detects missing production_requirements table errors", () => {
  assert.equal(
    isMissingTableError("Could not find the table 'public.production_requirements' in the schema cache", "production_requirements"),
    true
  );
});

test("getSchemaSetupErrorMessage rewrites missing-table errors into actionable guidance", () => {
  assert.equal(
    getSchemaSetupErrorMessage("Could not find the table 'public.production_requirements' in the schema cache", "production_requirements"),
    'Database schema is missing "production_requirements". Run the SQL files in supabase/production/ in Supabase SQL Editor, then try again.'
  );
});

test("isMissingTableError also detects private schema errors", () => {
  assert.equal(
    isMissingTableError("Could not find the table 'private.product_versions' in the schema cache", "product_versions"),
    true
  );
});
