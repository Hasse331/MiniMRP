"use client";

import { useState } from "react";
import { adjustInventoryDeltaAction } from "@/lib/supabase/actions/index";
import { updatePartSafetyStockAction } from "@/lib/supabase/actions/index";

export function InventoryEditForm(props: {
  inventoryId: string;
  componentId: string;
  componentName: string;
  currentQuantity: number;
  currentSafetyStock: number;
}) {
  const [mode, setMode] = useState<"inventory" | "safety_stock">("inventory");

  return (
    <div className="stack">
      <div className="field-group">
        <label htmlFor={`inventory-edit-mode-${props.inventoryId}`}>Action</label>
        <select
          id={`inventory-edit-mode-${props.inventoryId}`}
          className="select"
          value={mode}
          onChange={(event) => setMode(event.target.value as "inventory" | "safety_stock")}
        >
          <option value="inventory">Inventory update</option>
          <option value="safety_stock">Safety stock update</option>
        </select>
      </div>

      {mode === "inventory" ? (
        <form action={adjustInventoryDeltaAction} className="stack">
          <input type="hidden" name="component_id" value={props.componentId} />
          <input type="hidden" name="current_quantity" value={props.currentQuantity} />
          <div className="small muted">Current quantity: {props.currentQuantity}</div>
          <div className="field-group">
            <label htmlFor={`inventory-mode-${props.inventoryId}`}>Inventory action</label>
            <select id={`inventory-mode-${props.inventoryId}`} className="select" name="mode" defaultValue="add">
              <option value="add">Add</option>
              <option value="remove">Remove</option>
            </select>
          </div>
          <div className="field-group">
            <label htmlFor={`inventory-amount-${props.inventoryId}`}>Amount</label>
            <input
              id={`inventory-amount-${props.inventoryId}`}
              className="input"
              type="number"
              min="0"
              step="1"
              name="amount"
              placeholder="Enter quantity"
            />
          </div>
          <button className="button primary" type="submit">
            Update inventory
          </button>
        </form>
      ) : (
        <form action={updatePartSafetyStockAction} className="stack">
          <input type="hidden" name="id" value={props.componentId} />
          <input type="hidden" name="returnTo" value="/inventory" />
          <div className="small muted">Component: {props.componentName}</div>
          <div className="field-group">
            <label htmlFor={`safety-stock-${props.inventoryId}`}>Safety stock</label>
            <input
              id={`safety-stock-${props.inventoryId}`}
              className="input"
              type="number"
              min="0"
              step="1"
              name="safety_stock"
              defaultValue={props.currentSafetyStock}
            />
          </div>
          <button className="button primary" type="submit">
            Update safety stock
          </button>
        </form>
      )}
    </div>
  );
}
