"use server";

import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { Decimal } from "@prisma/client/runtime/library";
import {
  calcSellPrice,
  getEffectiveMargin,
} from "@/server/services/pricing.service";

export interface ActionResult<T = unknown> {
  success?: boolean;
  data?: T;
  error?: string;
}

export async function createStockAdjustmentAction(input: {
  productId: number;
  qty: number;
  type: "IN" | "OUT";
  /** Satuan kemasan yang dipilih; kosong = satuan dasar produk. */
  unitId?: number;
  costPerBase?: number;
  /** Harga jual per satuan dasar. Kosong = otomatis dari master/margin produk. */
  sellPricePerBase?: number;
  notes?: string;
  /** Tanggal masuk (ISO string) untuk penyesuaian IN. */
  receivedAt?: string;
}): Promise<ActionResult> {
  if (!input.productId || Number(input.qty) <= 0) {
    return { error: "Pilih produk dan masukkan jumlah qty > 0." };
  }
  if (input.sellPricePerBase != null && input.sellPricePerBase < 0) {
    return { error: "Harga jual tidak boleh negatif." };
  }

  try {
    return await prisma.$transaction(async (tx) => {
      const product = await tx.product.findUniqueOrThrow({
        where: { id: input.productId },
        include: { baseUnit: true },
      });

      // Konversi qty dari satuan kemasan yang dipilih ke satuan dasar.
      let qtyBase = new Decimal(input.qty).toDecimalPlaces(3);
      if (input.unitId && input.unitId !== product.baseUnitId) {
        const productUnit = await tx.productUnit.findUnique({
          where: {
            productId_unitId: {
              productId: input.productId,
              unitId: input.unitId,
            },
          },
        });
        if (!productUnit) {
          throw new Error("Satuan kemasan tidak valid untuk produk ini.");
        }
        qtyBase = qtyBase
          .mul(productUnit.conversionToBase)
          .toDecimalPlaces(3);
      }

      if (qtyBase.lte(0)) {
        throw new Error("Jumlah stok harus lebih dari 0.");
      }

      const note = input.notes?.trim() ? input.notes.trim() : null;
      const rawReceivedAt = input.receivedAt
        ? new Date(input.receivedAt)
        : new Date();
      if (Number.isNaN(rawReceivedAt.getTime())) {
        throw new Error("Tanggal masuk tidak valid.");
      }
      // Kalau tanggal yang dipilih hari ini, pakai jam sekarang supaya
      // urutan riwayat & FIFO tetap kronologis. Tanggal lampau tetap dipertahankan.
      const now = new Date();
      const receivedAt =
        rawReceivedAt.toDateString() === now.toDateString()
          ? now
          : rawReceivedAt;

      if (input.type === "IN") {
        // Stok Masuk (Penyesuaian Opname Positif)
        const cost = new Decimal(input.costPerBase ?? 0).toDecimalPlaces(4);

        // Harga jual batch: input manual → harga master → margin produk.
        let sellPricePerBase = new Decimal(
          input.sellPricePerBase ?? 0
        ).toDecimalPlaces(4);
        let marginPercent = new Decimal(0);

        const calcMargin = () =>
          cost.gt(0)
            ? sellPricePerBase
                .minus(cost)
                .div(cost)
                .mul(100)
                .toDecimalPlaces(2)
            : new Decimal(0);

        if (sellPricePerBase.gt(0)) {
          marginPercent = calcMargin();
        } else if (product.sellPrice && product.sellPrice.gt(0)) {
          sellPricePerBase = product.sellPrice;
          marginPercent = calcMargin();
        } else if (cost.gt(0)) {
          marginPercent = await getEffectiveMargin(tx, input.productId);
          sellPricePerBase = calcSellPrice(cost, marginPercent);
        }

        const batch = await tx.stockBatch.create({
          data: {
            productId: input.productId,
            qtyIn: qtyBase,
            qtyRemaining: qtyBase,
            costPerBase: cost,
            marginPercent,
            sellPricePerBase,
            receivedAt,
          },
        });

        await tx.stockMovement.create({
          data: {
            productId: input.productId,
            batchId: batch.id,
            type: "ADJUSTMENT",
            qtyBase, // positif
            refType: "ManualAdjustmentIn",
            refId: batch.id,
            note,
            createdAt: receivedAt,
          },
        });
      } else {
        // Stok Keluar (Penyesuaian Rusak / Hilang / Opname Negatif - FIFO)
        const batches = await tx.stockBatch.findMany({
          where: {
            productId: input.productId,
            qtyRemaining: { gt: 0 },
          },
          orderBy: { receivedAt: "asc" },
        });

        let remaining = qtyBase;

        for (const batch of batches) {
          if (remaining.lte(0)) break;
          const take = Decimal.min(remaining, batch.qtyRemaining);

          await tx.stockBatch.update({
            where: { id: batch.id },
            data: {
              qtyRemaining: batch.qtyRemaining.minus(take),
            },
          });

          await tx.stockMovement.create({
            data: {
              productId: input.productId,
              batchId: batch.id,
              type: "ADJUSTMENT",
              qtyBase: take.negated(), // negatif
              refType: "ManualAdjustmentOut",
              refId: batch.id,
              note,
            },
          });

          remaining = remaining.minus(take);
        }

        if (remaining.gt(0)) {
          throw new Error(
            `Stok "${product.name}" tidak mencukupi untuk dikeluarkan. Kurang ${remaining.toString()} ${product.baseUnit.code}.`
          );
        }
      }

      revalidatePath("/stock/in");
      revalidatePath("/stock/out");
      revalidatePath("/master/products");
      revalidatePath("/");

      return { success: true };
    });
  } catch (err: unknown) {
    console.error("Adjustment error:", err);
    return { error: (err as Error).message || "Gagal melakukan penyesuaian stok." };
  }
}

