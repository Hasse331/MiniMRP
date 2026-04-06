export interface ReservedRequirementInput {
  component_id: string;
  gross_requirement: number;
  inventory_consumed: number;
  net_requirement: number;
  quantity: number;
}

export interface ReservedRequirementSummary {
  grossRequirement: number;
  inventoryConsumed: number;
  netRequirement: number;
  activeProductionQuantity: number;
  activeEntryCount: number;
}

export function summarizeReservedRequirements(items: ReservedRequirementInput[]) {
  return items.reduce<Record<string, ReservedRequirementSummary>>((summary, item) => {
    const existing = summary[item.component_id];
    if (existing) {
      existing.grossRequirement += item.gross_requirement;
      existing.inventoryConsumed += item.inventory_consumed;
      existing.netRequirement += item.net_requirement;
      existing.activeProductionQuantity += item.quantity;
      existing.activeEntryCount += 1;
      return summary;
    }

    summary[item.component_id] = {
      grossRequirement: item.gross_requirement,
      inventoryConsumed: item.inventory_consumed,
      netRequirement: item.net_requirement,
      activeProductionQuantity: item.quantity,
      activeEntryCount: 1
    };
    return summary;
  }, {});
}
