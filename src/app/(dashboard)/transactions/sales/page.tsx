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

  return (
    <SalesClient
      sales={JSON.parse(JSON.stringify(sales))}
      customers={JSON.parse(JSON.stringify(customers))}
      salesmen={JSON.parse(JSON.stringify(salesmen))}
      products={JSON.parse(JSON.stringify(products))}
    />
  );
}

