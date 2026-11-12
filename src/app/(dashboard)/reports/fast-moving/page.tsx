import { prisma } from "@/lib/db";
import { FastMovingClient } from "./client";

export const dynamic = "force-dynamic";

export default async function FastMovingPage() {
  const products = await prisma.product.findMany({
    where: { isActive: true },
    include: {
      category: true,
      baseUnit: true,
      saleItems: true,
      batches: {
        where: { qtyRemaining: { gt: 0 } },
      },
    },
  });

  const ranked = products
    .map((p) => {
      const totalQtySold = p.saleItems.reduce(
        (sum, item) => sum + Number(item.qtyBase),
        0
      );
      const totalRevenue = p.saleItems.reduce(
        (sum, item) => sum + Number(item.subtotal),
        0
      );
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
        totalQtySold: Math.round(totalQtySold * 10) / 10,
        totalRevenue: Math.round(totalRevenue),
        currentStock,
        needsReorder: currentStock < 10,
      };
    })
    .sort((a, b) => b.totalQtySold - a.totalQtySold);

  return <FastMovingClient items={JSON.parse(JSON.stringify(ranked))} />;
}