export async function createReturnAction(input: {
  type: "RETURN_IN" | "RETURN_OUT"; // RETURN_IN = Customer retur (masuk), RETURN_OUT = Retur ke Supplier (keluar)
  productId: number;
  qty: number;
  invoiceNo?: string;
  notes: string;
}): Promise<ActionResult> {
  if (!input.productId || Number(input.qty) <= 0) {
    return { error: "Pilih produk dan masukkan jumlah qty > 0." };
  }

  try {
    return await prisma.$transaction(async (tx) => {
      const product = await tx.product.findUniqueOrThrow({
        where: { id: input.productId },
        include: { baseUnit: true },
      });

      const qtyDecimal = new Decimal(input.qty).toDecimalPlaces(3);

      if (input.type === "RETURN_IN") {
        // Customer Return: barang kembali ke toko (menambah stok)
        // Cari batch terakhir atau buat layer batch pengembalian
        const latestBatch = await tx.stockBatch.findFirst({
          where: { productId: input.productId },
          orderBy: { receivedAt: "desc" },
        });

        const cost = latestBatch ? latestBatch.costPerBase : new Decimal(0);

        const batch = await tx.stockBatch.create({
          data: {
            productId: input.productId,
            qtyIn: qtyDecimal,
            qtyRemaining: qtyDecimal,
            costPerBase: cost,
            marginPercent: latestBatch?.marginPercent ?? new Decimal(0),
            sellPricePerBase: latestBatch?.sellPricePerBase ?? new Decimal(0),
            receivedAt: new Date(),
          },
        });

        await tx.stockMovement.create({
          data: {
            productId: input.productId,
            batchId: batch.id,
            type: "RETURN_IN",
            qtyBase: qtyDecimal,
            refType: input.invoiceNo ? `Invoice:${input.invoiceNo}` : "CustomerReturn",
            refId: batch.id,
          },
        });
      } else {
        // Supplier Return: barang dikembalikan ke supplier (mengurangi stok FIFO)
        const batches = await tx.stockBatch.findMany({
          where: {
            productId: input.productId,
            qtyRemaining: { gt: 0 },
          },
          orderBy: { receivedAt: "asc" },
        });

        let remaining = qtyDecimal;

        for (const batch of batches) {
          if (remaining.lte(0)) break;
          const take = Decimal.min(remaining, batch.qtyRemaining);

          await tx.stockBatch.update({
            where: { id: batch.id },
            data: {
              qtyRemaining: batch.qtyRemaining.minus(take),
            },
          });

          await tx.stockMovement.create({
            data: {
              productId: input.productId,
              batchId: batch.id,
              type: "RETURN_OUT",
              qtyBase: take.negated(),
              refType: input.invoiceNo ? `Invoice:${input.invoiceNo}` : "SupplierReturn",
              refId: batch.id,
            },
          });

          remaining = remaining.minus(take);
        }

        if (remaining.gt(0)) {
          throw new Error(
            `Stok "${product.name}" tidak mencukupi untuk diretur ke supplier. Kurang ${remaining.toString()} ${product.baseUnit.code}.`
          );
        }
      }

      revalidatePath("/returns");
      revalidatePath("/stock/in");
      revalidatePath("/stock/out");
      revalidatePath("/master/products");
      revalidatePath("/");

      return { success: true };
    });
  } catch (err: unknown) {
    console.error("Return error:", err);
    return { error: (err as Error).message || "Gagal memproses transaksi retur." };
  }
}

