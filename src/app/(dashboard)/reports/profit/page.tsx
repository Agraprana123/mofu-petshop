import { prisma } from "@/lib/db";
import { ProfitReportClient } from "./client";

export const dynamic = "force-dynamic";

export default async function ProfitReportPage() {
  const saleItems = await prisma.saleItem.findMany({
    orderBy: { sale: { date: "desc" } },
    include: {
      sale: true,
      product: { include: { baseUnit: true } },
      unit: true,
      allocations: true,
    },
  });

  const records = saleItems.map((item) => {
    const revenue = Number(item.subtotal);
    const cogs = item.allocations.reduce(
      (sum, a) => sum + Number(a.qtyBase) * Number(a.costPerBase),
      0
    );
    const grossProfit = revenue - cogs;
    const marginPercent = revenue > 0 ? (grossProfit / revenue) * 100 : 0;

    return {
      id: item.id,
      invoiceNo: item.sale.invoiceNo,
      date: item.sale.date,
      productName: item.product.name,
      productCode: item.product.code,
      unitCode: item.unit.code,
      qty: Number(item.qty),
      revenue,
      cogs: Math.round(cogs),
      grossProfit: Math.round(grossProfit),
      marginPercent: Math.round(marginPercent * 10) / 10,
    };
  });

  return <ProfitReportClient records={JSON.parse(JSON.stringify(records))} />;
}

