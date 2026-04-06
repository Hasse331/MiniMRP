import type { MrpRow } from "@/lib/mappers/mrp";
import { addProductionEntryAction } from "@/lib/supabase/actions/index";
import { EmptyState, ModalTrigger, Panel } from "@/shared/ui";

export function VersionMrpPanel(props: {
  versionId: string;
  requestedQuantity: number;
  rows: MrpRow[];
  summary: {
    quantityPerProduct: number;
    safetyStock: number;
    maxLeadTime: number | null;
    availableInventory: number;
    grossRequirement: number;
    netRequirement: number;
    grossCost: number;
    netCost: number;
  };
}) {
  return (
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
                defaultValue={props.requestedQuantity}
              />
            </label>
            <button className="button primary" type="submit">
              Calculate MRP
            </button>
          </form>
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
        </div>
      }
    >
      {!props.rows.length ? (
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
              {props.rows.map((row) => (
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
                <td>{props.summary.quantityPerProduct}</td>
                <td>-</td>
                <td>{props.summary.safetyStock}</td>
                <td>{props.summary.maxLeadTime ?? "-"}</td>
                <td>-</td>
                <td>{props.summary.grossRequirement}</td>
                <td>{props.summary.grossCost.toFixed(4)}</td>
                <td>{props.summary.availableInventory}</td>
                <td>{props.summary.netRequirement}</td>
                <td>{props.summary.netCost.toFixed(4)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </Panel>
  );
}
