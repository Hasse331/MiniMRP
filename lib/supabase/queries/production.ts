import { unstable_noStore as noStore } from "next/cache";
import type { Product, ProductVersion, ProductionEntry, ProductionListItem } from "@/lib/types/domain";
import { createSupabaseClient } from "../client";
import { safeSelect } from "./shared";
import { getVersionDetail } from "./versions";

export async function getProductionOverview(): Promise<{ items: ProductionListItem[]; error: string | null }> {
  noStore();
  const supabase = createSupabaseClient();
  const [entriesResult, versionsResult, productsResult] = await Promise.all([
    safeSelect<ProductionEntry>(
      supabase.from("production_entries").select("id,version_id,quantity,created_at").order("created_at", { ascending: false })
    ),
    safeSelect<ProductVersion>(
      supabase.from("product_versions").select("id,product_id,version_number")
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
      const longestLeadTime = Math.max(
        0,
        ...(versionDetail.item?.components.map((component) => component.lead_time ?? 0) ?? [0])
      );

      return {
        ...entry,
        version,
        product,
        longest_lead_time: longestLeadTime || null
      };
    })
  );

  return {
    items,
    error: entriesResult.error ?? versionsResult.error ?? productsResult.error
  };
}
