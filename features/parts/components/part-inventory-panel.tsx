import { calculateInventoryValue, calculateWeightedAveragePrice } from "@/lib/mappers/mrp";
import type { ComponentDetail } from "@/lib/types/domain";
import { Panel } from "@/shared/ui";

export function PartInventoryPanel(props: { part: ComponentDetail | null }) {
  const { part } = props;

  return (
    <Panel title="Inventory" description="Current stock and price for this component.">
      {part?.inventory ? (
        <div className="detail-list">
          <div className="detail-item">
            <span>Quantity available</span>
            <strong>{part.inventory.quantity_available}</strong>
          </div>
          <div className="detail-item">
            <span>Purchase price</span>
            <strong>{part.inventory.purchase_price ?? "-"}</strong>
          </div>
          <div className="detail-item">
            <span>Inventory value</span>
            <strong>{calculateInventoryValue(part.inventory)?.toFixed(4) ?? "-"}</strong>
          </div>
          <div className="detail-item">
            <span>Weighted average price</span>
            <strong>{calculateWeightedAveragePrice([part.inventory])?.toFixed(4) ?? "-"}</strong>
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
            <strong>-</strong>
          </div>
          <div className="detail-item">
            <span>Purchase price</span>
            <strong>-</strong>
          </div>
          <div className="detail-item">
            <span>Inventory value</span>
            <strong>-</strong>
          </div>
          <div className="detail-item">
            <span>Weighted average price</span>
            <strong>-</strong>
          </div>
          <div className="detail-item">
            <span>Safety stock</span>
            <strong>{part?.safety_stock ?? "-"}</strong>
          </div>
        </div>
      )}
    </Panel>
  );
}
