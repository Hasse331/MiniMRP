import Link from "next/link";
import { Badge, EmptyState, Notice, PageHeader, Panel } from "@/shared/ui";
import { getProductList } from "@/lib/supabase/queries/index";

export default async function ProductsPage() {
  const { items, error } = await getProductList();

  return (
    <div className="page">
      <PageHeader
        title="Products"
        description="List of products. Open a product to view its image, basic information, and version list."
      />

      {error ? (
        <Notice error>
          Supabase query failed. Check that the `supabase/production/` SQL files were applied to this
          project and that the signed-in user has the `admin` role.
          <br />
          <br />
          Error: {error}
        </Notice>
      ) : null}

      <Panel title="All products" description="Tailored product list for daily internal use.">
        {items.length === 0 ? (
          <EmptyState>No products found yet.</EmptyState>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Versions</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {items.map((product) => (
                  <tr key={product.id}>
                    <td>
                      <strong>{product.name}</strong>
                    </td>
                    <td>
                      <Badge>{product.versionCount} versions</Badge>
                    </td>
                    <td>
                      <Link className="button-link subtle" href={`/products/${product.id}`}>
                        Open
                      </Link>
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
