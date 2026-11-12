import { prisma } from "@/lib/db";
import { SlowMovingClient } from "./client";

export const dynamic = "force-dynamic";

export default async function SlowMovingPage() {
  const [products, categories] = await Promise.all([
    prisma.product.findMany({
      where: { isActive: true },
      include: {
        category: true,
        baseUnit: true,
        batches: {
          where: { qtyRemaining: { gt: 0 } },
          orderBy: { receivedAt: "asc" },
        },
        saleItems: {
          include: {
            sale: {
              select: { date: true, createdAt: true },
            },
          },
        },
      },
    }),
    prisma.category.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
  ]);

  const items = products.map((p) => {
    // Total unit sold in base units
    const totalQtySold = p.saleItems.reduce(
      (sum, item) => sum + Number(item.qtyBase),
      0
    );
    const totalRevenue = p.saleItems.reduce(
      (sum, item) => sum + Number(item.subtotal),
      0
    );
    // Current stock remaining across active batches
    const currentStock = p.batches.reduce(
      (sum, b) => sum + Number(b.qtyRemaining),
      0
    );
    // Active batch cost per base (FIFO)
    const activeBatch = p.batches[0];
    const costPerBase = activeBatch ? Number(activeBatch.costPerBase) : 0;
    const assetValue = Math.round(currentStock * costPerBase);

    // Latest sale date
    let lastSoldAt: string | null = null;
    if (p.saleItems.length > 0) {
      const dates = p.saleItems
        .map((item) => new Date(item.sale.date || item.sale.createdAt).getTime())
        .sort((a, b) => b - a);
      if (dates.length > 0) {
        lastSoldAt = new Date(dates[0]).toISOString();
      }
    }

    // Status classification:
    // DEAD_STOCK: 0 sold, has stock
    // VERY_SLOW: <= 3 sold
    // SLOW: 4 to 8 sold
    // NORMAL: > 8 sold
    let status: "DEAD_STOCK" | "VERY_SLOW" | "SLOW" | "NORMAL" = "NORMAL";
    if (totalQtySold === 0) {
      status = "DEAD_STOCK";
    } else if (totalQtySold <= 3) {
      status = "VERY_SLOW";
    } else if (totalQtySold <= 8) {
      status = "SLOW";
    }

    return {
      id: p.id,
      code: p.code,
      name: p.name,
      categoryId: p.categoryId,
      categoryName: p.category.name,
      unitCode: p.baseUnit.code,
      totalQtySold: Math.round(totalQtySold * 10) / 10,
      totalRevenue: Math.round(totalRevenue),
      currentStock,
      costPerBase,
      assetValue,
      lastSoldAt,
      status,
    };
  });

  // Sort by lowest sales first, then highest idle asset value
  const sorted = items.sort((a, b) => {
    if (a.totalQtySold !== b.totalQtySold) {
      return a.totalQtySold - b.totalQtySold;
    }
    return b.assetValue - a.assetValue;
  });

  return (
    <SlowMovingClient
      items={JSON.parse(JSON.stringify(sorted))}
      categories={JSON.parse(JSON.stringify(categories))}
    />
  );
}

