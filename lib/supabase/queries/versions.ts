import { unstable_noStore as noStore } from "next/cache";
import type {
  Attachment,
  ComponentMaster,
  ComponentReference,
  InventoryItem,
  Product,
  ProductVersion,
  Seller,
  VersionDetail
} from "@/lib/types/domain";
import { createSupabaseClient } from "../client";
import { safeSelect } from "./shared";

export async function getVersionDetail(id: string): Promise<{ item: VersionDetail | null; error: string | null }> {
  noStore();
  const supabase = createSupabaseClient();
  const versionResult = await supabase
    .from("product_versions")
    .select("id,product_id,version_number")
    .eq("id", id)
    .maybeSingle<ProductVersion>();

  if (versionResult.error) {
    return { item: null, error: versionResult.error.message };
  }

  if (!versionResult.data) {
    return { item: null, error: null };
  }

  const [productResult, attachmentsResult, referencesResult, componentsResult, inventoryResult, linksResult, sellersResult] =
    await Promise.all([
      supabase
        .from("products")
        .select("id,name,image")
        .eq("id", versionResult.data.product_id)
        .maybeSingle<Product>(),
      safeSelect<Attachment>(
        supabase.from("attachments").select("id,version_id,file_path").eq("version_id", id)
      ),
      safeSelect<ComponentReference>(
        supabase
          .from("component_references")
          .select("version_id,component_master_id,reference")
          .eq("version_id", id)
          .order("reference")
      ),
      safeSelect<ComponentMaster>(
        supabase.from("components").select("id,name,category,producer,value,safety_stock")
      ),
      safeSelect<InventoryItem>(
        supabase.from("inventory").select("id,component_id,quantity_available,purchase_price")
      ),
      safeSelect<{ component_id: string; seller_id: string }>(
        supabase.from("component_sellers").select("component_id,seller_id")
      ),
      safeSelect<Seller>(
        supabase.from("sellers").select("id,name,base_url,lead_time")
      )
    ]);

  const componentMap = new Map(componentsResult.data.map((component) => [component.id, component]));
  const inventoryMap = new Map(inventoryResult.data.map((item) => [item.component_id, item]));
  const sellerMap = new Map(sellersResult.data.map((seller) => [seller.id, seller]));
  const leadTimeMap = new Map<string, number | null>();

  for (const link of linksResult.data) {
    const leadTime = sellerMap.get(link.seller_id)?.lead_time ?? null;
    const existing = leadTimeMap.get(link.component_id);
    if (leadTime === null) {
      continue;
    }
    leadTimeMap.set(
      link.component_id,
      existing === null || existing === undefined ? leadTime : Math.min(existing, leadTime)
    );
  }

  const groupedComponents = new Map<
    string,
    { component: ComponentMaster; references: string[]; quantity: number; lead_time: number | null; inventory: InventoryItem | null }
  >();

  for (const reference of referencesResult.data) {
    const component = componentMap.get(reference.component_master_id);
    if (!component) {
      continue;
    }

    const existing = groupedComponents.get(component.id);
    if (existing) {
      existing.references.push(reference.reference);
      existing.quantity += 1;
    } else {
      groupedComponents.set(component.id, {
        component,
        references: [reference.reference],
        quantity: 1,
        lead_time: leadTimeMap.get(component.id) ?? null,
        inventory: inventoryMap.get(component.id) ?? null
      });
    }
  }

  return {
    item: {
      ...versionResult.data,
      product: productResult.data ?? null,
      attachments: attachmentsResult.data,
      references: referencesResult.data.map((reference) => ({
        reference: reference.reference,
        component: componentMap.get(reference.component_master_id) ?? null
      })),
      components: Array.from(groupedComponents.values()).sort((left, right) =>
        left.component.name.localeCompare(right.component.name)
      )
    },
    error:
      productResult.error?.message ??
      attachmentsResult.error ??
      referencesResult.error ??
      componentsResult.error ??
      inventoryResult.error ??
      linksResult.error ??
      sellersResult.error
  };
}
