"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { MrpRow } from "@/lib/mappers/mrp";
import { addProductionEntryAction } from "@/lib/runtime/actions";
import { EmptyState, InfoTooltip, ModalTrigger, Panel } from "@/shared/ui";

export function VersionMrpPanel(props: {
  versionId: string;
  requestedQuantity: number;
  hasCalculated: boolean;
  rows: MrpRow[];
  summary: {
    quantityPerProduct: number;
    safetyStock: number;
    maxLeadTime: number | null;
    availableInventory: number;
    grossRequirement: number;
    netRequirement: number;
    reservedInventory: number;
    grossCost: number;
    netCost: number;
  };
}) {
  const [draftQuantity, setDraftQuantity] = useState(String(props.requestedQuantity));
  const hasEstimatedUnitPrices = props.rows.some((row) => row.unitPriceIsEstimate);
  const isProductionEntryView = props.rows.some((row) => row.reservedForEntry !== null);

  const pendingQuantity = useMemo(() => {
    const parsed = Number(draftQuantity);
    if (!Number.isFinite(parsed) || parsed < 1) {
      return 1;
    }
    return Math.floor(parsed);
  }, [draftQuantity]);

  const requiresCalculation = !props.hasCalculated || pendingQuantity !== props.requestedQuantity;

  return (
    <Panel
      title="MRP result"
      description="Gross requirement is per-product quantity multiplied by build quantity. Net requirement subtracts current available inventory. Can reserve shows how much this calculation could take from current stock right now, Res. entry shows what is already reserved for the selected production entry, and Res. active is the total reserved across active production entries for this version."
      actions={
        <div className="mrp-actions">
          <form className="mrp-actions">
            <label className="inline-field" htmlFor="build-quantity">
              <span>Qty</span>
              <input
                id="build-quantity"
                className="input quantity-input"
                type="number"
                min="1"
                step="1"
                name="quantity"
                value={draftQuantity}
                onChange={(event) => setDraftQuantity(event.target.value)}
              />
            </label>
            <button className="button primary" type="submit">
              Calculate MRP
            </button>
          </form>
          {requiresCalculation ? (
            <ModalTrigger buttonLabel="Add to production" buttonClassName="button primary" title="Calculate MRP first">
              <div className="stack">
                <div className="notice">
                  Press Calculate MRP for quantity {pendingQuantity} and review the table before adding this version to production.
                </div>
                <div className="small muted">After recalculating the table, reopen this dialog to continue.</div>
              </div>
            </ModalTrigger>
          ) : (
            <ModalTrigger buttonLabel="Add to production" buttonClassName="button primary" title="Add to production?">
              <form action={addProductionEntryAction} className="stack">
                <input type="hidden" name="version_id" value={props.versionId} />
                <input type="hidden" name="quantity" value={props.requestedQuantity} />
                <div className="notice">
                  This will add the current version to the production queue with build quantity {props.requestedQuantity}, consume available inventory by gross requirement, and leave any missing quantity in purchasing as net need.
                </div>
                <button className="button primary" type="submit">
                  Confirm add to production
                </button>
              </form>
            </ModalTrigger>
          )}
        </div>
      }
    >
      {!props.rows.length ? (
        <EmptyState>No components available for MRP calculation.</EmptyState>
      ) : (
        <div className="table-wrap">
          {isProductionEntryView ? (
            <div className="notice mrp-snapshot-notice">
              This view includes a saved production-entry snapshot from when
              the entry was created. Purchasing uses current inventory to
              recalculate the remaining shortage, so its Net need can be
              lower.
            </div>
          ) : null}
          <table>
            <thead>
              <tr>
                <th>SKU</th>
                <th>Component</th>
                <th>Qty per product</th>
                <th>Safety stock</th>
                <th>Available</th>
                <th>Gross</th>
                <th>Net</th>
                <th>
                  Can reserve
                  <InfoTooltip label="More information about Can reserve">
                    Stock this calculation can allocate immediately. For a
                    saved production entry, this is the amount allocated when
                    the entry was created.
                  </InfoTooltip>
                </th>
                <th>
                  Res. entry
                  <InfoTooltip label="More information about Res. entry">
                    Stock reserved for the production entry currently being
                    viewed.
                  </InfoTooltip>
                </th>
                <th>
                  Res. active
                  <InfoTooltip label="More information about Res. active">
                    Total stock reserved across active production entries for
                    this product version.
                  </InfoTooltip>
                </th>
                <th>Lead time</th>
                <th>Unit price</th>
                <th>Gross cost</th>
                <th>Net cost</th>
              </tr>
            </thead>
            <tbody>
              {props.rows.map((row) => (
                <tr key={`mrp-${row.componentId}`}>
                  <td>{row.sku}</td>
                  <td>
                    <div>
                      <Link className="table-link" href={`/components/${row.componentId}`}>
                        {row.componentName}
                      </Link>
                    </div>
                    {(row.activeProductionQuantity ?? 0) > 0 ? (
                      <div className="small muted">
                        Across active production entries: qty {row.activeProductionQuantity ?? 0}
                      </div>
                    ) : null}
                  </td>
                  <td>{row.quantityPerProduct}</td>
                  <td>{row.safetyStock}</td>
                  <td>{row.availableInventory}</td>
                  <td>{row.grossRequirement}</td>
                  <td>{row.netRequirement}</td>
                  <td>{row.reservedForThisCalculation}</td>
                  <td>{row.reservedForEntry ?? "-"}</td>
                  <td>{row.reservedInventory ?? 0}</td>
                  <td>{row.leadTime ?? "-"}</td>
                  <td>{row.unitPrice === null ? "-" : `${row.unitPrice.toFixed(4)}${row.unitPriceIsEstimate ? "*" : ""}`}</td>
                  <td>{row.grossCost === null ? "-" : row.grossCost.toFixed(4)}</td>
                  <td>{row.netCost === null ? "-" : row.netCost.toFixed(4)}</td>
                </tr>
              ))}
              <tr>
                <td colSpan={5}><strong>Total</strong></td>
                <td>{props.summary.grossRequirement}</td>
                <td>{props.summary.netRequirement}</td>
                <td></td>
                <td></td>
                <td>{props.summary.reservedInventory}</td>
                <td></td>
                <td></td>
                <td>{props.summary.grossCost.toFixed(4)}</td>
                <td>{props.summary.netCost.toFixed(4)}</td>
              </tr>
            </tbody>
          </table>
          {hasEstimatedUnitPrices ? (
            <div className="small muted" style={{ marginTop: 12 }}>
              * means assumed price based on the latest purchase lot when current inventory is zero.
            </div>
          ) : null}
        </div>
      )}
    </Panel>
  );
}
