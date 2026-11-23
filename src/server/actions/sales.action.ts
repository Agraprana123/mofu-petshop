"use server";

import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { createSale as createSaleService, type CreateSaleInput } from "@/server/services/sales.service";

export interface ActionResult<T = unknown> {
  success?: boolean;
  data?: T;
  error?: string;
}

export async function createSaleAction(input: CreateSaleInput): Promise<ActionResult> {
  if (!input.items || input.items.length === 0) {
    return { error: "Keranjang belanja kosong. Masukkan minimal 1 barang." };
  }

  for (const item of input.items) {
    if (!item.productId || !item.unitId || Number(item.qty) <= 0) {
      return { error: "Data barang tidak valid atau jumlah qty tidak boleh 0." };
    }
    if (
      item.unitPrice != null &&
      (!Number.isFinite(item.unitPrice) || item.unitPrice < 0)
    ) {
      return { error: "Harga jual tidak boleh negatif." };
    }
  }

  try {
    const sale = await createSaleService(input);
    revalidatePath("/transactions/sales");
    revalidatePath("/stock/out");
    revalidatePath("/master/products");
    revalidatePath("/");
    return {
      success: true,
      data: {
        id: sale.id,
        invoiceNo: sale.invoiceNo,
        total: Number(sale.total),
      },
    };
  } catch (err: unknown) {
    console.error("Create sale error:", err);
    return { error: (err as Error).message || "Gagal memproses transaksi penjualan." };
  }
}

/** Tandai faktur penjualan sebagai selesai / lunas. */
/** Tandai faktur lunas. Faktur yang pernah dibatalkan akan diaktifkan kembali. */
export async function completeSaleAction(id: number): Promise<ActionResult> {
  try {
    const sale = await prisma.sale.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            product: { select: { name: true } },
            allocations: {
              include: { batch: { select: { qtyRemaining: true } } },
            },
          },
        },
      },
    });

    if (!sale) return { error: "Faktur penjualan tidak ditemukan." };
    if (sale.paymentStatus === "PAID") {
      return { success: true };
    }

    // Faktur biasa (UNPAID / PARTIAL): cukup ubah status.
    if (sale.paymentStatus !== "CANCELLED") {
      await prisma.sale.update({
        where: { id },
        data: { paymentStatus: "PAID" },
      });

      revalidateSalePages();
      return { success: true };
    }

    // Faktur yang pernah dibatalkan: potong lagi stok sesuai alokasi FIFO,
    // pulihkan pergerakan stok penjualan, lalu hapus catatan pembatalannya.
    await prisma.$transaction(
      async (tx) => {
        for (const item of sale.items) {
          for (const allocation of item.allocations) {
            if (
              Number(allocation.batch.qtyRemaining) <
              Number(allocation.qtyBase)
            ) {
              throw new Error(
                `Stok "${item.product.name}" tidak cukup untuk mengaktifkan kembali faktur ini. ` +
                  `Batch #${allocation.batchId} hanya tersisa ${Number(
                    allocation.batch.qtyRemaining
                  )}.`
              );
            }
          }
        }

        for (const item of sale.items) {
          for (const allocation of item.allocations) {
            await tx.stockBatch.update({
              where: { id: allocation.batchId },
              data: { qtyRemaining: { decrement: allocation.qtyBase } },
            });

            await tx.stockMovement.create({
              data: {
                productId: item.productId,
                batchId: allocation.batchId,
                type: "SALE",
                qtyBase: allocation.qtyBase.mul(-1),
                refType: "SaleItem",
                refId: item.id,
                note: `Pengaktifan kembali faktur ${sale.invoiceNo}`,
              },
            });
          }
        }

        await tx.stockMovement.deleteMany({
          where: {
            type: "ADJUSTMENT",
            refType: "SaleCancel",
            refId: sale.id,
          },
        });

        await tx.sale.update({
          where: { id },
          data: { paymentStatus: "PAID" },
        });
      },
      { timeout: 15000 }
    );

    revalidateSalePages();
    return { success: true };
  } catch (err: unknown) {
    console.error("Complete sale error:", err);
    return {
      error: (err as Error).message || "Gagal menyelesaikan faktur penjualan.",
    };
  }
}

/**
 * Batalkan faktur penjualan:
 * - stok tiap batch dikembalikan sesuai alokasi FIFO yang tercatat
 * - pergerakan stok penjualan dihapus, lalu dicatat sebagai penyesuaian masuk
 * - status faktur menjadi CANCELLED (riwayat tetap tersimpan)
 */
export async function cancelSaleAction(id: number): Promise<ActionResult> {
  try {
    await prisma.$transaction(
      async (tx) => {
        const sale = await tx.sale.findUnique({
          where: { id },
          include: {
            items: {
              include: { allocations: true },
            },
          },
        });

        if (!sale) throw new Error("Faktur penjualan tidak ditemukan.");
        if (sale.paymentStatus === "CANCELLED") {
          throw new Error("Faktur penjualan sudah dibatalkan.");
        }

        const itemIds = sale.items.map((item) => item.id);

        for (const item of sale.items) {
          for (const allocation of item.allocations) {
            await tx.stockBatch.update({
              where: { id: allocation.batchId },
              data: { qtyRemaining: { increment: allocation.qtyBase } },
            });

            await tx.stockMovement.create({
              data: {
                productId: item.productId,
                batchId: allocation.batchId,
                type: "ADJUSTMENT",
                qtyBase: allocation.qtyBase,
                refType: "SaleCancel",
                refId: sale.id,
                note: `Pembatalan faktur ${sale.invoiceNo}`,
              },
            });
          }
        }

        // Hapus pergerakan stok keluar milik faktur ini agar riwayat stok
        // tidak menampilkan penjualan yang sudah dibatalkan.
        if (itemIds.length > 0) {
          await tx.stockMovement.deleteMany({
            where: {
              type: "SALE",
              refType: "SaleItem",
              refId: { in: itemIds },
            },
          });
        }

        await tx.sale.update({
          where: { id },
          data: { paymentStatus: "CANCELLED" },
        });
      },
      { timeout: 15000 }
    );

    revalidateSalePages();
    return { success: true };
  } catch (err: unknown) {
    console.error("Cancel sale error:", err);
    return {
      error: (err as Error).message || "Gagal membatalkan faktur penjualan.",
    };
  }
}

function revalidateSalePages() {
  revalidatePath("/transactions/sales");
  revalidatePath("/reports/sales");
  revalidatePath("/reports/profit");
  revalidatePath("/reports/stock");
  revalidatePath("/stock/in");
  revalidatePath("/stock/out");
  revalidatePath("/master/products");
  revalidatePath("/");
}

export async function getSaleDetail(id: number) {
  try {
    const sale = await prisma.sale.findUnique({
      where: { id },
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
    });
    return sale ? JSON.parse(JSON.stringify(sale)) : null;
  } catch (err) {
    console.error("Get sale detail error:", err);
    return null;
  }
}
