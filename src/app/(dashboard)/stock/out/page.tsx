import { prisma } from "@/lib/db";
import { StockOutClient } from "./client";

export const dynamic = "force-dynamic";

export default async function StockOutPage() {
  const [movements, products] = await Promise.all([
    prisma.stockMovement.findMany({
      where: {
        qtyBase: { lt: 0 },
      },
      orderBy: { createdAt: "desc" },
      include: {
        product: {
          include: {
            baseUnit: true,
            batches: {
              where: { qtyRemaining: { gt: 0 } },
            },
          },
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
        batches: {
          where: { qtyRemaining: { gt: 0 } },
        },
      },
    }),
  ]);

  return (
    <StockOutClient
      movements={JSON.parse(JSON.stringify(movements))}
      products={JSON.parse(JSON.stringify(products))}
    />
  );
}

