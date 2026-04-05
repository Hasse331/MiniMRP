import type { InventoryItem, VersionDetail } from "@/lib/types/domain";

type VersionComponent = VersionDetail["components"][number];

export interface MrpRow {
  componentId: string;
  componentName: string;
  category: string;
  producer: string;
  value: string | null;
  references: string[];
  quantityPerProduct: number;
  buildQuantity: number;
  safetyStock: number;
  leadTime: number | null;
  availableInventory: number;
  unitPrice: number | null;
  grossRequirement: number;
  netRequirement: number;
  grossCost: number | null;
  netCost: number | null;
}

function roundCurrency(value: number) {
  return Math.round(value * 10000) / 10000;
}

export function calculateWeightedAveragePrice(items: Array<InventoryItem | null | undefined>) {
  let weightedCost = 0;
  let totalQuantity = 0;

  for (const item of items) {
    if (!item || item.purchase_price === null || item.quantity_available <= 0) {
      continue;
    }

    weightedCost += item.quantity_available * item.purchase_price;
    totalQuantity += item.quantity_available;
  }

  if (totalQuantity === 0) {
    return null;
  }

  return roundCurrency(weightedCost / totalQuantity);
}

export function calculateInventoryValue(item: InventoryItem | null | undefined) {
  if (!item || item.purchase_price === null) {
    return null;
  }

  return roundCurrency(item.quantity_available * item.purchase_price);
}

export function calculateVersionUnitCost(components: VersionComponent[]) {
  return roundCurrency(
    components.reduce((total, row) => {
      const unitPrice = row.inventory?.purchase_price;
      if (unitPrice === null || unitPrice === undefined) {
        return total;
      }

      return total + row.quantity * unitPrice;
    }, 0)
  );
}

export function buildMrpRows(components: VersionComponent[], buildQuantity: number): MrpRow[] {
  return components.map((row) => {
    const unitPrice = row.inventory?.purchase_price ?? null;
    const grossRequirement = row.quantity * buildQuantity;
    const availableInventory = row.inventory?.quantity_available ?? 0;
    const safetyStock = row.component.safety_stock ?? 0;
    const netRequirement = Math.max(grossRequirement + safetyStock - availableInventory, 0);
    const grossCost = unitPrice === null ? null : roundCurrency(grossRequirement * unitPrice);
    const netCost = unitPrice === null ? null : roundCurrency(netRequirement * unitPrice);

    return {
      componentId: row.component.id,
      componentName: row.component.name,
      category: row.component.category,
      producer: row.component.producer,
      value: row.component.value,
      references: row.references,
      quantityPerProduct: row.quantity,
      buildQuantity,
      safetyStock,
      leadTime: row.lead_time ?? null,
      availableInventory,
      unitPrice,
      grossRequirement,
      netRequirement,
      grossCost,
      netCost
    };
  });
}

export function summarizeMrpRows(rows: MrpRow[]) {
  return rows.reduce(
    (summary, row) => ({
      quantityPerProduct: summary.quantityPerProduct + row.quantityPerProduct,
      safetyStock: summary.safetyStock + row.safetyStock,
      maxLeadTime:
        row.leadTime === null
          ? summary.maxLeadTime
          : Math.max(summary.maxLeadTime ?? 0, row.leadTime),
      availableInventory: summary.availableInventory + row.availableInventory,
      grossRequirement: summary.grossRequirement + row.grossRequirement,
      netRequirement: summary.netRequirement + row.netRequirement,
      grossCost: roundCurrency(summary.grossCost + (row.grossCost ?? 0)),
      netCost: roundCurrency(summary.netCost + (row.netCost ?? 0))
    }),
    {
      quantityPerProduct: 0,
      safetyStock: 0,
      maxLeadTime: null as number | null,
      availableInventory: 0,
      grossRequirement: 0,
      netRequirement: 0,
      grossCost: 0,
      netCost: 0
    }
  );
}

export function buildPurchasingBuckets<T extends {
  id: string;
  name: string;
  category: string;
  producer: string;
  value: string | null;
  safety_stock: number;
  quantity_available: number;
  purchase_price: number | null;
  lead_time: number | null;
}>(items: T[]) {
  const shortages = items
    .filter((item) => item.quantity_available < item.safety_stock)
    .map((item) => ({
      ...item,
      recommended_order_quantity: Math.max(item.safety_stock - item.quantity_available, 0)
    }))
    .sort((left, right) => left.quantity_available - right.quantity_available);

  const nearSafety = items
    .filter(
      (item) =>
        item.quantity_available <= item.safety_stock + 10
    )
    .map((item) => ({
      ...item,
      recommended_order_quantity: 0
    }))
    .sort((left, right) => left.quantity_available - right.quantity_available);

  return { shortages, nearSafety };
}
