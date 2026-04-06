import Link from "next/link";
import { EmptyState, Notice, PageHeader, Panel } from "@/components/ui";
import { getProductionOverview } from "@/lib/supabase/queries";

export default async function ProductionPage() {
  const { items, error } = await getProductionOverview();

  return (
    <div className="page">
      <PageHeader
        title="Production"
        description="Versions currently under production with quantity, lead time, and MRP shortcuts."
      />

      {error ? <Notice error>{error}</Notice> : null}

      <Panel
        title="Under production"
        description="Each row stores a version and quantity currently planned or in progress."
      >
        {items.length === 0 ? (
          <EmptyState>No versions are currently under production.</EmptyState>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Version</th>
                  <th>Qty</th>
                  <th>Longest lead time</th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id}>
                    <td>{item.product?.name ?? "-"}</td>
                    <td>{item.version?.version_number ?? "-"}</td>
                    <td>{item.quantity}</td>
                    <td>{item.longest_lead_time ?? "-"}</td>
                    <td>{new Date(item.created_at).toLocaleString()}</td>
                    <td>
                      <div className="action-row">
                        <Link className="button-link subtle" href={`/versions/${item.version_id}?quantity=${item.quantity}`}>
                          Open
                        </Link>
                        <a className="button-link subtle" href={`/api/export/mrp/${item.version_id}?quantity=${item.quantity}`}>
                          Export MRP
                        </a>
                      </div>
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
