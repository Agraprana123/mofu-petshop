import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { DashboardShell } from "@/components/dashboard-shell";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  const [lowStock, cookieStore] = await Promise.all([
    prisma.$queryRaw<{ count: number }[]>`
      SELECT COUNT(*)::int AS count FROM (
        SELECT p.id
        FROM products p
        LEFT JOIN stock_batches sb ON sb.product_id = p.id
        WHERE p.is_active = true
        GROUP BY p.id
        HAVING COALESCE(SUM(sb.qty_remaining), 0) < p.min_stock
      ) sub
    `,
    cookies(),
  ]);

  return (
    <DashboardShell
      session={session}
      lowStockCount={lowStock[0]?.count ?? 0}
      initialCollapsed={cookieStore.get("mofu-sidebar")?.value === "collapsed"}
    >
      {children}
    </DashboardShell>
  );
}
