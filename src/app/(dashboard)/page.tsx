import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import { AdminDashboard } from "@/components/dashboard/admin-dashboard";
import { StaffDashboard } from "@/components/dashboard/staff-dashboard";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  // Today's date range
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date();
  todayEnd.setHours(23, 59, 59, 999);

  // Ambil data ringkasan
  const [
    totalProducts,
    totalSuppliers,
    totalCustomers,
    totalSales,
    totalPurchases,
    todaySales,
    todaySalesCount,
    recentSales,
    lowStockProducts,
    lowStockCount,
  ] = await Promise.all([
    prisma.product.count({ where: { isActive: true } }),
    prisma.supplier.count(),
    prisma.customer.count(),
    prisma.sale.count(),
    prisma.purchase.count(),
    // Penjualan hari ini
    prisma.sale.aggregate({
      _sum: { total: true },
      where: {
        createdAt: { gte: todayStart, lte: todayEnd },
      },
    }),
    prisma.sale.count({
      where: {
        createdAt: { gte: todayStart, lte: todayEnd },
      },
    }),
    prisma.sale.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      include: { customer: true },
    }),
    // Produk dengan stok rendah (total qtyRemaining < 5)
    prisma.$queryRaw<{ product_id: number; name: string; code: string; total_remaining: number; base_unit_code: string }[]>`
      SELECT p.id as product_id, p.name, p.code,
             COALESCE(SUM(sb.qty_remaining), 0)::float as total_remaining,
             u.code as base_unit_code
      FROM products p
      LEFT JOIN stock_batches sb ON sb.product_id = p.id
      LEFT JOIN units u ON u.id = p.base_unit_id
      WHERE p.is_active = true
      GROUP BY p.id, p.name, p.code, u.code
      HAVING COALESCE(SUM(sb.qty_remaining), 0) < 5
      ORDER BY total_remaining ASC
      LIMIT 5
    `,
    // Count total low stock
    prisma.$queryRaw<{ count: number }[]>`
      SELECT COUNT(*)::int as count FROM (
        SELECT p.id
        FROM products p
        LEFT JOIN stock_batches sb ON sb.product_id = p.id
        WHERE p.is_active = true
        GROUP BY p.id
        HAVING COALESCE(SUM(sb.qty_remaining), 0) < 5
      ) sub
    `,
  ]);

  const stats = {
    totalProducts,
    totalSuppliers,
    totalCustomers,
    totalSales,
    totalPurchases,
  };

  const todaySalesTotal = Number(todaySales._sum?.total ?? 0);
  const totalLowStock = lowStockCount[0]?.count ?? 0;
  const todayLabel = new Date().toLocaleDateString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  if (session.role === "ADMIN") {
    return (
      <AdminDashboard
        session={session}
        stats={stats}
        todaySalesTotal={todaySalesTotal}
        todaySalesCount={todaySalesCount}
        todayLabel={todayLabel}
        recentSales={JSON.parse(JSON.stringify(recentSales))}
        lowStockProducts={JSON.parse(JSON.stringify(lowStockProducts))}
        lowStockCount={totalLowStock}
      />
    );
  }

  // CASHIER / SALESMAN
  return (
    <StaffDashboard
      session={session}
      stats={stats}
      todaySalesTotal={todaySalesTotal}
      todaySalesCount={todaySalesCount}
      todayLabel={todayLabel}
      recentSales={JSON.parse(JSON.stringify(recentSales))}
    />
  );
}
