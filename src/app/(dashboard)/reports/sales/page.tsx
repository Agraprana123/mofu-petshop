import { prisma } from "@/lib/db";
import { SalesReportClient } from "./client";

export const dynamic = "force-dynamic";

export default async function SalesReportPage() {
  const sales = await prisma.sale.findMany({
    orderBy: { date: "desc" },
    include: {
      customer: true,
      salesman: true,
      items: {
        include: {
          product: true,
          unit: true,
        },
      },
    },
  });

  return <SalesReportClient sales={JSON.parse(JSON.stringify(sales))} />;
}

