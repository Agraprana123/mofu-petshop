import { prisma } from "@/lib/db";
import { PurchasesReportClient } from "./client";

export const dynamic = "force-dynamic";

export default async function PurchasesReportPage() {
  const [purchases, suppliers] = await Promise.all([
    prisma.purchase.findMany({
      orderBy: { date: "desc" },
      include: {
        supplier: true,
        items: {
          include: {
            product: true,
            unit: true,
          },
        },
      },
    }),
    prisma.supplier.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
  ]);

  return (
    <PurchasesReportClient
      purchases={JSON.parse(JSON.stringify(purchases))}
      suppliers={JSON.parse(JSON.stringify(suppliers))}
    />
  );
}

