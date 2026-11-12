import { prisma } from "@/lib/db";
import { StockInClient } from "./client";

export const dynamic = "force-dynamic";

export default async function StockInPage() {
  const [movements, products] = await Promise.all([
    prisma.stockMovement.findMany({
      where: {
        qtyBase: { gt: 0 },
      },
      orderBy: { createdAt: "desc" },
      include: {
        product: {
          include: { baseUnit: true },
        },
        batch: true,
      },
      take: 100,
    }),
    prisma.product.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
      include: {
        baseUnit: true,
      },
    }),
  ]);

  return (
    <StockInClient
      movements={JSON.parse(JSON.stringify(movements))}
      products={JSON.parse(JSON.stringify(products))}
    />
  );
}

