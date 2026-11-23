import { prisma } from "@/lib/db";
import { SalesReportClient } from "./client";

export const dynamic = "force-dynamic";

/** Kunci tanggal lokal (YYYY-MM-DD) agar konsisten dengan filter di client. */
function dateKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
    2,
    "0"
  )}-${String(date.getDate()).padStart(2, "0")}`;
}

export default async function SalesReportPage() {
  const sales = await prisma.sale.findMany({
    where: { paymentStatus: { not: "CANCELLED" } },
    orderBy: { date: "desc" },
    include: {
      customer: true,
      items: {
        include: {
          allocations: true,
        },
      },
    },
  });

  const records = sales.map((sale) => {
    const saleSubtotal = Number(sale.subtotal);
    const saleDiscount = Number(sale.discountAmount);

    // Diskon faktur dialokasikan proporsional ke tiap item, lalu dikurangi
    // HPP FIFO untuk mendapat laba kotor faktur (di luar pajak).
    const grossProfit = sale.items.reduce((sum, item) => {
      const itemRevenue = Number(item.subtotal);
      const itemDiscount =
        saleSubtotal > 0 ? (itemRevenue / saleSubtotal) * saleDiscount : 0;
      const cogs = item.allocations.reduce(
        (total, allocation) =>
          total +
          Number(allocation.qtyBase) * Number(allocation.costPerBase),
        0
      );
      return sum + (itemRevenue - itemDiscount - cogs);
    }, 0);

    return {
      id: sale.id,
      invoiceNo: sale.invoiceNo,
      date: sale.date.toISOString(),
      discountAmount: saleDiscount,
      total: Number(sale.total),
      customerName: sale.customer?.name ?? "Umum",
      grossProfit: Math.round(grossProfit),
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
    <SalesReportClient
      records={records}
      defaultFrom={defaultFrom}
      defaultTo={defaultTo}
    />
  );
}
