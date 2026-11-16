import { prisma } from "@/lib/db";
import { ProfitReportClient } from "./client";

export const dynamic = "force-dynamic";

/** Kunci tanggal lokal (YYYY-MM-DD) agar konsisten dengan filter di client. */
function dateKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
    2,
    "0"
  )}-${String(date.getDate()).padStart(2, "0")}`;
}

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

  const now = new Date();
  const defaultTo = dateKey(now);
  // Default tampilkan seluruh data yang ada; kalau kosong, mulai awal bulan.
  const defaultFrom =
    records.length > 0
      ? dateKey(new Date(records[records.length - 1].date))
      : dateKey(new Date(now.getFullYear(), now.getMonth(), 1));

  return (
    <ProfitReportClient
      records={JSON.parse(JSON.stringify(records))}
      defaultFrom={defaultFrom}
      defaultTo={defaultTo}
    />
  );
}

