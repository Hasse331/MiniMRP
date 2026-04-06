import type { PurchasingItem } from "@/lib/types/domain";
import { updatePartSafetyStockAction } from "@/lib/supabase/actions/index";
import { EmptyState, ModalTrigger, Panel } from "@/shared/ui";

export function NearSafetyPanel(props: { items: PurchasingItem[] }) {
  return (
    <Panel
      title="Near safety stock"
      description="Components with inventory above zero but below 1.5x safety stock, excluding active shortages."
    >
      {props.items.length === 0 ? (
        <EmptyState>No components near safety stock.</EmptyState>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Component</th>
                <th>Category</th>
                <th>Available</th>
                <th>Safety stock</th>
                <th>Lead time</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {props.items.map((item) => (
                <tr key={item.id}>
                  <td>{item.name}</td>
                  <td>{item.category}</td>
                  <td>{item.quantity_available}</td>
                  <td>{item.safety_stock}</td>
                  <td>{item.lead_time ?? "-"}</td>
                  <td>
                    <ModalTrigger buttonLabel="Edit safety stock" title={`Edit safety stock: ${item.name}`}>
                      <form action={updatePartSafetyStockAction} className="stack">
                        <input type="hidden" name="id" value={item.id} />
                        <div className="field-group">
                          <label htmlFor={`purchasing-safety-${item.id}`}>Safety stock</label>
                          <input
                            id={`purchasing-safety-${item.id}`}
                            className="input"
                            type="number"
                            min="0"
                            step="1"
                            name="safety_stock"
                            defaultValue={item.safety_stock}
                          />
                        </div>
                        <button className="button primary" type="submit">
                          Save safety stock
                        </button>
                      </form>
                    </ModalTrigger>
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
