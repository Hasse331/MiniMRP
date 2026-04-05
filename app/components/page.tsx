import Link from "next/link";
import { ModalTrigger } from "@/components/modal-trigger";
import { EmptyState, Notice, PageHeader, Panel } from "@/components/ui";
import { createComponentAction, updateDefaultSafetyStockAction } from "@/lib/supabase/actions";
import { ImportPreview } from "@/features/import/import-preview";
import { getAppSettings, getComponents } from "@/lib/supabase/queries";

export default async function ComponentsPage(props: {
  searchParams?: Promise<{ category?: string; search?: string }>;
}) {
  const searchParams = (await props.searchParams) ?? {};
  const { items, error } = await getComponents({
    category: searchParams.category,
    search: searchParams.search
  });
  const { item: settings } = await getAppSettings();

  return (
    <div className="page">
      <PageHeader
        title="Components"
        description="Central component view with filters, categorization, import and export entry points."
        actions={
          <>
            <a
              className="button-link subtle"
              href={`/api/export/components?category=${encodeURIComponent(searchParams.category ?? "")}&search=${encodeURIComponent(searchParams.search ?? "")}`}
            >
              Export CSV
            </a>
            <ModalTrigger buttonLabel="Import CSV" title="Import components from CSV or Excel">
              <ImportPreview
                plain
                title="Import components from CSV or Excel"
                description="Bulk import entry point for component master data."
                mappingHint="Next implementation step is adding field mapping UI and insert/update logic for components, sellers, and inventory rows."
              />
            </ModalTrigger>
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
                    defaultValue={settings?.default_safety_stock ?? 25}
                  />
                </div>
                <button className="button primary" type="submit">
                  Save settings
                </button>
              </form>
            </ModalTrigger>
          </>
        }
      />

      {error ? <Notice error>{error}</Notice> : null}

      <Panel
        title="Filters"
        description="Filter the component list and use the same filter state for export."
      >
        <div className="toolbar">
          <form>
            <input
              className="input"
              type="text"
              name="search"
              placeholder="Search by name, producer, value"
              defaultValue={searchParams.search ?? ""}
            />
            <input
              className="input"
              type="text"
              name="category"
              placeholder="Category"
              defaultValue={searchParams.category ?? ""}
            />
            <button className="button subtle" type="submit">
              Apply filters
            </button>
          </form>
        </div>
      </Panel>

      <Panel
        title="All components"
        description="Grouped by simple category field from the schema."
        actions={
          <ModalTrigger buttonLabel="Add component" buttonClassName="button primary" title="Add component">
            <form action={createComponentAction} className="stack">
              <div className="toolbar">
                <input className="input" name="name" placeholder="Component name" />
                <input className="input" name="category" placeholder="Category" />
                <input className="input" name="producer" placeholder="Producer" />
                <input className="input" name="value" placeholder="Value" />
              </div>
              <div className="toolbar">
                <input className="input" name="seller_name" placeholder="Seller name (optional)" />
                <input className="input" name="base_url" placeholder="Base URL (optional)" />
                <input className="input" name="update_link" placeholder="Exact product URL (optional)" />
              </div>
              <button className="button primary" type="submit">
                Add component
              </button>
            </form>
          </ModalTrigger>
        }
      >
        {items.length === 0 ? (
          <EmptyState>No components found.</EmptyState>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Category</th>
                  <th>Producer</th>
                  <th>Value</th>
                  <th>Safety stock</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.map((component) => (
                  <tr key={component.id}>
                    <td>{component.name}</td>
                    <td>{component.category}</td>
                    <td>{component.producer}</td>
                    <td>{component.value ?? "-"}</td>
                    <td>{component.safety_stock}</td>
                    <td>
                      <div className="action-row">
                        <Link className="button-link subtle" href={`/components/${component.id}`}>
                          Open
                        </Link>
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
