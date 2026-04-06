import test from "node:test";
import assert from "node:assert/strict";
import { normalizeReferencesInput } from "../lib/mappers/bom.ts";

test("normalizeReferencesInput defaults empty input to dash", () => {
  assert.deepEqual(normalizeReferencesInput(null), ["-"]);
  assert.deepEqual(normalizeReferencesInput(""), ["-"]);
  assert.deepEqual(normalizeReferencesInput("   "), ["-"]);
});

test("normalizeReferencesInput keeps comma-separated references", () => {
  assert.deepEqual(normalizeReferencesInput("R1, R2, R3"), ["R1", "R2", "R3"]);
});
