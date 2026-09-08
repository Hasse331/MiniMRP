import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

test("runtime auth facade uses SQLite admin access only", () => {
  const runtimeAuthSource = fs.readFileSync("lib/runtime/auth.ts", "utf8");
  const runtimeActionsSource = fs.readFileSync("lib/runtime/actions.ts", "utf8");

  assert.equal(runtimeAuthSource.includes("getRuntimeAdminFlags"), true);
  assert.equal(runtimeAuthSource.includes("requireRuntimeAdminAction"), true);
  assert.equal(runtimeAuthSource.includes("requireRuntimeAdminApiAccess"), true);
  assert.equal(runtimeAuthSource.includes('import("./sqlite/auth.ts")'), true);
  assert.equal(runtimeAuthSource.toLowerCase().includes("supabase"), false);
  assert.equal(runtimeActionsSource.includes('import("./sqlite/actions.ts")'), true);
  assert.equal(runtimeActionsSource.toLowerCase().includes("supabase"), false);
  assert.equal(fs.existsSync("lib/runtime/browser-client.ts"), false);
  assert.equal(fs.existsSync("lib/runtime/actions.ts"), true);
});
