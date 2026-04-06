import { ImportPreview } from "@/features/import/import-preview";
import { InventoryFiltersPanel } from "@/features/inventory/components/inventory-filters-panel";
import { InventoryRowsPanel } from "@/features/inventory/components/inventory-rows-panel";
import { getInventoryOverview, getPartCatalog } from "@/lib/supabase/queries/index";
import { ModalTrigger, Notice, PageHeader } from "@/shared/ui";

export default async function InventoryPage(props: {
  searchParams?: Promise<{ category?: string; search?: string }>;
}) {
  const searchParams = (await props.searchParams) ?? {};
  const { items, error } = await getInventoryOverview({
    category: searchParams.category,
    search: searchParams.search
  });
  const { items: parts } = await getPartCatalog();

  return (
    <div className="page">
      <PageHeader
        title="Inventory"
        description="Inventory view with simple filtering and export."
        actions={
          <>
            <a
              className="button-link subtle"
              href={`/api/export/inventory?category=${encodeURIComponent(searchParams.category ?? "")}&search=${encodeURIComponent(searchParams.search ?? "")}`}
            >
              Export CSV
            </a>
            <ModalTrigger buttonLabel="Import CSV" title="Import inventory from CSV or Excel">
              <ImportPreview
                plain
                title="Import inventory from CSV or Excel"
                description="Bulk inventory import entry point."
                mappingHint="Expected target fields include component match, quantity_available and purchase_price. Next implementation step is persisting inventory rows to Supabase."
              />
            </ModalTrigger>
          </>
        }
      />

      {error ? <Notice error>{error}</Notice> : null}

      <InventoryFiltersPanel
        defaultSearch={searchParams.search}
        defaultCategory={searchParams.category}
      />
      <InventoryRowsPanel items={items} parts={parts} />

    </div>
  );
}
