import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

import { getBrowserRuntimeMode, getRuntimeMode, getServerRuntimeMode } from "../lib/runtime/env.ts";

test("all application entry points use the only supported SQLite runtime", () => {
  assert.equal(getRuntimeMode(), "sqlite");
  assert.equal(getServerRuntimeMode(), "sqlite");
  assert.equal(getBrowserRuntimeMode(), "sqlite");
});

test("runtime selection no longer depends on backend environment variables", () => {
  const source = fs.readFileSync("lib/runtime/env.ts", "utf8");

  assert.equal(source.includes("process.env"), false);
  assert.equal(source.toLowerCase().includes("supabase"), false);
});
