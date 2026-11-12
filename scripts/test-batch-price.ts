/**
 * Tes inti logika Fariz: harga & margin DIKUNCI per batch.
 *
 *   Beli 20 @ 400 margin 10% → 440   (batch 1, minggu lalu)
 *   Beli 20 @ 410 margin 10% → 451   (batch 2)
 *   Jual 10                  → semua 440
 *   Margin master diubah ke 50%
 *   Jual 15                  → 10 × 440 + 5 × 451  (HARUS tidak terpengaruh master)
 *
 * Simpan sebagai scripts/test-batch-price.ts
 * Jalankan: npx tsx scripts/test-batch-price.ts
 */
import { prisma } from "@/lib/db";
import { createPurchase } from "@/server/services/purchase.service";
import { createSale } from "@/server/services/sales.service";

async function main() {
  const suffix = Date.now().toString().slice(-6);

  const category = await prisma.category.upsert({
    where: { name: "DEMO-LOCK" },
    update: {},
    create: { name: "DEMO-LOCK", defaultMarginPercent: 10 },
  });
  const pcs = await prisma.unit.upsert({
    where: { code: "PCS" },
    update: {},
    create: { code: "PCS", name: "Pieces" },
  });
  const supplier = await prisma.supplier.create({
    data: { name: `Supplier Tes ${suffix}` },
  });
  const product = await prisma.product.create({
    data: {
      code: `TES-${suffix}`,
      name: "Barang A (tes harga batch)",
      categoryId: category.id,
      baseUnitId: pcs.id,
      units: { create: [{ unitId: pcs.id, conversionToBase: 1 }] },
    },
  });

  await createPurchase({
    supplierId: supplier.id,
    date: new Date(Date.now() - 7 * 24 * 3600 * 1000),
    items: [
      { productId: product.id, unitId: pcs.id, qty: 20, unitCost: 400, marginPercent: 10 },
    ],
  });
  await createPurchase({
    supplierId: supplier.id,
    items: [
      { productId: product.id, unitId: pcs.id, qty: 20, unitCost: 410, marginPercent: 10 },
    ],
  });

  console.log("Batch tersimpan:");
  const batches = await prisma.stockBatch.findMany({
    where: { productId: product.id },
    orderBy: { id: "asc" },
  });
  for (const b of batches) {
    console.log(
      `  #${b.id}  modal ${b.costPerBase}  margin ${b.marginPercent}%  jual ${b.sellPricePerBase}`
    );
  }

  const sale1 = await createSale({
    items: [{ productId: product.id, unitId: pcs.id, qty: 10 }],
  });
  console.log(`\nJual 10 → total ${sale1.total} (harus 4400)`);

  // Ubah margin master. Harga batch yang sudah ada TIDAK boleh ikut berubah.
  await prisma.product.update({
    where: { id: product.id },
    data: { marginPercent: 50 },
  });
  await prisma.category.update({
    where: { id: category.id },
    data: { defaultMarginPercent: 50 },
  });
  console.log("Margin master diubah ke 50%");

  const sale2 = await createSale({
    items: [{ productId: product.id, unitId: pcs.id, qty: 15 }],
  });
  const allocs = sale2.items[0].allocations.map((a) => ({
    qty: Number(a.qtyBase),
    price: Number(a.pricePerBase),
  }));
  console.log(`\nJual 15 → total ${sale2.total}`);
  for (const a of allocs) console.log(`  ${a.qty} × ${a.price}`);

  const ok =
    allocs.length === 2 &&
    allocs[0].qty === 10 && allocs[0].price === 440 &&
    allocs[1].qty === 5 && allocs[1].price === 451;

  console.log(
    ok
      ? "\n✅ LULUS: harga terkunci per batch (10 × 440 + 5 × 451)"
      : "\n❌ GAGAL: harga masih mengikuti master atau tidak sesuai harapan"
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());