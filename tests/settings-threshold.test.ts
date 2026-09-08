import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

test("settings page exposes a near-safety threshold percent field", () => {
  const source = fs.readFileSync("app/settings/page.tsx", "utf8");

  assert.equal(source.includes("near_safety_threshold_percent"), true);
  assert.equal(source.includes("Near safety threshold"), true);
  assert.equal(source.includes("percent above safety stock"), true);
});

test("SQLite settings actions persist the near-safety threshold percent", () => {
  const sqliteSource = fs.readFileSync("lib/runtime/sqlite/actions.ts", "utf8");
  assert.equal(sqliteSource.includes("near_safety_threshold_percent"), true);
});
