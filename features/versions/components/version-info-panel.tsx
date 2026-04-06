import type { VersionDetail } from "@/lib/types/domain";
import { Panel } from "@/shared/ui";

export function VersionInfoPanel(props: {
  version: VersionDetail | null;
  unitCost: number;
}) {
  const { version, unitCost } = props;

  return (
    <Panel title="Version info" description="Basic version-specific information.">
      <div className="detail-list">
        <div className="detail-item">
          <span>Product</span>
          <strong>{version?.product?.name ?? "-"}</strong>
        </div>
        <div className="detail-item">
          <span>Version</span>
          <strong>{version?.version_number ?? "-"}</strong>
        </div>
        <div className="detail-item">
          <span>BOM rows</span>
          <strong>{version?.references.length ?? 0}</strong>
        </div>
        <div className="detail-item">
          <span>One unit component cost</span>
          <strong>{unitCost.toFixed(4)}</strong>
        </div>
        <div className="detail-item">
          <span>Active production entries</span>
          <strong>{version?.active_production_count ?? 0}</strong>
        </div>
        <div className="detail-item">
          <span>Reserved production qty</span>
          <strong>{version?.active_production_quantity ?? 0}</strong>
        </div>
      </div>
    </Panel>
  );
}
