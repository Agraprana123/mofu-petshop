import { Decimal } from "@prisma/client/runtime/library";
import { prisma } from "@/lib/db";
import { nextNumber } from "@/lib/numbering";

// ────────── Types ──────────

export interface SaleItemInput {
  productId: number;
  unitId: number;
  qty: number;
  /**
   * Override harga jual per unit (misal harga khusus customer).
   * Kalau tidak diisi, dipakai harga yang TERSIMPAN di tiap batch
   * (hasil input saat pembelian). Master produk tidak dibaca.
   */
  unitPrice?: number;
}

export interface CreateSaleInput {
  customerId?: number;
  salesmanId?: number;
  date?: Date;
  items: SaleItemInput[];
}

// ────────── Service ──────────

/**
 * Buat transaksi penjualan dengan alokasi stok FIFO:
 * 1. Generate nomor faktur (SAL-YYYYMM-NNNN)
 * 2. Untuk tiap item, ambil batch terlama yang masih punya sisa
 * 3. Harga tiap batch = sellPricePerBase yang dikunci di batch itu
 * 4. Snapshot harga & modal ke SaleItemBatch, catat StockMovement (SALE)
 */
export async function createSale(input: CreateSaleInput) {
  if (input.items.length === 0) {
    throw new Error("Faktur penjualan harus punya minimal 1 item");
  }

  return prisma.$transaction(
    async (tx) => {
      const invoiceNo = await nextNumber(tx, "SAL");
      const saleDate = input.date ?? new Date();

      // ── Proses items & hitung subtotal ──
      const itemsData: {
        productId: number;
        unitId: number;
        qty: Decimal;
        qtyBase: Decimal;
        subtotal: Decimal;
        allocations: {
          batchId: number;
          qtyBase: Decimal;
          costPerBase: Decimal;
          pricePerBase: Decimal;
        }[];
      }[] = [];

      for (const item of input.items) {
        if (item.qty <= 0) throw new Error("Qty harus lebih dari 0");

        const conversion = await getConversion(tx, item.productId, item.unitId);

        const qty = new Decimal(item.qty);
        const qtyBase = qty.mul(conversion).toDecimalPlaces(3);

        // ── FIFO: batch dari yang paling lama (tie-break dengan id) ──
        const batches = await tx.stockBatch.findMany({
          where: {
            productId: item.productId,
            qtyRemaining: { gt: 0 },
          },
          orderBy: [{ receivedAt: "asc" }, { id: "asc" }],
        });

        let remaining = qtyBase;
        const allocations: (typeof itemsData)[number]["allocations"] = [];

        for (const batch of batches) {
          if (remaining.lte(0)) break;

          const take = Decimal.min(remaining, batch.qtyRemaining);

          // Harga jual per base
          let pricePerBase: Decimal;
          if (item.unitPrice != null) {
            // Override manual (per unit yang dipilih → per base)
            pricePerBase = new Decimal(item.unitPrice)
              .div(conversion)
              .toDecimalPlaces(4);
          } else {
            // Harga yang dikunci di batch saat pembelian
            pricePerBase = new Decimal(batch.sellPricePerBase);
            if (pricePerBase.lte(0)) {
              throw new Error(
                `Harga jual batch #${batch.id} (produk ${item.productId}) belum terisi. ` +
                  `Isi harga batch tersebut sebelum menjual.`
              );
            }
          }

          allocations.push({
            batchId: batch.id,
            qtyBase: take,
            costPerBase: batch.costPerBase,
            pricePerBase,
          });

          remaining = remaining.minus(take);
        }

        if (remaining.gt(0)) {
          const product = await tx.product.findUniqueOrThrow({
            where: { id: item.productId },
          });
          throw new Error(
            `Stok tidak cukup untuk "${product.name}": butuh ${qtyBase.toString()} base, kurang ${remaining.toString()}`
          );
        }

        // Subtotal = Σ(allocation.qtyBase × allocation.pricePerBase)
        const subtotal = allocations
          .reduce(
            (sum, a) => sum.plus(a.qtyBase.mul(a.pricePerBase)),
            new Decimal(0)
          )
          .toDecimalPlaces(2);

        itemsData.push({
          productId: item.productId,
          unitId: item.unitId,
          qty,
          qtyBase,
          subtotal,
          allocations,
        });
      }

      const total = itemsData.reduce(
        (sum, i) => sum.plus(i.subtotal),
        new Decimal(0)
      );

      // ── Simpan Sale ──
      const sale = await tx.sale.create({
        data: {
          invoiceNo,
          customerId: input.customerId,
          salesmanId: input.salesmanId,
          date: saleDate,
          total,
          items: {
            create: itemsData.map((d) => ({
              productId: d.productId,
              unitId: d.unitId,
              qty: d.qty,
              qtyBase: d.qtyBase,
              subtotal: d.subtotal,
            })),
          },
        },
        include: { items: { orderBy: { id: "asc" } } },
      });

      // ── Alokasi batch, kurangi stok, catat movement ──
      for (let i = 0; i < sale.items.length; i++) {
        const saleItem = sale.items[i];
        const data = itemsData[i];

        for (const alloc of data.allocations) {
          // Kurangi stok batch HANYA kalau sisanya masih cukup.
          // Kalau penjualan lain sudah mengambilnya lebih dulu, count = 0
          // dan seluruh transaksi dibatalkan (tidak ada stok negatif).
          const updated = await tx.stockBatch.updateMany({
            where: {
              id: alloc.batchId,
              qtyRemaining: { gte: alloc.qtyBase },
            },
            data: { qtyRemaining: { decrement: alloc.qtyBase } },
          });
          if (updated.count === 0) {
            throw new Error(
              "Stok berubah saat transaksi diproses (ada penjualan lain bersamaan). Silakan coba lagi."
            );
          }

          // Snapshot alokasi
          await tx.saleItemBatch.create({
            data: {
              saleItemId: saleItem.id,
              batchId: alloc.batchId,
              qtyBase: alloc.qtyBase,
              costPerBase: alloc.costPerBase,
              pricePerBase: alloc.pricePerBase,
            },
          });

          // Catat movement (negatif = keluar)
          await tx.stockMovement.create({
            data: {
              productId: data.productId,
              batchId: alloc.batchId,
              type: "SALE",
              qtyBase: alloc.qtyBase.neg(),
              refType: "SaleItem",
              refId: saleItem.id,
            },
          });
        }
      }

      return tx.sale.findUniqueOrThrow({
        where: { id: sale.id },
        include: {
          items: { include: { allocations: true }, orderBy: { id: "asc" } },
          customer: true,
          salesman: true,
        },
      });
    },
    { timeout: 15000 }
  );
}

// ────────── Helper ──────────

type TxClient = Parameters<Parameters<typeof prisma.$transaction>[0]>[0];

async function getConversion(
  tx: TxClient,
  productId: number,
  unitId: number
): Promise<Decimal> {
  const product = await tx.product.findUniqueOrThrow({
    where: { id: productId },
  });

  if (product.baseUnitId === unitId) {
    return new Decimal(1);
  }

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