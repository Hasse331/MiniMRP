import { NextResponse } from "next/server";
import { rowsToCsv } from "@/lib/mappers/export";
import { buildMrpRows, summarizeMrpRows } from "@/lib/mappers/mrp";
import { getVersionById } from "@/lib/supabase/queries";

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  const params = await context.params;
  const { searchParams } = new URL(request.url);
  const buildQuantity = Math.max(Number(searchParams.get("quantity") ?? "1") || 1, 1);
  const { item } = await getVersionById(params.id);
  const rows = buildMrpRows(item?.components ?? [], buildQuantity);
  const summary = summarizeMrpRows(rows);

  const csv = rowsToCsv(
    [
      ...rows.map((row) => ({
        component: row.componentName,
        category: row.category,
      producer: row.producer,
      references: row.references.join(", "),
      qty_per_product: row.quantityPerProduct,
      build_quantity: row.buildQuantity,
      safety_stock: row.safetyStock,
      lead_time: row.leadTime,
      unit_price: row.unitPrice,
      gross_requirement: row.grossRequirement,
        gross_cost: row.grossCost,
        available_inventory: row.availableInventory,
        net_requirement: row.netRequirement,
        net_cost: row.netCost
      })),
      {
        component: "Total",
        category: null,
        producer: null,
        references: null,
        qty_per_product: summary.quantityPerProduct,
        build_quantity: null,
        safety_stock: summary.safetyStock,
        lead_time: summary.maxLeadTime,
        unit_price: null,
        gross_requirement: summary.grossRequirement,
        gross_cost: summary.grossCost,
        available_inventory: summary.availableInventory,
        net_requirement: summary.netRequirement,
        net_cost: summary.netCost
      }
    ]
  );

  return new NextResponse(csv, {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="mrp-${params.id}.csv"`
    }
  });
}
