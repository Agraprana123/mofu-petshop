import { prisma } from "@/lib/db";
import { SalesClient } from "./client";

export const dynamic = "force-dynamic";

export default async function SalesPage() {
  const [sales, customers, salesmen, products] = await Promise.all([
    prisma.sale.findMany({
      orderBy: { date: "desc" },
      include: {
        customer: true,
        salesman: true,
        items: {
          include: {
            product: { include: { baseUnit: true } },
            unit: true,
            allocations: {
              include: { batch: true },
            },
          },
        },
      },
    }),
    prisma.customer.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true, phone: true },
    }),
    prisma.salesman.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
    prisma.product.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
      include: {
        category: true,
        baseUnit: true,
        units: { include: { unit: true } },
        batches: {
          where: { qtyRemaining: { gt: 0 } },
          orderBy: { receivedAt: "asc" },
        },
      },
    }),
  ]);

  const productsWithPrices = products.map((p) => {
    const activeBatch = p.batches[0];
    const margin = p.marginPercent ?? p.category.defaultMarginPercent;
    let fallbackSellPrice = 0;
    if (activeBatch) {
      if (Number(activeBatch.sellPricePerBase) > 0) {
        fallbackSellPrice = Number(activeBatch.sellPricePerBase);
      } else if (Number(activeBatch.costPerBase) > 0) {
        fallbackSellPrice = Math.round(
          Number(activeBatch.costPerBase) * (1 + Number(margin) / 100)
        );
      }
    }
    return {
      ...p,
      sellPrice: fallbackSellPrice > 0 ? fallbackSellPrice : null,
    };
  });

  return (
    <SalesClient
      sales={JSON.parse(JSON.stringify(sales))}
      customers={JSON.parse(JSON.stringify(customers))}
      salesmen={JSON.parse(JSON.stringify(salesmen))}
      products={JSON.parse(JSON.stringify(productsWithPrices))}
    />
  );
}

