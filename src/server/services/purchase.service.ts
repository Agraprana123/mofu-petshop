import { Decimal } from "@prisma/client/runtime/library";
import { prisma } from "@/lib/db";
import { nextNumber } from "@/lib/numbering";
import { getSellPricePerBase } from "./pricing.service";

// ────────── Types ──────────

export interface PurchaseItemInput {
  productId: number;
  unitId: number;
  qty: number; // qty dalam satuan yang dipilih
  unitCost: number; // harga beli per satuan yang dipilih
  /**
   * Harga jual batch ini. Isi SALAH SATU (keduanya per satuan beli):
   *  - sellPrice     → margin dihitung otomatis
   *  - marginPercent → harga jual dihitung otomatis (dibulatkan ke rupiah)
   * Kalau keduanya kosong: dipakai margin batch terakhir produk ini,
   * dan kalau belum pernah ada batch, aturan margin master (pricing.service).
   */
  marginPercent?: number;
  sellPrice?: number;
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
 * 3. Tentukan margin & harga jual batch (DIKUNCI di batch, tidak ikut master)
 * 4. Buat StockBatch baru per item (stok masuk)
 * 5. Catat StockMovement (PURCHASE)
 */
export async function createPurchase(input: CreatePurchaseInput) {
  if (input.items.length === 0) {
    throw new Error("Faktur pembelian harus punya minimal 1 item");
  }

  return prisma.$transaction(
    async (tx) => {
      const invoiceNo = await nextNumber(tx, "PUR");
      const purchaseDate = input.date ?? new Date();

      // ── Hitung semua item dulu ──
      const itemsData: {
        productId: number;
        unitId: number;
        qty: Decimal;
        unitCost: Decimal;
        qtyBase: Decimal;
        costPerBase: Decimal;
        subtotal: Decimal;
        marginPercent: Decimal;
        sellPricePerUnit: Decimal;
        sellPricePerBase: Decimal;
      }[] = [];

      for (const item of input.items) {
        if (item.qty <= 0) throw new Error("Qty harus lebih dari 0");
        if (item.unitCost < 0) throw new Error("Harga beli tidak boleh negatif");

        const conversion = await getConversion(tx, item.productId, item.unitId);

        const qty = new Decimal(item.qty);
        const unitCost = new Decimal(item.unitCost);

        const qtyBase = qty.mul(conversion).toDecimalPlaces(3);
        const costPerBase = unitCost.div(conversion).toDecimalPlaces(4);
        const subtotal = qty.mul(unitCost).toDecimalPlaces(2);

        const { marginPercent, sellPricePerUnit, sellPricePerBase } =
          await resolveBatchPricing(tx, {
            ...item,
            unitCost,
            costPerBase,
            conversion,
          });

        itemsData.push({
          productId: item.productId,
          unitId: item.unitId,
          qty,
          unitCost,
          qtyBase,
          costPerBase,
          subtotal,
          marginPercent,
          sellPricePerUnit,
          sellPricePerBase,
        });
      }

      const total = itemsData.reduce(
        (sum, i) => sum.plus(i.subtotal),
        new Decimal(0)
      );

      // ── Simpan Purchase (header) ──
      const purchase = await tx.purchase.create({
        data: {
          invoiceNo,
          supplierId: input.supplierId,
          supplierRef: input.supplierRef,
          date: purchaseDate,
          total,
        },
      });

      // ── Per item: PurchaseItem → StockBatch → StockMovement ──
      for (const d of itemsData) {
        const pi = await tx.purchaseItem.create({
          data: {
            purchaseId: purchase.id,
            productId: d.productId,
            unitId: d.unitId,
            qty: d.qty,
            unitCost: d.unitCost,
            qtyBase: d.qtyBase,
            costPerBase: d.costPerBase,
            marginPercent: d.marginPercent,
            sellPricePerUnit: d.sellPricePerUnit,
            sellPricePerBase: d.sellPricePerBase,
            subtotal: d.subtotal,
          },
        });

        const batch = await tx.stockBatch.create({
          data: {
            productId: d.productId,
            purchaseItemId: pi.id,
            qtyIn: d.qtyBase,
            qtyRemaining: d.qtyBase,
            costPerBase: d.costPerBase,
            marginPercent: d.marginPercent,
            sellPricePerBase: d.sellPricePerBase,
            receivedAt: purchaseDate,
          },
        });

        await tx.stockMovement.create({
          data: {
            productId: d.productId,
            batchId: batch.id,
            type: "PURCHASE",
            qtyBase: d.qtyBase, // positif = masuk
            refType: "PurchaseItem",
            refId: pi.id,
          },
        });
      }

      return tx.purchase.findUniqueOrThrow({
        where: { id: purchase.id },
        include: { items: true },
      });
    },
    { timeout: 15000 }
  );
}

// ────────── Helper ──────────

type TxClient = Parameters<Parameters<typeof prisma.$transaction>[0]>[0];

/**
 * Menentukan margin dan harga jual per satuan dasar untuk satu batch baru.
 * Urutan: harga jual input → margin input → margin batch terakhir → aturan master.
 */
async function resolveBatchPricing(
  tx: TxClient,
  a: {
    productId: number;
    unitCost: Decimal;
    costPerBase: Decimal;
    conversion: Decimal;
    marginPercent?: number;
    sellPrice?: number;
  }
): Promise<{
  marginPercent: Decimal;
  sellPricePerUnit: Decimal;
  sellPricePerBase: Decimal;
}> {
  // 1. Harga jual diinput langsung → margin dihitung dari selisih
  if (a.sellPrice != null) {
    const sell = new Decimal(a.sellPrice);
    if (sell.lt(0)) throw new Error("Harga jual tidak boleh negatif");
    const marginPercent = a.unitCost.isZero()
      ? new Decimal(0)
      : sell.minus(a.unitCost).div(a.unitCost).mul(100).toDecimalPlaces(2);
    return {
      marginPercent,
      sellPricePerUnit: sell.toDecimalPlaces(2),
      sellPricePerBase: sell.div(a.conversion).toDecimalPlaces(4),
    };
  }

  // 2. Margin diinput, atau 3. margin batch terakhir produk ini
  let margin: Decimal | null = null;
  if (a.marginPercent != null) {
    margin = new Decimal(a.marginPercent);
  } else {
    const last = await tx.stockBatch.findFirst({
      where: { productId: a.productId, sellPricePerBase: { gt: 0 } },
      orderBy: [{ receivedAt: "desc" }, { id: "desc" }],
      select: { marginPercent: true },
    });
    if (last) margin = new Decimal(last.marginPercent);
  }

  if (margin !== null) {
    const sellPerUnit = a.unitCost
      .mul(new Decimal(1).plus(margin.div(100)))
      .toDecimalPlaces(0); // bulatkan ke rupiah
    return {
      marginPercent: margin,
      sellPricePerUnit: sellPerUnit.toDecimalPlaces(2),
      sellPricePerBase: sellPerUnit.div(a.conversion).toDecimalPlaces(4),
    };
  }

  // 4. Produk baru tanpa riwayat batch → pakai aturan master yang sudah ada
  const sellPerBase = await getSellPricePerBase(tx, a.productId, a.costPerBase);
  const sellPerUnit = sellPerBase.mul(a.conversion).toDecimalPlaces(0);
  const marginPercent = a.costPerBase.isZero()
    ? new Decimal(0)
    : sellPerBase.minus(a.costPerBase).div(a.costPerBase).mul(100).toDecimalPlaces(2);
  return {
    marginPercent,
    sellPricePerUnit: sellPerUnit.toDecimalPlaces(2),
    sellPricePerBase: sellPerBase,
  };
}

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