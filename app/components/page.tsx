import { ImportPreview } from "@/features/import/import-preview";
import { PartsFiltersPanel } from "@/features/parts/components/parts-filters-panel";
import { PartsListPanel } from "@/features/parts/components/parts-list-panel";
import { PartsSettingsModal } from "@/features/parts/components/parts-settings-modal";
import { getAppSettings, getPartCatalog } from "@/lib/supabase/queries/index";
import { Notice, PageHeader, ModalTrigger } from "@/shared/ui";

export default async function ComponentsPage(props: {
  searchParams?: Promise<{ category?: string; search?: string }>;
}) {
  const searchParams = (await props.searchParams) ?? {};
  const { items, error } = await getPartCatalog({
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
            <PartsSettingsModal settings={settings} />
          </>
        }
      />

      {error ? <Notice error>{error}</Notice> : null}

      <PartsFiltersPanel
        defaultSearch={searchParams.search}
        defaultCategory={searchParams.category}
      />
      <PartsListPanel parts={items} />

    </div>
  );
}
