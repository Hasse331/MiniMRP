import test from "node:test";
import assert from "node:assert/strict";
import {
  PRIVATE_SCHEMA,
  APP_SETTINGS_TABLE,
  ATTACHMENTS_TABLE,
  COMPONENT_REFERENCES_TABLE,
  HISTORY_EVENTS_TABLE,
  PRODUCT_VERSIONS_TABLE
} from "../lib/supabase/table-names.ts";

test("private schema tables are fully qualified for backend-only access", () => {
  assert.equal(PRIVATE_SCHEMA, "private");
  assert.equal(PRODUCT_VERSIONS_TABLE, "product_versions");
  assert.equal(COMPONENT_REFERENCES_TABLE, "component_references");
  assert.equal(ATTACHMENTS_TABLE, "attachments");
  assert.equal(HISTORY_EVENTS_TABLE, "history_events");
  assert.equal(APP_SETTINGS_TABLE, "app_settings");
});
