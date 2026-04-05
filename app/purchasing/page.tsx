import { ModalTrigger } from "@/components/modal-trigger";
import { EmptyState, Notice, PageHeader, Panel } from "@/components/ui";
import { updateComponentSafetyStockAction } from "@/lib/supabase/actions";
import { getPurchasingOverview } from "@/lib/supabase/queries";

export default async function PurchasingPage() {
  const { shortages, nearSafety, error } = await getPurchasingOverview();

  return (
    <div className="page">
      <PageHeader
        title="Purchasing"
        description="Shortages and near-safety-stock components for purchasing decisions."
      />

      {error ? <Notice error>{error}</Notice> : null}

      <Panel
        title="Current shortages"
        description="Components currently below safety stock with suggested reorder quantity."
      >
        {shortages.length === 0 ? (
          <EmptyState>No current shortages.</EmptyState>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Component</th>
                  <th>Category</th>
                  <th>Available</th>
                  <th>Safety stock</th>
                  <th>Recommended order</th>
                  <th>Lead time</th>
                </tr>
              </thead>
              <tbody>
                {shortages.map((item) => (
                  <tr key={item.id}>
                    <td>{item.name}</td>
                    <td>{item.category}</td>
                    <td>{item.quantity_available}</td>
                    <td>{item.safety_stock}</td>
                    <td>{item.recommended_order_quantity}</td>
                    <td>{item.lead_time ?? "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>

      <Panel
        title="Near safety stock"
        description="Components close to safety stock or just above it."
      >
        {nearSafety.length === 0 ? (
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
                {nearSafety.map((item) => (
                  <tr key={item.id}>
                    <td>{item.name}</td>
                    <td>{item.category}</td>
                    <td>{item.quantity_available}</td>
                    <td>{item.safety_stock}</td>
                    <td>{item.lead_time ?? "-"}</td>
                    <td>
                      <ModalTrigger buttonLabel="Edit safety stock" title={`Edit safety stock: ${item.name}`}>
                        <form action={updateComponentSafetyStockAction} className="stack">
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
    </div>
  );
}
