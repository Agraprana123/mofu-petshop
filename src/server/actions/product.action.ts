"use server";

import { Decimal } from "@prisma/client/runtime/library";
import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function getProducts(search?: string) {
  const products = await prisma.product.findMany({
    where: search
      ? {
          OR: [
            { name: { contains: search, mode: "insensitive" } },
            { code: { contains: search, mode: "insensitive" } },
          ],
        }
      : undefined,
    orderBy: { name: "asc" },
    include: {
      category: true,
      baseUnit: true,
      units: { include: { unit: true } },
    },
  });

  // Ambil stok & harga aktif per produk (batch terlama dengan sisa > 0)
  const productIds = products.map((p) => p.id);
  const stockData = await prisma.stockBatch.groupBy({
    by: ["productId"],
    where: { productId: { in: productIds }, qtyRemaining: { gt: 0 } },
    _sum: { qtyRemaining: true },
  });

  // Ambil batch terlama per produk untuk harga aktif
  const activeBatches = await prisma.stockBatch.findMany({
    where: {
      productId: { in: productIds },
      qtyRemaining: { gt: 0 },
    },
    orderBy: { receivedAt: "asc" },
    distinct: ["productId"],
  });

  const stockMap = new Map(
    stockData.map((s) => [s.productId, s._sum.qtyRemaining])
  );
  const batchMap = new Map(activeBatches.map((b) => [b.productId, b]));

  return products.map((p) => {
    const totalStock = stockMap.get(p.id) ?? new Decimal(0);
    const activeBatch = batchMap.get(p.id);
    const marginPercent = p.marginPercent ?? p.category.defaultMarginPercent;
    const costPerBase = activeBatch?.costPerBase ?? null;
    const sellPrice = costPerBase
      ? costPerBase.mul(new Decimal(1).plus(marginPercent.div(100)))
      : null;

    return {
      ...p,
      marginPercent,
      totalStock: totalStock.toNumber(),
      costPerBase: costPerBase?.toNumber() ?? null,
      sellPrice: sellPrice?.toDecimalPlaces(0).toNumber() ?? null,
    };
  });
}

export async function createProduct(formData: FormData) {
  const code = (formData.get("code") as string)?.trim().toUpperCase();
  const name = (formData.get("name") as string)?.trim();
  const categoryId = parseInt(formData.get("categoryId") as string);
  const baseUnitId = parseInt(formData.get("baseUnitId") as string);
  const marginStr = formData.get("marginPercent") as string;
  const marginPercent = marginStr ? parseFloat(marginStr) : null;

  if (!code) return { error: "Kode produk harus diisi" };
  if (!name) return { error: "Nama produk harus diisi" };
  if (!categoryId) return { error: "Kategori harus dipilih" };
  if (!baseUnitId) return { error: "Satuan dasar harus dipilih" };

  try {
    await prisma.product.create({
      data: { code, name, categoryId, baseUnitId, marginPercent },
    });
    revalidatePath("/master/products");
    return { success: true };
  } catch {
    return { error: "Kode produk sudah ada atau terjadi kesalahan" };
  }
}

export async function updateProduct(id: number, formData: FormData) {
  const code = (formData.get("code") as string)?.trim().toUpperCase();
  const name = (formData.get("name") as string)?.trim();
  const categoryId = parseInt(formData.get("categoryId") as string);
  const baseUnitId = parseInt(formData.get("baseUnitId") as string);
  const marginStr = formData.get("marginPercent") as string;
  const marginPercent = marginStr ? parseFloat(marginStr) : null;
  const isActive = formData.get("isActive") === "true";

  if (!code) return { error: "Kode produk harus diisi" };
  if (!name) return { error: "Nama produk harus diisi" };

  try {
    await prisma.product.update({
      where: { id },
      data: { code, name, categoryId, baseUnitId, marginPercent, isActive },
    });
    revalidatePath("/master/products");
    return { success: true };
  } catch {
    return { error: "Gagal memperbarui produk" };
  }
}

export async function toggleProductActive(id: number, isActive: boolean) {
  try {
    await prisma.product.update({
      where: { id },
      data: { isActive },
    });
    revalidatePath("/master/products");
    return { success: true };
  } catch {
    return { error: "Gagal mengubah status aktif produk" };
  }
}

export async function deleteProduct(id: number, forceSoftDelete = false) {
  try {
    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            saleItems: true,
            purchaseItems: true,
            batches: true,
            movements: true,
          },
        },
      },
    });

    if (!product) {
      return { error: "Produk tidak ditemukan" };
    }

    // Jika pengguna memilih untuk soft delete (nonaktifkan)
    if (forceSoftDelete) {
      await prisma.product.update({
        where: { id },
        data: { isActive: false },
      });
      revalidatePath("/master/products");
      return { success: true, action: "soft_deleted" };
    }

    const hasRealTransactions =
      product._count.saleItems > 0 || product._count.purchaseItems > 0;

    // Jika ada faktur penjualan atau pembelian riil, tidak boleh di-hard delete
    if (hasRealTransactions) {
      return {
        error: "HAS_TRANSACTIONS",
        message:
          "Produk memiliki riwayat transaksi (penjualan/pembelian) sehingga tidak dapat dihapus permanen agar pembukuan tidak rusak. Apakah Anda ingin menonaktifkannya saja (disembunyikan dari Kasir & Pembelian)?",
      };
    }

    // Jika hanya memiliki saldo awal migrasi atau tidak ada transaksi penjualan/pembelian sama sekali
    await prisma.$transaction([
      prisma.stockMovement.deleteMany({ where: { productId: id } }),
      prisma.stockBatch.deleteMany({ where: { productId: id } }),
      prisma.productUnit.deleteMany({ where: { productId: id } }),
      prisma.product.delete({ where: { id } }),
    ]);

    revalidatePath("/master/products");
    return { success: true, action: "hard_deleted" };
  } catch {
    return { error: "Gagal menghapus produk" };
  }
}

// Manage product unit conversions
export async function upsertProductUnit(
  productId: number,
  unitId: number,
  conversionToBase: number
) {
  await prisma.productUnit.upsert({
    where: { productId_unitId: { productId, unitId } },
    update: { conversionToBase },
    create: { productId, unitId, conversionToBase },
  });
  revalidatePath("/master/products");
  return { success: true };
}

export async function deleteProductUnit(productId: number, unitId: number) {
  await prisma.productUnit.delete({
    where: { productId_unitId: { productId, unitId } },
  });
  revalidatePath("/master/products");
  return { success: true };
}

