import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

test("products page reports SQLite database query errors", () => {
  const source = fs.readFileSync("app/products/page.tsx", "utf8");

  assert.equal(source.includes("getRuntimeMode"), false);
  assert.equal(source.includes("Database query failed while loading products."), true);
  assert.equal(source.toLowerCase().includes("supabase"), false);
});
