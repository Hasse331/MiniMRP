import { ProductionListPanel } from "@/features/production/components/production-list-panel";
import { getProductionOverview } from "@/lib/supabase/queries/index";
import { Notice, PageHeader } from "@/shared/ui";

export default async function ProductionPage() {
  const { items, error } = await getProductionOverview();

  return (
    <div className="page">
      <PageHeader
        title="Production"
        description="Versions currently under production with quantity, lead time, and MRP shortcuts."
      />

      {error ? <Notice error>{error}</Notice> : null}
      <ProductionListPanel items={items} />
    </div>
  );
}
