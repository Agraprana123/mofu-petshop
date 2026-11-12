import { prisma } from "@/lib/db";
import { LowStockClient } from "./client";

export const dynamic = "force-dynamic";

export default async function LowStockPage() {
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
        purchaseItems: {
          take: 1,
          orderBy: { id: "desc" },
          include: {
            purchase: {
              include: {
                supplier: true,
              },
            },
          },
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
    const currentStock = p.batches.reduce(
      (sum, b) => sum + Number(b.qtyRemaining),
      0
    );

    const minStock = 5; // Batas stok minimum standar aman
    const deficit = Math.max(0, minStock - currentStock);

    // Modal per base (ambil dari batch tertua yang aktif, atau dari pembelian terakhir)
    const activeBatch = p.batches[0];
    const lastPurchase = p.purchaseItems[0];
    const costPerBase = activeBatch
      ? Number(activeBatch.costPerBase)
      : lastPurchase
      ? Number(lastPurchase.costPerBase)
      : 0;

    const estimatedRestockCost = Math.round(deficit * costPerBase);

    const lastSupplier = lastPurchase?.purchase?.supplier
      ? {
          name: lastPurchase.purchase.supplier.name,
          phone: lastPurchase.purchase.supplier.phone,
        }
      : null;

    let status: "OUT_OF_STOCK" | "CRITICAL" | "LOW" | "SAFE" = "SAFE";
    if (currentStock === 0) {
      status = "OUT_OF_STOCK";
    } else if (currentStock <= 2) {
      status = "CRITICAL";
    } else if (currentStock <= 5) {
      status = "LOW";
    }

    return {
      id: p.id,
      code: p.code,
      name: p.name,
      categoryId: p.categoryId,
      categoryName: p.category.name,
      unitCode: p.baseUnit.code,
      currentStock,
      minStock,
      deficit,
      costPerBase,
      estimatedRestockCost,
      status,
      lastSupplier,
    };
  });

  // Urutkan: stok 0 paling atas, lalu stok terendah, lalu defisit terbesar
  const sorted = items.sort((a, b) => {
    if (a.currentStock !== b.currentStock) {
      return a.currentStock - b.currentStock;
    }
    return b.deficit - a.deficit;
  });

  return (
    <LowStockClient
      items={JSON.parse(JSON.stringify(sorted))}
      categories={JSON.parse(JSON.stringify(categories))}
    />
  );
}

