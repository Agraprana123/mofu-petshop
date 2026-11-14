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
    const batchCost = activeBatch?.costPerBase ?? null;
    const batchSellPrice =
      activeBatch && activeBatch.sellPricePerBase.gt(0)
        ? activeBatch.sellPricePerBase
        : null;
    const derivedSellPrice = batchCost
      ? batchCost.mul(new Decimal(1).plus(marginPercent.div(100)))
      : null;

    const masterBuyPrice = p.buyPrice && p.buyPrice.gt(0) ? p.buyPrice : null;
    const masterSellPrice = p.sellPrice && p.sellPrice.gt(0) ? p.sellPrice : null;
    const buyPrice = masterBuyPrice ?? batchCost;
    const effectiveSellPrice =
      masterSellPrice ?? batchSellPrice ?? derivedSellPrice;

    return {
      ...p,
      marginPercent,
      totalStock: totalStock.toNumber(),
      minStock: p.minStock.toNumber(),
      buyPrice: masterBuyPrice?.toNumber() ?? null,
      sellPrice: masterSellPrice?.toNumber() ?? null,
      effectiveBuyPrice: buyPrice?.toNumber() ?? null,
      effectiveSellPrice: effectiveSellPrice?.toDecimalPlaces(0).toNumber() ?? null,
    };
  });
}

/**
 * Buat kode produk otomatis dari nama kategori, contoh: MKN-001.
 */
export async function generateProductCode(categoryId?: number) {
  let prefix = "PRD";

  if (categoryId) {
    const category = await prisma.category.findUnique({
      where: { id: categoryId },
      select: { name: true },
    });
    if (category) {
      prefix =
        category.name
          .toUpperCase()
          .normalize("NFD")
          .replace(/[^A-Z0-9]/g, "")
          .slice(0, 3) || "PRD";
    }
  }

  const existing = await prisma.product.findMany({
    where: { code: { startsWith: `${prefix}-` } },
    select: { code: true },
  });
  const used = new Set(existing.map((item) => item.code));

  let sequence = 1;
  let code = `${prefix}-${String(sequence).padStart(3, "0")}`;
  while (used.has(code)) {
    sequence += 1;
    code = `${prefix}-${String(sequence).padStart(3, "0")}`;
  }

  return { code };
}

/**
 * Riwayat penjualan satu produk, terbaru lebih dulu.
 * Dipakai pada dialog riwayat di halaman Master Produk.
 */
export async function getProductSalesHistory(productId: number) {
  const items = await prisma.saleItem.findMany({
    where: { productId },
    orderBy: { sale: { date: "desc" } },
    take: 100,
    include: {
      sale: {
        select: {
          id: true,
          invoiceNo: true,
          date: true,
          customer: { select: { name: true } },
        },
      },
      unit: { select: { code: true } },
    },
  });

  return items.map((item) => ({
    id: item.id,
    saleId: item.sale.id,
    invoiceNo: item.sale.invoiceNo,
    date: item.sale.date.toISOString(),
    customerName: item.sale.customer?.name ?? "Umum",
    qty: item.qty.toNumber(),
    qtyBase: item.qtyBase.toNumber(),
    unitCode: item.unit.code,
    subtotal: item.subtotal.toNumber(),
  }));
}

function parseOptionalMoney(value: FormDataEntryValue | null): {
  value: number | null;
  error?: string;
} {
  const raw = typeof value === "string" ? value.trim() : "";
  if (!raw) return { value: null };
  const parsed = Number(raw);
  if (!Number.isFinite(parsed) || parsed < 0) {
    return { value: null, error: "Harga harus berupa angka 0 atau lebih" };
  }
  return { value: parsed };
}

function buildCodePrefix(name: string) {
  return (
    name
      .toUpperCase()
      .normalize("NFD")
      .replace(/[^A-Z0-9]/g, "")
      .slice(0, 3) || "PRD"
  );
}

async function nextProductCode(categoryId: number) {
  const category = await prisma.category.findUnique({
    where: { id: categoryId },
    select: { name: true },
  });
  const prefix = buildCodePrefix(category?.name ?? "");
  const existing = await prisma.product.findMany({
    where: { code: { startsWith: `${prefix}-` } },
    select: { code: true },
  });
  const used = new Set(existing.map((item) => item.code));

  let sequence = 1;
  let code = `${prefix}-${String(sequence).padStart(3, "0")}`;
  while (used.has(code)) {
    sequence += 1;
    code = `${prefix}-${String(sequence).padStart(3, "0")}`;
  }
  return code;
}

/**
 * Sinkronkan harga master ke batch stok yang tersisa.
 * - Harga beli hanya mengisi batch saldo awal (tanpa faktur pembelian).
 * - Harga jual mengisi batch yang belum punya harga. Jika harga master
 *   diubah, seluruh batch aktif ikut memakai harga baru.
 */
