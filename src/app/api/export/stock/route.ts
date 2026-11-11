import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const products = await prisma.product.findMany({
      where: { isActive: true },
      include: {
        category: true,
        baseUnit: true,
        batches: {
          where: { qtyRemaining: { gt: 0 } },
          orderBy: { receivedAt: "asc" },
        },
      },
      orderBy: { name: "asc" },
    });

    const csvRows: string[] = [
      "No,Kode Produk,Nama Produk,Kategori,Satuan Dasar,Total Stok,Harga Modal Terakhir,Margin (%),Estimasi Harga Jual",
    ];

    products.forEach((p, index) => {
      const totalStock = p.batches.reduce(
        (sum, b) => sum + Number(b.qtyRemaining),
        0
      );
      const activeBatch = p.batches[0];
      const cost = activeBatch ? Number(activeBatch.costPerBase) : 0;
      const margin = p.marginPercent
        ? Number(p.marginPercent)
        : Number(p.category.defaultMarginPercent);
      const sellPrice = cost > 0 ? Math.round(cost * (1 + margin / 100)) : 0;

      const safeName = `"${p.name.replace(/"/g, '""')}"`;
      const safeCat = `"${p.category.name.replace(/"/g, '""')}"`;

      csvRows.push(
        `${index + 1},${p.code},${safeName},${safeCat},${p.baseUnit.code},${totalStock},${cost},${margin}%,${sellPrice}`
      );
    });

    const csvContent = csvRows.join("\n");
    const filename = `mofu_stok_${new Date().toISOString().slice(0, 10)}.csv`;

    return new NextResponse(csvContent, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (err) {
    console.error("Export stock error:", err);
    return new NextResponse("Gagal membuat export stok", { status: 500 });
  }
}
