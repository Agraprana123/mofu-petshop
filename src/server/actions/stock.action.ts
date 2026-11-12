"use server";

import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { Decimal } from "@prisma/client/runtime/library";

export interface ActionResult<T = unknown> {
  success?: boolean;
  data?: T;
  error?: string;
}

export async function createStockAdjustmentAction(input: {
  productId: number;
  qty: number;
  type: "IN" | "OUT";
  costPerBase?: number;
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

      if (input.type === "IN") {
        // Stok Masuk (Penyesuaian Opname Positif)
        const cost = new Decimal(input.costPerBase ?? 0).toDecimalPlaces(4);

        const batch = await tx.stockBatch.create({
          data: {
            productId: input.productId,
            qtyIn: qtyDecimal,
            qtyRemaining: qtyDecimal,
            costPerBase: cost,
            receivedAt: new Date(),
          },
        });

        await tx.stockMovement.create({
          data: {
            productId: input.productId,
            batchId: batch.id,
            type: "ADJUSTMENT",
            qtyBase: qtyDecimal, // positif
            refType: "ManualAdjustmentIn",
            refId: batch.id,
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
              type: "ADJUSTMENT",
              qtyBase: take.negated(), // negatif
              refType: "ManualAdjustmentOut",
              refId: batch.id,
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

