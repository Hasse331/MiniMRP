import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

test("production shortages present reserved, available, then net need", () => {
  const source = fs.readFileSync(
    "features/purchasing/components/current-shortages-panel.tsx",
    "utf8"
  );
  const reservedHeader = source.indexOf("<th>Reserved</th>");
  const availableHeader = source.indexOf("<th>Available</th>");
  const netNeedHeader = source.indexOf("<th>Net need</th>");
  const reservedValue = source.indexOf("item.reserved_inventory");
  const availableValue = source.indexOf("item.quantity_available");
  const netNeedValue = source.indexOf("item.net_need");

  assert.equal(reservedHeader < availableHeader && availableHeader < netNeedHeader, true);
  assert.equal(reservedValue < availableValue && availableValue < netNeedValue, true);
});

test("near-safety table displays the calculated recommended order", () => {
  const source = fs.readFileSync(
    "features/purchasing/components/near-safety-panel.tsx",
    "utf8"
  );

  assert.match(source, /<th>Recommended order<\/th>/);
  assert.match(source, /item\.recommended_order_quantity/);
});