async function syncPricesToBatches(
  tx: Parameters<Parameters<typeof prisma.$transaction>[0]>[0],
  productId: number,
  data: {
    buyPrice: number | null;
    sellPrice: number | null;
    previousBuyPrice: Decimal | null;
    previousSellPrice: Decimal | null;
  }
) {
  const { buyPrice, sellPrice, previousBuyPrice, previousSellPrice } = data;

  if (buyPrice != null && buyPrice > 0) {
    const buyChanged =
      !previousBuyPrice || !previousBuyPrice.equals(new Decimal(buyPrice));

    await tx.stockBatch.updateMany({
      where: {
        productId,
        purchaseItemId: null,
        qtyRemaining: { gt: 0 },
        ...(buyChanged ? {} : { costPerBase: { lte: 0 } }),
      },
      data: { costPerBase: new Decimal(buyPrice) },
    });
  }

  if (sellPrice != null && sellPrice > 0) {
    const sellChanged =
      !previousSellPrice || !previousSellPrice.equals(new Decimal(sellPrice));
    const marginPercent =
      buyPrice != null && buyPrice > 0
        ? new Decimal(sellPrice)
            .minus(buyPrice)
            .div(buyPrice)
            .mul(100)
            .toDecimalPlaces(2)
        : null;

    await tx.stockBatch.updateMany({
      where: {
        productId,
        qtyRemaining: { gt: 0 },
        ...(sellChanged ? {} : { sellPricePerBase: { lte: 0 } }),
      },
      data: {
        sellPricePerBase: new Decimal(sellPrice),
        ...(marginPercent ? { marginPercent } : {}),
      },
    });
  }
}

export async function createProduct(formData: FormData) {
  let code = (formData.get("code") as string)?.trim().toUpperCase();
  const name = (formData.get("name") as string)?.trim();
  const categoryId = parseInt(formData.get("categoryId") as string);
  const baseUnitId = parseInt(formData.get("baseUnitId") as string);
  const marginStr = formData.get("marginPercent") as string;
  const marginPercent = marginStr ? parseFloat(marginStr) : null;
  const buy = parseOptionalMoney(formData.get("buyPrice"));
  const sell = parseOptionalMoney(formData.get("sellPrice"));
  const minStockRaw = (formData.get("minStock") as string)?.trim();
  const minStock = minStockRaw ? Number(minStockRaw) : 5;

  if (!name) return { error: "Nama produk harus diisi" };
  if (!categoryId) return { error: "Kategori harus dipilih" };
  if (!baseUnitId) return { error: "Satuan dasar harus dipilih" };
  if (buy.error || sell.error) return { error: buy.error || sell.error };
  if (!Number.isFinite(minStock) || minStock < 0) {
    return { error: "Minimal stok harus berupa angka 0 atau lebih" };
  }

  try {
    if (!code) code = await nextProductCode(categoryId);

    const created = await prisma.$transaction(async (tx) => {
      const product = await tx.product.create({
        data: {
          code,
          name,
          categoryId,
          baseUnitId,
          marginPercent,
          buyPrice: buy.value != null ? new Decimal(buy.value) : null,
          sellPrice: sell.value != null ? new Decimal(sell.value) : null,
          minStock: new Decimal(minStock),
        },
      });

      await syncPricesToBatches(tx, product.id, {
        buyPrice: buy.value,
        sellPrice: sell.value,
        previousBuyPrice: null,
        previousSellPrice: null,
      });

      return product;
    });

    revalidatePath("/master/products");
    return { success: true, code: created.code };
  } catch (err) {
    console.error("Create product error:", err);
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
  const buy = parseOptionalMoney(formData.get("buyPrice"));
  const sell = parseOptionalMoney(formData.get("sellPrice"));
  const minStockRaw = (formData.get("minStock") as string)?.trim();
  const minStock = minStockRaw ? Number(minStockRaw) : 5;

  if (!code) return { error: "Kode produk harus diisi" };
  if (!name) return { error: "Nama produk harus diisi" };
  if (!categoryId) return { error: "Kategori harus dipilih" };
  if (!baseUnitId) return { error: "Satuan dasar harus dipilih" };
  if (buy.error || sell.error) return { error: buy.error || sell.error };
  if (!Number.isFinite(minStock) || minStock < 0) {
    return { error: "Minimal stok harus berupa angka 0 atau lebih" };
  }

  try {
    const previous = await prisma.product.findUnique({
      where: { id },
      select: { buyPrice: true, sellPrice: true },
    });
    if (!previous) return { error: "Produk tidak ditemukan" };

    await prisma.$transaction(async (tx) => {
      await tx.product.update({
        where: { id },
        data: {
          code,
          name,
          categoryId,
          baseUnitId,
          marginPercent,
          buyPrice: buy.value != null ? new Decimal(buy.value) : null,
          sellPrice: sell.value != null ? new Decimal(sell.value) : null,
          minStock: new Decimal(minStock),
          isActive,
        },
      });

      await syncPricesToBatches(tx, id, {
        buyPrice: buy.value,
        sellPrice: sell.value,
        previousBuyPrice: previous.buyPrice,
        previousSellPrice: previous.sellPrice,
      });
    });

    revalidatePath("/master/products");
    revalidatePath("/");
    revalidatePath("/transactions/sales");
    revalidatePath("/reports/stock");
    revalidatePath("/reports/low-stock");
    return { success: true };
  } catch (err) {
    console.error("Update product error:", err);
    return { error: "Gagal memperbarui produk. Pastikan kode produk unik." };
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

