import { calculateInventorySummaryFromLots, calculateInventoryValueFromLots } from "@/lib/mappers/inventory-lots";
import type { ComponentDetail } from "@/lib/types/domain";
import { Panel } from "@/shared/ui";

export function PartInventoryPanel(props: { part: ComponentDetail | null }) {
  const { part } = props;
  const summary = part ? calculateInventorySummaryFromLots(part.inventory_lots) : null;
  const inventoryValue = part ? calculateInventoryValueFromLots(part.inventory_lots) : null;

  return (
    <Panel title="Inventory" description="Current stock summary derived from remaining inventory lots.">
      {part ? (
        <div className="detail-list">
          <div className="detail-item">
            <span>Quantity available</span>
            <strong>{summary?.quantity_available ?? part.inventory?.quantity_available ?? 0}</strong>
          </div>
          <div className="detail-item">
            <span>Weighted average price</span>
            <strong>{summary?.purchase_price?.toFixed(4) ?? part.inventory?.purchase_price?.toFixed(4) ?? "-"}</strong>
          </div>
          <div className="detail-item">
            <span>Inventory value</span>
            <strong>{inventoryValue?.toFixed(4) ?? "-"}</strong>
          </div>
          <div className="detail-item">
            <span>Safety stock</span>
            <strong>{part.safety_stock}</strong>
          </div>
        </div>
      ) : (
        <div className="detail-list">
          <div className="detail-item">
            <span>Quantity available</span>
            <strong>0</strong>
          </div>
          <div className="detail-item">
            <span>Safety stock</span>
            <strong>-</strong>
          </div>
        </div>
      )}
    </Panel>
  );
}
