import { prisma } from "@/lib/db";
import { ReturnsClient } from "./client";

export const dynamic = "force-dynamic";

export default async function ReturnsPage() {
  const [returnMovements, products] = await Promise.all([
    prisma.stockMovement.findMany({
      where: {
        type: { in: ["RETURN_IN", "RETURN_OUT"] },
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
    <ReturnsClient
      returns={JSON.parse(JSON.stringify(returnMovements))}
      products={JSON.parse(JSON.stringify(products))}
    />
  );
}

