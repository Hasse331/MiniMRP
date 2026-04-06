import { ModalTrigger } from "@/components/modal-trigger";
import { EmptyState, Notice, PageHeader, Panel } from "@/components/ui";
import { updateComponentSafetyStockAction, upsertComponentLinkAction } from "@/lib/supabase/actions";
import { getPurchasingOverview } from "@/lib/supabase/queries";

export default async function PurchasingPage() {
  const { shortages, nearSafety, error } = await getPurchasingOverview();

  return (
    <div className="page">
      <PageHeader
        title="Purchasing"
        description="Production-driven shortages and near-safety-stock components for purchasing decisions."
        actions={
          <a className="button-link subtle" href="/api/export/purchasing">
            Export CSV
          </a>
        }
      />

      {error ? <Notice error>{error}</Notice> : null}

      <Panel
        title="Current shortages"
        description="Summed production net need per component, with suggested reorder quantity including safety stock."
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
                  <th>Net need</th>
                  <th>Recommended order</th>
                  <th>Lead time</th>
                  <th>Seller</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {shortages.map((item) => (
                  <tr key={item.id}>
                    <td>{item.name}</td>
                    <td>{item.category}</td>
                    <td>{item.quantity_available}</td>
                    <td>{item.safety_stock}</td>
                    <td>{item.net_need}</td>
                    <td>{item.recommended_order_quantity}</td>
                    <td>{item.lead_time ?? "-"}</td>
                    <td>
                      {item.seller_product_url ? (
                        <a className="button-link subtle" href={item.seller_product_url} target="_blank" rel="noreferrer">
                          {item.seller_name ?? "View seller"}
                        </a>
                      ) : (
                        item.seller_name ?? "-"
                      )}
                    </td>
                    <td>
                      {item.seller_id ? (
                        <ModalTrigger buttonLabel="Edit seller" title={`Edit seller link: ${item.name}`}>
                          <form action={upsertComponentLinkAction} className="stack">
                            <input type="hidden" name="component_id" value={item.id} />
                            <input type="hidden" name="seller_id" value={item.seller_id} />
                            <input type="hidden" name="component_name" value={item.name} />
                            <input type="hidden" name="returnTo" value="/purchasing" />
                            <div className="field-group">
                              <label htmlFor={`purchasing-base-url-${item.id}`}>Base URL</label>
                              <input id={`purchasing-base-url-${item.id}`} className="input" name="base_url" defaultValue={item.seller_base_url ?? ""} />
                            </div>
                            <div className="field-group">
                              <label htmlFor={`purchasing-lead-time-${item.id}`}>Lead time</label>
                              <input id={`purchasing-lead-time-${item.id}`} className="input" type="number" min="0" step="1" name="lead_time" defaultValue={item.lead_time ?? ""} />
                            </div>
                            <div className="field-group">
                              <label htmlFor={`purchasing-product-url-${item.id}`}>Product URL</label>
                              <input id={`purchasing-product-url-${item.id}`} className="input" name="product_url" defaultValue={item.seller_product_url ?? ""} />
                            </div>
                            <button className="button primary" type="submit">
                              Save seller
                            </button>
                          </form>
                        </ModalTrigger>
                      ) : (
                        "-"
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>

      <Panel
        title="Near safety stock"
        description="Components with inventory above zero but below 1.5x safety stock, excluding active shortages."
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
