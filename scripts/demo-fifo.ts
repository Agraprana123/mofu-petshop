/**
 * Demo FIFO — jalankan dengan: npx tsx scripts/demo-fifo.ts
 *
 * Script ini akan:
 * 1. Bersihkan data lama (opsional, untuk testing berulang)
 * 2. Buat master data (unit, kategori, produk, supplier, customer)
 * 3. Buat 2 pembelian dengan harga beli berbeda
 * 4. Buat 1 penjualan yang memotong stok FIFO
 * 5. Tampilkan hasilnya
 */
import { PrismaClient } from "@prisma/client";
import { createPurchase } from "../src/server/services/purchase.service";
import { createSale } from "../src/server/services/sales.service";

const prisma = new PrismaClient({ log: ["warn", "error"] });

async function main() {
  console.log("🧹 Membersihkan data lama...\n");
  // Hapus sesuai urutan foreign key
  await prisma.saleItemBatch.deleteMany();
  await prisma.stockMovement.deleteMany();
  await prisma.saleItem.deleteMany();
  await prisma.sale.deleteMany();
  await prisma.stockBatch.deleteMany();
  await prisma.purchaseItem.deleteMany();
  await prisma.purchase.deleteMany();
  await prisma.productUnit.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();
  await prisma.unit.deleteMany();
  await prisma.supplier.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.salesman.deleteMany();
  await prisma.region.deleteMany();
  await prisma.counter.deleteMany();

  // ── 1. Master data ──
  console.log("📦 Membuat master data...\n");

  const pcsUnit = await prisma.unit.create({
    data: { code: "PCS", name: "Pieces" },
  });
  const sakUnit = await prisma.unit.create({
    data: { code: "SAK", name: "Sak (25 pcs)" },
  });

  const category = await prisma.category.create({
    data: { name: "Makanan Kucing", defaultMarginPercent: 15 },
  });

  const product = await prisma.product.create({
    data: {
      code: "MKN-001",
      name: "Whiskas Tuna 400gr",
      categoryId: category.id,
      baseUnitId: pcsUnit.id,
    },
  });

  // SAK = 25 PCS
  await prisma.productUnit.create({
    data: {
      productId: product.id,
      unitId: sakUnit.id,
      conversionToBase: 25,
    },
  });

  const supplier = await prisma.supplier.create({
    data: { name: "PT Distribusi Pakan", phone: "021-1234567" },
  });

  const region = await prisma.region.create({
    data: { name: "Jakarta Selatan" },
  });

  const salesman = await prisma.salesman.create({
    data: { name: "Budi", phone: "0812-1111-2222", regionId: region.id },
  });

  const customer = await prisma.customer.create({
    data: {
      name: "Toko Hewan Sejahtera",
      phone: "0856-9999-8888",
      regionId: region.id,
    },
  });

  // ── 2. Pembelian batch 1 ──
  console.log("🛒 Pembelian Batch 1: 2 SAK × Rp 200.000 ...");
  const po1 = await createPurchase({
    supplierId: supplier.id,
    items: [
      { productId: product.id, unitId: sakUnit.id, qty: 2, unitCost: 200_000 },
    ],
  });
  console.log(`   → ${po1.invoiceNo}  |  Total: Rp ${po1.total}\n`);

  // ── 3. Pembelian batch 2 (harga naik) ──
  console.log("🛒 Pembelian Batch 2: 1 SAK × Rp 250.000 ...");
  const po2 = await createPurchase({
    supplierId: supplier.id,
    items: [
      { productId: product.id, unitId: sakUnit.id, qty: 1, unitCost: 250_000 },
    ],
  });
  console.log(`   → ${po2.invoiceNo}  |  Total: Rp ${po2.total}\n`);

  // Cek stok
  const batchesBefore = await prisma.stockBatch.findMany({
    where: { productId: product.id },
    orderBy: { receivedAt: "asc" },
  });
  console.log("📊 Stok batch sebelum penjualan:");
  for (const b of batchesBefore) {
    console.log(
      `   Batch #${b.id}  |  masuk: ${b.qtyIn} pcs  |  sisa: ${b.qtyRemaining} pcs  |  modal/pcs: Rp ${b.costPerBase}`
    );
  }
  console.log();

  // ── 4. Penjualan 60 PCS (FIFO: 50 dari batch 1, 10 dari batch 2) ──
  console.log("💰 Penjualan: 60 PCS Whiskas Tuna ...");
  const sale = await createSale({
    customerId: customer.id,
    salesmanId: salesman.id,
    items: [
      { productId: product.id, unitId: pcsUnit.id, qty: 60 },
    ],
  });
  console.log(`   → ${sale.invoiceNo}  |  Total: Rp ${sale.total}\n`);

  // ── 5. Lihat alokasi FIFO ──
  console.log("🔍 Detail alokasi FIFO:");
  for (const si of sale.items) {
    for (const alloc of si.allocations) {
      console.log(
        `   Batch #${alloc.batchId}  |  ambil: ${alloc.qtyBase} pcs  |  modal/pcs: Rp ${alloc.costPerBase}  |  jual/pcs: Rp ${alloc.pricePerBase}`
      );
    }
  }
  console.log();

  // ── 6. Cek sisa stok ──
  const batchesAfter = await prisma.stockBatch.findMany({
    where: { productId: product.id },
    orderBy: { receivedAt: "asc" },
  });
  console.log("📊 Stok batch setelah penjualan:");
  for (const b of batchesAfter) {
    console.log(
      `   Batch #${b.id}  |  masuk: ${b.qtyIn} pcs  |  sisa: ${b.qtyRemaining} pcs  |  modal/pcs: Rp ${b.costPerBase}`
    );
  }
  console.log();

  // ── 7. Rekap movement ──
  const movements = await prisma.stockMovement.findMany({
    where: { productId: product.id },
    orderBy: { createdAt: "asc" },
  });
  console.log("📋 Rekap StockMovement:");
  for (const m of movements) {
    const sign = m.qtyBase.greaterThanOrEqualTo(0) ? "+" : "";
    console.log(
      `   ${m.type.padEnd(12)} |  batch #${m.batchId}  |  ${sign}${m.qtyBase} pcs  |  ref: ${m.refType} #${m.refId}`
    );
  }

  console.log("\n✅ Demo selesai!");
}

main()
  .catch((e) => {
    console.error("❌ Error:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

