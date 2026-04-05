import test from "node:test";
import assert from "node:assert/strict";
import {
  buildMrpRows,
  summarizeMrpRows,
  calculateVersionUnitCost,
  calculateWeightedAveragePrice
} from "../lib/mappers/mrp.ts";

test("buildMrpRows calculates quantities and costs", () => {
  const rows = buildMrpRows(
    [
      {
        component: {
          id: "1",
          name: "Resistor",
          category: "Resistor",
          producer: "Yageo",
          value: "10k",
          safety_stock: 2
        },
        references: ["R1", "R2"],
        quantity: 2,
        inventory: {
          id: "inv-1",
          component_id: "1",
          quantity_available: 3,
          purchase_price: 0.5
        }
      }
    ],
    4
  );

  assert.equal(rows[0]?.grossRequirement, 8);
  assert.equal(rows[0]?.netRequirement, 7);
  assert.equal(rows[0]?.grossCost, 4);
  assert.equal(rows[0]?.netCost, 3.5);
});

test("calculateVersionUnitCost sums one product cost", () => {
  const total = calculateVersionUnitCost([
    {
        component: {
          id: "1",
          name: "Cap",
          category: "Capacitor",
          producer: "Murata",
          value: "100nF",
          safety_stock: 10
        },
        references: ["C1", "C2", "C3"],
        quantity: 3,
      inventory: {
        id: "inv-1",
        component_id: "1",
        quantity_available: 100,
        purchase_price: 0.2
      }
    }
  ]);

  assert.equal(total, 0.6);
});

test("calculateWeightedAveragePrice returns null when no priced stock exists", () => {
  assert.equal(calculateWeightedAveragePrice([]), null);
});

test("summarizeMrpRows returns totals for numeric columns", () => {
  const summary = summarizeMrpRows([
    {
      componentId: "1",
      componentName: "A",
      category: "IC",
      producer: "X",
      value: null,
      references: ["U1"],
      quantityPerProduct: 2,
      buildQuantity: 5,
      safetyStock: 25,
      availableInventory: 3,
      unitPrice: 1.5,
      grossRequirement: 10,
      netRequirement: 32,
      grossCost: 15,
      netCost: 48
    },
    {
      componentId: "2",
      componentName: "B",
      category: "IC",
      producer: "Y",
      value: null,
      references: ["U2"],
      quantityPerProduct: 1,
      buildQuantity: 5,
      safetyStock: 10,
      availableInventory: 6,
      unitPrice: 2,
      grossRequirement: 5,
      netRequirement: 9,
      grossCost: 10,
      netCost: 18
    }
  ]);

  assert.equal(summary.quantityPerProduct, 3);
  assert.equal(summary.safetyStock, 35);
  assert.equal(summary.availableInventory, 9);
  assert.equal(summary.grossRequirement, 15);
  assert.equal(summary.netRequirement, 41);
  assert.equal(summary.grossCost, 25);
  assert.equal(summary.netCost, 66);
});
