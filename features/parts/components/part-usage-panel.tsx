import type { ComponentDetail } from "@/lib/types/domain";
import { EmptyState, Panel } from "@/shared/ui";

export function PartUsagePanel(props: { part: ComponentDetail | null }) {
  const { part } = props;

  return (
    <Panel title="Used in versions" description="Where this component appears in BOM references.">
      {part?.references.length ? (
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
              {part.references.map((reference) => (
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
  );
}
