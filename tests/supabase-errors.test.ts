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
    'Database schema is missing "production_requirements". Run the latest supabase/schema.sql in Supabase SQL Editor, then try again.'
  );
});
