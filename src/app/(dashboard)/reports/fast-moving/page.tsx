import { prisma } from "@/lib/db";
import { FastMovingClient } from "./client";

export const dynamic = "force-dynamic";

/** Kunci tanggal lokal (YYYY-MM-DD) agar konsisten dengan filter di client. */
function dateKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
    2,
    "0"
  )}-${String(date.getDate()).padStart(2, "0")}`;
}

export default async function FastMovingPage() {
  const products = await prisma.product.findMany({
    where: { isActive: true },
    include: {
      category: true,
      baseUnit: true,
      saleItems: {
        where: { sale: { paymentStatus: { not: "CANCELLED" } } },
        select: {
          qtyBase: true,
          subtotal: true,
          sale: { select: { date: true } },
        },
      },
      batches: {
        where: { qtyRemaining: { gt: 0 } },
      },
    },
  });

  const ranked = products.map((p) => {
    // Rekap penjualan per tanggal agar filter periode bisa dihitung di client.
    const daily = new Map<string, { qty: number; revenue: number }>();
    for (const item of p.saleItems) {
      const key = dateKey(item.sale.date);
      const current = daily.get(key) ?? { qty: 0, revenue: 0 };
      current.qty += Number(item.qtyBase);
      current.revenue += Number(item.subtotal);
      daily.set(key, current);
    }

    const currentStock = p.batches.reduce(
      (sum, b) => sum + Number(b.qtyRemaining),
      0
    );

    return {
      id: p.id,
      code: p.code,
      name: p.name,
      categoryName: p.category.name,
      unitCode: p.baseUnit.code,
      currentStock,
      needsReorder: currentStock < 10,
      dailySales: Array.from(daily.entries())
        .map(([date, value]) => ({
          date,
          qty: Math.round(value.qty * 10) / 10,
          revenue: Math.round(value.revenue),
        }))
        .sort((a, b) => a.date.localeCompare(b.date)),
    };
  });

  return <FastMovingClient items={JSON.parse(JSON.stringify(ranked))} />;
}
