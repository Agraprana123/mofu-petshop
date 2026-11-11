import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import { BackupClient } from "./client";

export const dynamic = "force-dynamic";

export default async function SettingsBackupPage() {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    redirect("/");
  }

  // Ambil ringkasan jumlah data di database
  const [
    totalProducts,
    totalSales,
    totalPurchases,
    totalCustomers,
    totalSuppliers,
    totalBatches,
    totalMovements,
    totalUsers,
  ] = await Promise.all([
    prisma.product.count(),
    prisma.sale.count(),
    prisma.purchase.count(),
    prisma.customer.count(),
    prisma.supplier.count(),
    prisma.stockBatch.count(),
    prisma.stockMovement.count(),
    prisma.user.count(),
  ]);

  const stats = {
    totalProducts,
    totalSales,
    totalPurchases,
    totalCustomers,
    totalSuppliers,
    totalBatches,
    totalMovements,
    totalUsers,
  };

  return <BackupClient stats={stats} />;
}

