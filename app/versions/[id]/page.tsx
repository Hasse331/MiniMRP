import { notFound } from "next/navigation";
import Link from "next/link";
import { BackLink } from "@/components/back-link";
import { ModalTrigger } from "@/components/modal-trigger";
import { VersionComponentPicker } from "@/components/version-component-picker";
import { EmptyState, Notice, PageHeader, Panel } from "@/components/ui";
import { ImportPreview } from "@/features/import/import-preview";
import { buildMrpRows, calculateVersionUnitCost, summarizeMrpRows } from "@/lib/mappers/mrp";
import {
  addProductionEntryAction,
  attachComponentToVersionAction,
  deleteVersionAction,
  removeComponentFromVersionAction,
  updateVersionAction,
  updateComponentAction
} from "@/lib/supabase/actions";
import { getComponents, getVersionById } from "@/lib/supabase/queries";

export default async function VersionDetailPage(props: {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ quantity?: string }>;
}) {
  const params = await props.params;
  const searchParams = (await props.searchParams) ?? {};
  const { item, error } = await getVersionById(params.id);
  const { items: allComponents } = await getComponents();
  const requestedQuantity = Math.max(Number(searchParams.quantity ?? "1") || 1, 1);
  const mrpRows = buildMrpRows(item?.components ?? [], requestedQuantity);
  const mrpSummary = summarizeMrpRows(mrpRows);
  const versionUnitCost = calculateVersionUnitCost(item?.components ?? []);

  if (!item && !error) {
    notFound();
  }

  return (
    <div className="page">
      <PageHeader
        title={item ? `${item.product?.name ?? "Product"} - ${item.version_number}` : "Version"}
        description="Version detail page with attachments, BOM references, and BOM import entry point."
        actions={
          <>
            <BackLink href={item?.product ? `/products/${item.product.id}` : "/products"} label="Back to product" />
            {item ? (
              <ModalTrigger buttonLabel="Edit version" title={`Edit ${item.version_number}`}>
                <form action={updateVersionAction} className="stack">
                  <input type="hidden" name="id" value={item.id} />
                  <div className="field-group">
                    <label htmlFor="version-number">Version name</label>
                    <input id="version-number" className="input" name="version_number" defaultValue={item.version_number} />
                  </div>
                  <button className="button primary" type="submit">
                    Save version
                  </button>
                </form>
              </ModalTrigger>
            ) : null}
            {item?.product ? (
              <ModalTrigger buttonLabel="Delete version" buttonClassName="button danger" title={`Delete ${item.version_number}?`}>
                <form action={deleteVersionAction} className="stack">
                  <input type="hidden" name="id" value={item.id} />
                  <input type="hidden" name="product_id" value={item.product.id} />
                  <div className="notice error">
                    This will delete the version and linked BOM references and attachments if cascade rules apply.
                  </div>
                  <button className="button danger" type="submit">
                    Confirm delete
                  </button>
                </form>
              </ModalTrigger>
            ) : null}
            <a className="button-link subtle" href={`/api/export/bom/${params.id}`}>
              Export BOM
            </a>
            <ModalTrigger buttonLabel="Import CSV" title="Import BOM from CSV or Excel">
              <ImportPreview
                plain
                title="Import BOM from CSV or Excel"
                description="Bulk import entry point for version BOM data."
                mappingHint="Expected target fields include version reference, component mapping, and optional user-defined source columns. Next implementation step is persisting mapped rows to Supabase."
              />
            </ModalTrigger>
          </>
        }
      />

      {error ? <Notice error>{error}</Notice> : null}

      <div className="two-column">
        <Panel title="Attachments" description="Files linked to this version.">
          {item?.attachments.length ? (
            <div className="stack">
              {item.attachments.map((attachment) => (
                <a
                  key={attachment.id}
                  href={attachment.file_path}
                  target="_blank"
                  rel="noreferrer"
                  className="button-link subtle"
                >
                  {attachment.file_path}
                </a>
              ))}
            </div>
          ) : (
            <EmptyState>No attachments found for this version.</EmptyState>
          )}
        </Panel>

        <Panel title="Version info" description="Basic version-specific information.">
          <div className="detail-list">
            <div className="detail-item">
              <span>Product</span>
              <strong>{item?.product?.name ?? "-"}</strong>
            </div>
            <div className="detail-item">
              <span>Version</span>
              <strong>{item?.version_number ?? "-"}</strong>
            </div>
            <div className="detail-item">
              <span>BOM rows</span>
              <strong>{item?.references.length ?? 0}</strong>
            </div>
            <div className="detail-item">
              <span>One unit component cost</span>
              <strong>{versionUnitCost.toFixed(4)}</strong>
            </div>
          </div>
        </Panel>
      </div>

      <Panel
        title="Components"
        description="Components used in this version, grouped by component with merged references and calculated quantity."
        actions={
          <ModalTrigger buttonLabel="Add component" buttonClassName="button primary" title="Add component to version">
            <form action={attachComponentToVersionAction} className="stack">
              <input type="hidden" name="version_id" value={params.id} />
              <VersionComponentPicker components={allComponents.map((component) => ({
                id: component.id,
                name: component.name,
                category: component.category,
                value: component.value
              }))} />
              <input
                className="input"
                type="text"
                name="references"
                placeholder="References, e.g. R1, R2, R3"
              />
              <button className="button primary" type="submit">
                Add component
              </button>
            </form>
          </ModalTrigger>
        }
      >
        {!item?.components.length ? (
          <EmptyState>No components found for this version.</EmptyState>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Component</th>
                  <th>Category</th>
                  <th>Producer</th>
                  <th>Value</th>
                  <th>References</th>
                  <th>Qty</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {item.components.map((row) => (
                  <tr key={row.component.id}>
                    <td>{row.component.name}</td>
                    <td>{row.component.category}</td>
                    <td>{row.component.producer}</td>
                    <td>{row.component.value ?? "-"}</td>
                    <td>{row.references.join(", ")}</td>
                    <td>{row.quantity}</td>
                    <td>
                      <div className="action-row">
                        <Link className="button-link subtle" href={`/components/${row.component.id}`}>
                          View
                        </Link>
                        <ModalTrigger buttonLabel="Edit" title={`Edit ${row.component.name}`}>
                          <form action={updateComponentAction} className="stack">
                            <input type="hidden" name="id" value={row.component.id} />
                            <input type="hidden" name="versionId" value={params.id} />
                            <div className="field-group">
                              <label htmlFor={`version-component-name-${row.component.id}`}>Name</label>
                              <input id={`version-component-name-${row.component.id}`} className="input" name="name" defaultValue={row.component.name} />
                            </div>
                            <div className="field-group">
                              <label htmlFor={`version-component-category-${row.component.id}`}>Category</label>
                              <input id={`version-component-category-${row.component.id}`} className="input" name="category" defaultValue={row.component.category} />
                            </div>
                            <div className="field-group">
                              <label htmlFor={`version-component-producer-${row.component.id}`}>Producer</label>
                              <input id={`version-component-producer-${row.component.id}`} className="input" name="producer" defaultValue={row.component.producer} />
                            </div>
                            <div className="field-group">
                              <label htmlFor={`version-component-value-${row.component.id}`}>Value</label>
                              <input id={`version-component-value-${row.component.id}`} className="input" name="value" defaultValue={row.component.value ?? ""} />
                            </div>
                            <div className="field-group">
                              <label htmlFor={`version-component-safety-${row.component.id}`}>Safety stock</label>
                              <input id={`version-component-safety-${row.component.id}`} className="input" type="number" min="0" step="1" name="safety_stock" defaultValue={row.component.safety_stock} />
                            </div>
                            <button className="button primary" type="submit">
                              Save changes
                            </button>
                          </form>
                        </ModalTrigger>
                        <ModalTrigger buttonLabel="Remove" buttonClassName="button danger" title={`Remove ${row.component.name} from this version?`}>
                          <form action={removeComponentFromVersionAction} className="stack">
                            <input type="hidden" name="version_id" value={params.id} />
                            <input type="hidden" name="component_id" value={row.component.id} />
                            <div className="notice error">
                              This removes all references for this component from the current version.
                            </div>
                            <button className="button danger" type="submit">
                              Confirm remove
                            </button>
                          </form>
                        </ModalTrigger>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>

      <Panel
        title="MRP result"
        description="Gross requirement is per-product quantity multiplied by build quantity. Net requirement subtracts current available inventory, and Add to production consumes gross requirement from stock immediately."
        actions={
          <div className="action-row">
            <form className="action-row">
              <label className="inline-field" htmlFor="build-quantity">
                <span>Qty</span>
                <input
                  id="build-quantity"
                  className="input quantity-input"
                  type="number"
                  min="1"
                  step="1"
                  name="quantity"
                  defaultValue={requestedQuantity}
                />
              </label>
              <button className="button primary" type="submit">
                Calculate MRP
              </button>
            </form>
            <ModalTrigger buttonLabel="Add to production" buttonClassName="button primary" title="Add to production?">
              <form action={addProductionEntryAction} className="stack">
                <input type="hidden" name="version_id" value={params.id} />
                <input type="hidden" name="quantity" value={requestedQuantity} />
                <div className="notice">
                  This will add the current version to the production queue with build quantity {requestedQuantity}, consume available inventory by gross requirement, and leave any missing quantity in purchasing as net need.
                </div>
                <button className="button primary" type="submit">
                  Confirm add to production
                </button>
              </form>
            </ModalTrigger>
          </div>
        }
      >
        {!mrpRows.length ? (
          <EmptyState>No components available for MRP calculation.</EmptyState>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Component</th>
                  <th>Refs</th>
                  <th>Qty per product</th>
                  <th>Build qty</th>
                  <th>Safety stock</th>
                  <th>Lead time</th>
                  <th>Unit price</th>
                  <th>Gross</th>
                  <th>Gross cost</th>
                  <th>Available</th>
                  <th>Net</th>
                  <th>Net cost</th>
                </tr>
              </thead>
              <tbody>
                {mrpRows.map((row) => (
                  <tr key={`mrp-${row.componentId}`}>
                    <td>{row.componentName}</td>
                    <td>{row.references.join(", ")}</td>
                    <td>{row.quantityPerProduct}</td>
                    <td>{row.buildQuantity}</td>
                    <td>{row.safetyStock}</td>
                    <td>{row.leadTime ?? "-"}</td>
                    <td>{row.unitPrice === null ? "-" : row.unitPrice.toFixed(4)}</td>
                    <td>{row.grossRequirement}</td>
                    <td>{row.grossCost === null ? "-" : row.grossCost.toFixed(4)}</td>
                    <td>{row.availableInventory}</td>
                    <td>{row.netRequirement}</td>
                    <td>{row.netCost === null ? "-" : row.netCost.toFixed(4)}</td>
                  </tr>
                ))}
                <tr>
                  <td><strong>Total</strong></td>
                  <td>-</td>
                  <td>{mrpSummary.quantityPerProduct}</td>
                  <td>-</td>
                  <td>{mrpSummary.safetyStock}</td>
                  <td>{mrpSummary.maxLeadTime ?? "-"}</td>
                  <td>-</td>
                  <td>{mrpSummary.grossRequirement}</td>
                  <td>{mrpSummary.grossCost.toFixed(4)}</td>
                  <td>{mrpSummary.availableInventory}</td>
                  <td>{mrpSummary.netRequirement}</td>
                  <td>{mrpSummary.netCost.toFixed(4)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </Panel>
    </div>
  );
}
