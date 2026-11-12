import { prisma } from "@/lib/db";
import { PurchasesClient } from "./client";

export const dynamic = "force-dynamic";

export default async function PurchasesPage() {
  const [purchases, suppliers, products, units] = await Promise.all([
    prisma.purchase.findMany({
      orderBy: { date: "desc" },
      include: {
        supplier: true,
        items: {
          include: {
            product: { include: { baseUnit: true } },
            unit: true,
            batch: true,
          },
        },
      },
    }),
    prisma.supplier.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true, phone: true },
    }),
    prisma.product.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
      include: {
        baseUnit: true,
        units: { include: { unit: true } },
      },
    }),
    prisma.unit.findMany({
      orderBy: { name: "asc" },
    }),
  ]);

  return (
    <PurchasesClient
      purchases={JSON.parse(JSON.stringify(purchases))}
      suppliers={JSON.parse(JSON.stringify(suppliers))}
      products={JSON.parse(JSON.stringify(products))}
      units={JSON.parse(JSON.stringify(units))}
    />
  );
}

