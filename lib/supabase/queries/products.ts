import { unstable_noStore as noStore } from "next/cache";
import type { Product, ProductDetail, ProductListItem, ProductVersion } from "@/lib/types/domain";
import { createSupabaseClient } from "../client";
import { safeSelect } from "./shared";

export async function getProductList(): Promise<{ items: ProductListItem[]; error: string | null }> {
  noStore();
  const supabase = createSupabaseClient();
  const productsResult = await safeSelect<Product>(
    supabase.from("products").select("id,name,image").order("name")
  );
  const versionsResult = await safeSelect<ProductVersion>(
    supabase.from("product_versions").select("id,product_id,version_number")
  );

  const items = productsResult.data.map((product) => ({
    ...product,
    versionCount: versionsResult.data.filter((version) => version.product_id === product.id).length
  }));

  return {
    items,
    error: productsResult.error ?? versionsResult.error
  };
}

export async function getProductDetail(id: string): Promise<{ item: ProductDetail | null; error: string | null }> {
  noStore();
  const supabase = createSupabaseClient();
  const productResult = await supabase
    .from("products")
    .select("id,name,image")
    .eq("id", id)
    .maybeSingle<Product>();

  if (productResult.error) {
    return { item: null, error: productResult.error.message };
  }

  if (!productResult.data) {
    return { item: null, error: null };
  }

  const versionsResult = await safeSelect<ProductVersion>(
    supabase
      .from("product_versions")
      .select("id,product_id,version_number")
      .eq("product_id", id)
      .order("version_number")
  );

  return {
    item: {
      ...productResult.data,
      versions: versionsResult.data
    },
    error: versionsResult.error
  };
}
