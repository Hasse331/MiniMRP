import { unstable_noStore as noStore } from "next/cache";
import type { Product, ProductDetail, ProductListItem, ProductVersion } from "@/lib/types/domain";
import { PRODUCT_IMAGES_BUCKET, resolveStoredFileUrl } from "../storage";
import { createSupabaseAdminClient } from "../admin-client";
import { createSupabaseClient } from "../client";
import { PRIVATE_SCHEMA, PRODUCT_VERSIONS_TABLE } from "../table-names";
import { safeSelect } from "./shared";

export async function getProductList(): Promise<{ items: ProductListItem[]; error: string | null }> {
  noStore();
  const supabase = await createSupabaseClient();
  const adminSupabase = createSupabaseAdminClient();
  const productsResult = await safeSelect<{ id: string; name: string; image: string | null }>(
    supabase.from("products").select("id,name,image").order("name")
  );
  const versionsResult = await safeSelect<ProductVersion>(
    adminSupabase.schema(PRIVATE_SCHEMA).from(PRODUCT_VERSIONS_TABLE).select("id,product_id,version_number")
  );

  const error = productsResult.error ?? versionsResult.error;
  if (error) {
    return {
      items: [],
      error
    };
  }

  try {
    const items = await Promise.all(
      productsResult.data.map(async (product) => ({
        id: product.id,
        name: product.name,
        image: await resolveStoredFileUrl(adminSupabase, PRODUCT_IMAGES_BUCKET, product.image),
        image_path: product.image,
        versionCount: versionsResult.data.filter((version) => version.product_id === product.id).length
      }))
    );

    return {
      items,
      error: null
    };
  } catch (reason) {
    return {
      items: [],
      error: reason instanceof Error ? reason.message : "Could not resolve product images."
    };
  }
}

export async function getProductDetail(id: string): Promise<{ item: ProductDetail | null; error: string | null }> {
  noStore();
  const supabase = await createSupabaseClient();
  const adminSupabase = createSupabaseAdminClient();
  const productResult = await supabase
    .from("products")
    .select("id,name,image")
    .eq("id", id)
    .maybeSingle<{ id: string; name: string; image: string | null }>();

  if (productResult.error) {
    return { item: null, error: productResult.error.message };
  }

  if (!productResult.data) {
    return { item: null, error: null };
  }

  const versionsResult = await safeSelect<ProductVersion>(
    adminSupabase
      .schema(PRIVATE_SCHEMA)
      .from(PRODUCT_VERSIONS_TABLE)
      .select("id,product_id,version_number")
      .eq("product_id", id)
      .order("version_number")
  );

  if (versionsResult.error) {
    return {
      item: null,
      error: versionsResult.error
    };
  }

  try {
    return {
      item: {
        id: productResult.data.id,
        name: productResult.data.name,
        image: await resolveStoredFileUrl(adminSupabase, PRODUCT_IMAGES_BUCKET, productResult.data.image),
        image_path: productResult.data.image,
        versions: versionsResult.data
      },
      error: null
    };
  } catch (reason) {
    return {
      item: null,
      error: reason instanceof Error ? reason.message : "Could not resolve the product image."
    };
  }
}
