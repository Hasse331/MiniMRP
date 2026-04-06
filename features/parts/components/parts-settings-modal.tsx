import type { AppSettings } from "@/lib/types/domain";
import { updateDefaultSafetyStockAction } from "@/lib/supabase/actions/index";
import { ModalTrigger } from "@/shared/ui";

export function PartsSettingsModal(props: { settings: AppSettings | null }) {
  return (
    <ModalTrigger buttonLabel="Settings" title="Component settings">
      <form action={updateDefaultSafetyStockAction} className="stack">
        <div className="field-group">
          <label htmlFor="default-safety-stock">Default safety stock</label>
          <input
            id="default-safety-stock"
            className="input"
            type="number"
            min="0"
            step="1"
            name="default_safety_stock"
            defaultValue={props.settings?.default_safety_stock ?? 25}
          />
        </div>
        <button className="button primary" type="submit">
          Save settings
        </button>
      </form>
    </ModalTrigger>
  );
}
