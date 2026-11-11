import { Decimal } from "@prisma/client/runtime/library";
import { prisma } from "@/lib/db";
import { nextNumber } from "@/lib/numbering";

// ────────── Types ──────────

export interface PurchaseItemInput {
  productId: number;
  unitId: number;
  qty: number; // qty dalam satuan yang dipilih
  unitCost: number; // harga per satuan yang dipilih
}

export interface CreatePurchaseInput {
  supplierId: number;
  supplierRef?: string;
  date?: Date;
  items: PurchaseItemInput[];
}

// ────────── Service ──────────

/**
 * Buat transaksi pembelian lengkap:
 * 1. Generate nomor faktur (PUR-YYYYMM-NNNN)
 * 2. Hitung qtyBase & costPerBase per item berdasar konversi satuan
 * 3. Buat StockBatch baru per item (stok masuk)
 * 4. Catat StockMovement (PURCHASE)
 * 5. Hitung total pembelian
 */
export async function createPurchase(input: CreatePurchaseInput) {
  return prisma.$transaction(async (tx) => {
    const invoiceNo = await nextNumber(tx, "PUR");
    const purchaseDate = input.date ?? new Date();

    // ── Proses setiap item ──
    const itemsData = await Promise.all(
      input.items.map(async (item) => {
        // Cari faktor konversi ke satuan dasar
        const conversion = await getConversion(tx, item.productId, item.unitId);

        const qty = new Decimal(item.qty);
        const unitCost = new Decimal(item.unitCost);

        // qtyBase = qty × conversionToBase
        const qtyBase = qty.mul(conversion).toDecimalPlaces(3);
        // costPerBase = unitCost / conversionToBase
        const costPerBase = unitCost.div(conversion).toDecimalPlaces(4);
        // subtotal = qty × unitCost
        const subtotal = qty.mul(unitCost).toDecimalPlaces(2);

        return {
          productId: item.productId,
          unitId: item.unitId,
          qty,
          unitCost,
          qtyBase,
          costPerBase,
          subtotal,
        };
      })
    );

    const total = itemsData.reduce(
      (sum, i) => sum.plus(i.subtotal),
      new Decimal(0)
    );

    // ── Simpan Purchase ──
    const purchase = await tx.purchase.create({
      data: {
        invoiceNo,
        supplierId: input.supplierId,
        supplierRef: input.supplierRef,
        date: purchaseDate,
        total,
        items: {
          create: itemsData.map((d) => ({
            productId: d.productId,
            unitId: d.unitId,
            qty: d.qty,
            unitCost: d.unitCost,
            qtyBase: d.qtyBase,
            costPerBase: d.costPerBase,
            subtotal: d.subtotal,
          })),
        },
      },
      include: { items: true },
    });

    // ── Buat StockBatch & StockMovement per item ──
    for (const pi of purchase.items) {
      const batch = await tx.stockBatch.create({
        data: {
          productId: pi.productId,
          purchaseItemId: pi.id,
          qtyIn: pi.qtyBase,
          qtyRemaining: pi.qtyBase,
          costPerBase: pi.costPerBase,
          receivedAt: purchaseDate,
        },
      });

      await tx.stockMovement.create({
        data: {
          productId: pi.productId,
          batchId: batch.id,
          type: "PURCHASE",
          qtyBase: pi.qtyBase, // positif = masuk
          refType: "PurchaseItem",
          refId: pi.id,
        },
      });
    }

    return purchase;
  });
}

// ────────── Helper ──────────

type TxClient = Parameters<Parameters<typeof prisma.$transaction>[0]>[0];

async function getConversion(
  tx: TxClient,
  productId: number,
  unitId: number
): Promise<Decimal> {
  // Cek apakah unit yang dipilih = base unit produk
  const product = await tx.product.findUniqueOrThrow({
    where: { id: productId },
  });

  if (product.baseUnitId === unitId) {
    return new Decimal(1);
  }

  // Cari di tabel product_units
  const pu = await tx.productUnit.findUnique({
    where: {
      productId_unitId: { productId, unitId },
    },
  });

  if (!pu) {
    throw new Error(
      `Konversi satuan tidak ditemukan: product=${productId}, unit=${unitId}`
    );
  }

  return pu.conversionToBase;
}

// Re-export agar bisa dipakai dari service lain
export type { TxClient };

