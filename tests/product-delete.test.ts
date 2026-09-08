import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

test("product detail page includes a guarded delete product modal", () => {
  const source = fs.readFileSync("app/products/[id]/page.tsx", "utf8");

  assert.equal(source.includes("Delete product"), true);
  assert.equal(source.includes("Confirm delete"), true);
  assert.equal(source.includes("This will permanently delete the product"), true);
});

test("runtime facade exposes the SQLite deleteProductAction", () => {
  const contracts = fs.readFileSync("lib/runtime/contracts.ts", "utf8");
  const facade = fs.readFileSync("lib/runtime/actions.ts", "utf8");

  assert.equal(contracts.includes("deleteProductAction: RuntimeAction;"), true);
  assert.equal(facade.includes("export async function deleteProductAction(formData: FormData)"), true);
  assert.equal(facade.includes(".deleteProductAction(formData)"), true);
});

test("product delete action guards against versions and production references only", () => {
  const sqliteSource = fs.readFileSync("lib/runtime/sqlite/actions.ts", "utf8");

  assert.equal(sqliteSource.includes("Cannot delete product while versions still exist."), true);
  assert.equal(sqliteSource.includes("Cannot delete product while production history exists."), true);
  assert.equal(sqliteSource.includes("Cannot delete product while history entries exist."), false);

  assert.equal(
    sqliteSource.includes("where version_id in (select id from product_versions where product_id = :id)"),
    true
  );
});

test("version mutations revalidate the product list page", () => {
  const sqliteSource = fs.readFileSync("lib/runtime/sqlite/actions.ts", "utf8");

  assert.equal(sqliteSource.includes('"/products"'), true);
  assert.equal(
    sqliteSource.includes('revalidateAppViews(["/products", `/products/${productId}`, "/history"]);'),
    true
  );
});
