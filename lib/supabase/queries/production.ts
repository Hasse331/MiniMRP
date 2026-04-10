import { unstable_noStore as noStore } from "next/cache";
import type { Product, ProductVersion, ProductionEntry, ProductionListItem } from "@/lib/types/domain";
import { buildMrpRows, calculateProductionLongestLeadTime } from "@/lib/mappers/mrp";
import { createSupabaseAdminClient } from "../admin-client";
import { createSupabaseClient } from "../client";
import { PRIVATE_SCHEMA, PRODUCT_VERSIONS_TABLE } from "../table-names";
import { safeSelect } from "./shared";
import { getVersionDetail } from "./versions";

export async function getProductionOverview(): Promise<{
  underProduction: ProductionListItem[];
  completed: ProductionListItem[];
  error: string | null;
}> {
  noStore();
  const supabase = await createSupabaseClient();
  const adminSupabase = createSupabaseAdminClient();
  const [entriesResult, versionsResult, productsResult] = await Promise.all([
    safeSelect<ProductionEntry>(
      supabase
        .from("production_entries")
        .select("id,version_id,quantity,status,completed_at,created_at")
        .order("created_at", { ascending: false })
    ),
    safeSelect<ProductVersion>(
      adminSupabase.schema(PRIVATE_SCHEMA).from(PRODUCT_VERSIONS_TABLE).select("id,product_id,version_number")
    ),
    safeSelect<Product>(
      supabase.from("products").select("id,name,image")
    )
  ]);

  const versionMap = new Map(versionsResult.data.map((version) => [version.id, version]));
  const productMap = new Map(productsResult.data.map((product) => [product.id, product]));

  const items = await Promise.all(
    entriesResult.data.map(async (entry) => {
      const version = versionMap.get(entry.version_id) ?? null;
      const product = version ? productMap.get(version.product_id) ?? null : null;
      const versionDetail = await getVersionDetail(entry.version_id);
      const mrpRows = buildMrpRows(versionDetail.item?.components ?? [], entry.quantity);
      const longestLeadTime = calculateProductionLongestLeadTime(mrpRows);

      return {
        ...entry,
        version,
        product,
        longest_lead_time: longestLeadTime || null
      };
    })
  );

  return {
    underProduction: items.filter((item) => item.status === "under_production"),
    completed: items.filter((item) => item.status === "completed"),
    error: entriesResult.error ?? versionsResult.error ?? productsResult.error
  };
}
