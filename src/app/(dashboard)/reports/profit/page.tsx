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
    // Diskon faktur dialokasikan proporsional ke tiap item agar laba bersih akurat.
    const saleSubtotal = Number(item.sale.subtotal);
    const saleDiscount = Number(item.sale.discountAmount);
    const itemRevenue = Number(item.subtotal);
    const itemDiscount =
      saleSubtotal > 0 ? (itemRevenue / saleSubtotal) * saleDiscount : 0;
    const revenue = itemRevenue - itemDiscount;
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

