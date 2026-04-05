import { notFound } from "next/navigation";
import { BackLink } from "@/components/back-link";
import { ModalTrigger } from "@/components/modal-trigger";
import { Badge, EmptyState, Notice, PageHeader, Panel } from "@/components/ui";
import { calculateInventoryValue, calculateWeightedAveragePrice } from "@/lib/mappers/mrp";
import {
  createSellerForComponentAction,
  deleteComponentAction,
  updateComponentAction,
  upsertComponentLinkAction
} from "@/lib/supabase/actions";
import { getComponentById } from "@/lib/supabase/queries";

export default async function ComponentDetailPage(props: {
  params: Promise<{ id: string }>;
}) {
  const params = await props.params;
  const { item, error } = await getComponentById(params.id);

  if (!item && !error) {
    notFound();
  }

  return (
    <div className="page">
      <PageHeader
        title={item?.name ?? "Component"}
        description="Component detail page with inventory, supplier links, and version usage."
        actions={
          <>
            <BackLink href="/components" label="Back to components" />
            {item ? (
              <ModalTrigger buttonLabel="Delete component" buttonClassName="button danger" title={`Delete ${item.name}?`}>
                <form action={deleteComponentAction} className="stack">
                  <input type="hidden" name="id" value={item.id} />
                  <div className="notice error">
                    This will remove the component and linked rows that depend on database cascade rules.
                  </div>
                  <button className="button danger" type="submit">
                    Confirm delete
                  </button>
                </form>
              </ModalTrigger>
            ) : null}
          </>
        }
      />

      {error ? <Notice error>{error}</Notice> : null}

      <div className="two-column">
        <Panel title="Component" description="Edit the component master here to update the same component everywhere.">
          <div className="detail-list">
            <div className="detail-item">
              <span>Name</span>
              <strong>{item?.name ?? "-"}</strong>
            </div>
            <div className="detail-item">
              <span>Category</span>
              <strong>{item?.category ?? "-"}</strong>
            </div>
            <div className="detail-item">
              <span>Producer</span>
              <strong>{item?.producer ?? "-"}</strong>
            </div>
            <div className="detail-item">
              <span>Value</span>
              <strong>{item?.value ?? "-"}</strong>
            </div>
            {item ? (
              <ModalTrigger buttonLabel="Edit" title={`Edit ${item.name}`}>
                <form action={updateComponentAction} className="stack">
                  <input type="hidden" name="id" value={item.id} />
                  <div className="field-group">
                    <label htmlFor="component-name">Name</label>
                    <input id="component-name" className="input" name="name" defaultValue={item.name} />
                  </div>
                  <div className="field-group">
                    <label htmlFor="component-category">Category</label>
                    <input id="component-category" className="input" name="category" defaultValue={item.category} />
                  </div>
                  <div className="field-group">
                    <label htmlFor="component-producer">Producer</label>
                    <input id="component-producer" className="input" name="producer" defaultValue={item.producer} />
                  </div>
                  <div className="field-group">
                    <label htmlFor="component-value">Value</label>
                    <input id="component-value" className="input" name="value" defaultValue={item.value ?? ""} />
                  </div>
                  <div className="field-group">
                    <label htmlFor="component-safety-stock">Safety stock</label>
                    <input id="component-safety-stock" className="input" type="number" min="0" step="1" name="safety_stock" defaultValue={item.safety_stock} />
                  </div>
                  <button className="button primary" type="submit">
                    Save changes
                  </button>
                </form>
              </ModalTrigger>
            ) : null}
          </div>
        </Panel>

        <Panel title="Inventory" description="Current stock and price for this component.">
          {item?.inventory ? (
            <div className="detail-list">
              <div className="detail-item">
                <span>Quantity available</span>
                <strong>{item.inventory.quantity_available}</strong>
              </div>
              <div className="detail-item">
                <span>Purchase price</span>
                <strong>{item.inventory.purchase_price ?? "-"}</strong>
              </div>
              <div className="detail-item">
                <span>Inventory value</span>
                <strong>{calculateInventoryValue(item.inventory)?.toFixed(4) ?? "-"}</strong>
              </div>
              <div className="detail-item">
                <span>Weighted average price</span>
                <strong>{calculateWeightedAveragePrice([item.inventory])?.toFixed(4) ?? "-"}</strong>
              </div>
              <div className="detail-item">
                <span>Safety stock</span>
                <strong>{item.safety_stock}</strong>
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
                <strong>{item?.safety_stock ?? "-"}</strong>
              </div>
            </div>
          )}
        </Panel>
      </div>

      <Panel
        title="Sellers"
        description="Seller schema data relevant to this component: name, base URL, lead time, and generated or explicit product link."
        actions={
          item ? (
            <ModalTrigger buttonLabel="Add seller" buttonClassName="button primary" title="Add seller">
              <form action={createSellerForComponentAction} className="stack">
                <input type="hidden" name="component_id" value={item.id} />
                <input type="hidden" name="component_name" value={item.name} />
                <div className="field-group">
                  <label htmlFor="new-seller-name">Seller name</label>
                  <input id="new-seller-name" className="input" name="seller_name" />
                </div>
                <div className="field-group">
                  <label htmlFor="new-seller-base-url">Base URL</label>
                  <input id="new-seller-base-url" className="input" name="base_url" />
                </div>
                <div className="field-group">
                  <label htmlFor="new-seller-lead-time">Lead time</label>
                  <input id="new-seller-lead-time" className="input" type="number" min="0" step="1" name="lead_time" />
                </div>
                <div className="field-group">
                  <label htmlFor="new-seller-product-url">Explicit product URL</label>
                  <input id="new-seller-product-url" className="input" name="product_url" />
                </div>
                <button className="button primary" type="submit">
                  Add seller
                </button>
              </form>
            </ModalTrigger>
          ) : null
        }
      >
        {item?.sellers.length ? (
          <div className="stack">
            {item.sellers.map(({ seller, product_url }) => (
              <div key={seller.id} className="stack">
                <strong>{seller.name}</strong>
                <span className="muted small">Base URL: {seller.base_url ?? "-"}</span>
                <span className="muted small">Lead time: {seller.lead_time ?? "-"} days</span>
                <div className="action-row">
                  <ModalTrigger buttonLabel="Edit" title={`Edit seller link: ${seller.name}`}>
                    <form action={upsertComponentLinkAction} className="stack">
                      <input type="hidden" name="component_id" value={item.id} />
                      <input type="hidden" name="seller_id" value={seller.id} />
                      <input type="hidden" name="component_name" value={item.name} />
                      <div className="field-group">
                        <label htmlFor={`seller-base-url-${seller.id}`}>Base URL</label>
                        <input id={`seller-base-url-${seller.id}`} className="input" name="base_url" defaultValue={seller.base_url ?? ""} />
                      </div>
                      <div className="field-group">
                        <label htmlFor={`seller-lead-time-${seller.id}`}>Lead time</label>
                        <input id={`seller-lead-time-${seller.id}`} className="input" type="number" min="0" step="1" name="lead_time" defaultValue={seller.lead_time ?? ""} />
                      </div>
                      <div className="field-group">
                        <label htmlFor={`seller-product-url-${seller.id}`}>Product URL</label>
                        <input id={`seller-product-url-${seller.id}`} className="input" name="product_url" defaultValue={product_url ?? ""} />
                      </div>
                      <button className="button primary" type="submit">
                        Save seller
                      </button>
                    </form>
                  </ModalTrigger>
                  {product_url ? (
                    <a className="button-link subtle" href={product_url} target="_blank" rel="noreferrer">
                      View
                    </a>
                  ) : (
                    <Badge>No link</Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState>No sellers linked yet.</EmptyState>
        )}
      </Panel>

      <Panel title="Used in versions" description="Where this component appears in BOM references.">
        {item?.references.length ? (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Version</th>
                  <th>Reference</th>
                </tr>
              </thead>
              <tbody>
                {item.references.map((reference) => (
                  <tr key={`${reference.version?.id ?? "unknown"}-${reference.reference}`}>
                    <td>{reference.product?.name ?? "-"}</td>
                    <td>{reference.version?.version_number ?? "-"}</td>
                    <td>{reference.reference}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState>This component is not linked to any BOM rows yet.</EmptyState>
        )}
      </Panel>
    </div>
  );
}
