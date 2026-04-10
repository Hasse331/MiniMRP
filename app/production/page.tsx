import { ProductionListPanel } from "@/features/production/components/production-list-panel";
import { getProductionOverview } from "@/lib/supabase/queries/index";
import { Notice, PageHeader } from "@/shared/ui";

export default async function ProductionPage(props: {
  searchParams?: Promise<{ error?: string }>;
}) {
  const searchParams = (await props.searchParams) ?? {};
  const { underProduction, completed, error } = await getProductionOverview();
  const pageError = searchParams.error;

  return (
    <div className="page">
      <PageHeader
        title="Production"
        description="Versions currently under production with quantity, lead time, and MRP shortcuts."
      />

      {pageError ? <Notice error>{pageError}</Notice> : null}
      {error ? <Notice error>{error}</Notice> : null}
      <ProductionListPanel
        items={underProduction}
        title="Under production"
        description="Each row stores a version and quantity currently planned or in progress."
      />
      <ProductionListPanel
        items={completed}
        title="Completed production"
        description="Production entries that have been marked ready."
        completed
      />
    </div>
  );
}
