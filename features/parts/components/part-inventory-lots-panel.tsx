import { calculateInventoryLotValue } from "@/lib/mappers/inventory-lots";
import type { ComponentDetail } from "@/lib/types/domain";
import { EmptyState, Panel } from "@/shared/ui";
import { InventoryLotActions } from "@/features/parts/components/inventory-lot-edit-form";

export function PartInventoryLotsPanel(props: { part: ComponentDetail | null }) {
  const lots = props.part?.inventory_lots ?? [];

  return (
    <Panel
      title="Inventory lots"
      description="Detailed stock batches used for weighted average pricing and FIFO consumption."
    >
      {lots.length === 0 ? (
        <EmptyState>No inventory lots recorded for this component.</EmptyState>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Received at</th>
                <th>Source</th>
                <th>Qty received</th>
                <th>Qty remaining</th>
                <th>Unit cost</th>
                <th>Remaining value</th>
                <th>Notes</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {lots.map((lot) => (
                <tr key={lot.id}>
                  <td>{new Date(lot.received_at).toLocaleString()}</td>
                  <td>{lot.source ?? "-"}</td>
                  <td>{lot.quantity_received}</td>
                  <td>{lot.quantity_remaining}</td>
                  <td>{lot.unit_cost.toFixed(4)}</td>
                  <td>{calculateInventoryLotValue(lot).toFixed(4)}</td>
                  <td>{lot.notes ?? "-"}</td>
                  <td>
                    <InventoryLotActions
                      lot={lot}
                      componentName={props.part?.name ?? lot.id}
                      returnTo={props.part ? `/components/${props.part.id}` : "/components"}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Panel>
  );
}
