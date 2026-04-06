import test from "node:test";
import assert from "node:assert/strict";
import {
  aggregateProductionRequirements,
  reserveInventoryForProduction
} from "../lib/mappers/mrp.ts";

test("aggregateProductionRequirements sums gross needs and calculates net against available stock once", () => {
  const result = aggregateProductionRequirements([
    {
      componentId: "1",
      componentName: "MCU",
      category: "IC",
      producer: "ST",
      value: "STM32",
      references: ["U1"],
      quantityPerProduct: 1,
      buildQuantity: 5,
      safetyStock: 10,
      leadTime: 14,
      availableInventory: 6,
      unitPrice: 1,
      grossRequirement: 5,
      netRequirement: 9,
      grossCost: 5,
      netCost: 9
    },
    {
      componentId: "1",
      componentName: "MCU",
      category: "IC",
      producer: "ST",
      value: "STM32",
      references: ["U1"],
      quantityPerProduct: 1,
      buildQuantity: 7,
      safetyStock: 10,
      leadTime: 7,
      availableInventory: 6,
      unitPrice: 1,
      grossRequirement: 7,
      netRequirement: 11,
      grossCost: 7,
      netCost: 11
    }
  ]);

  assert.equal(result.length, 1);
  assert.equal(result[0]?.totalGrossRequirement, 12);
  assert.equal(result[0]?.totalNetRequirement, 6);
  assert.equal(result[0]?.leadTime, 7);
});

test("aggregateProductionRequirements reports zero net need when available stock covers gross requirement", () => {
  const result = aggregateProductionRequirements([
    {
      componentId: "1",
      componentName: "MCU",
      category: "IC",
      producer: "ST",
      value: "STM32",
      references: ["U1"],
      quantityPerProduct: 1,
      buildQuantity: 5,
      safetyStock: 10,
      leadTime: 14,
      availableInventory: 20,
      unitPrice: 1,
      grossRequirement: 5,
      netRequirement: 0,
      grossCost: 5,
      netCost: 0
    }
  ]);

  assert.equal(result[0]?.totalNetRequirement, 0);
});

test("reserveInventoryForProduction consumes available stock first and leaves remaining net need", () => {
  const result = reserveInventoryForProduction([
    {
      componentId: "1",
      componentName: "MCU",
      category: "IC",
      producer: "ST",
      value: "STM32",
      references: ["U1"],
      quantityPerProduct: 2,
      buildQuantity: 5,
      safetyStock: 10,
      leadTime: 14,
      availableInventory: 6,
      unitPrice: 1,
      grossRequirement: 10,
      netRequirement: 4,
      grossCost: 10,
      netCost: 4
    }
  ]);

  assert.equal(result.length, 1);
  assert.equal(result[0]?.inventoryConsumed, 6);
  assert.equal(result[0]?.netRequirement, 4);
  assert.equal(result[0]?.remainingInventory, 0);
});
