import { prisma } from "@/lib/db";
import { StockReportClient } from "./client";

export const dynamic = "force-dynamic";

export default async function StockReportPage() {
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
      },
      orderBy: { name: "asc" },
    }),
    prisma.category.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
  ]);

  const items = products.map((p) => {
    const totalStock = p.batches.reduce(
      (sum, b) => sum + Number(b.qtyRemaining),
      0
    );
    const activeBatch = p.batches[0];
    const costPerBase = activeBatch ? Number(activeBatch.costPerBase) : 0;
    const assetValue = Math.round(totalStock * costPerBase);
    const margin = p.marginPercent
      ? Number(p.marginPercent)
      : Number(p.category.defaultMarginPercent);
    const estimatedSellPrice =
      costPerBase > 0 ? Math.round(costPerBase * (1 + margin / 100)) : 0;

    return {
      id: p.id,
      code: p.code,
      name: p.name,
      categoryId: p.categoryId,
      categoryName: p.category.name,
      unitCode: p.baseUnit.code,
      totalStock,
      costPerBase,
      assetValue,
      margin,
      estimatedSellPrice,
      isCritical: totalStock < 5,
    };
  });

  return (
    <StockReportClient
      items={JSON.parse(JSON.stringify(items))}
      categories={JSON.parse(JSON.stringify(categories))}
    />
  );
}

