"use server";

import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { createPurchase as createPurchaseService, type CreatePurchaseInput } from "@/server/services/purchase.service";

export interface ActionResult<T = unknown> {
  success?: boolean;
  data?: T;
  error?: string;
}

export async function createPurchaseAction(input: CreatePurchaseInput): Promise<ActionResult> {
  if (!input.supplierId) {
    return { error: "Pemasok (Supplier) wajib dipilih." };
  }
  if (!input.items || input.items.length === 0) {
    return { error: "Minimal harus ada 1 barang dalam faktur pembelian." };
  }

  for (const item of input.items) {
    if (!item.productId || !item.unitId || Number(item.qty) <= 0 || Number(item.unitCost) < 0) {
      return { error: "Data item pembelian tidak valid. Pastikan qty > 0 dan harga beli terisi." };
    }
  }

  try {
    const purchase = await createPurchaseService(input);
    revalidatePath("/transactions/purchases");
    revalidatePath("/stock/in");
    revalidatePath("/master/products");
    revalidatePath("/");
    return { success: true, data: { invoiceNo: purchase.invoiceNo, id: purchase.id } };
  } catch (err: unknown) {
    console.error("Create purchase error:", err);
    return { error: (err as Error).message || "Gagal membuat faktur pembelian." };
  }
}

export async function getPurchaseDetail(id: number) {
  try {
    const purchase = await prisma.purchase.findUnique({
      where: { id },
      include: {
        supplier: true,
        items: {
          include: {
            product: { include: { baseUnit: true } },
            unit: true,
            batch: true,
          },
        },
      },
    });
    return purchase ? JSON.parse(JSON.stringify(purchase)) : null;
  } catch (err) {
    console.error("Get purchase detail error:", err);
    return null;
  }
}

