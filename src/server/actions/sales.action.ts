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
