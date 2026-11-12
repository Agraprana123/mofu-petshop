/**
 * Hapus seluruh data demo/transaksi dan master data,
 * TANPA menghapus akun user (admin/staff).
 *
 * Jalankan dengan:
 *   npx tsx scripts/reset-demo-data.ts --yes
 *
 * Flag --yes wajib agar tidak terhapus tanpa sengaja.
 * Setelah ini jalankan:
 *   npx tsx scripts/import-real-products.ts
 */
import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Urutan mengikuti foreign key (anak → induk).
// User sengaja TIDAK ada di daftar ini.
const TABLES = [
  "sale_item_batches",
  "stock_movements",
  "sale_items",
  "sales",
  "stock_batches",
  "purchase_items",
  "purchases",
  "product_units",
  "products",
  "categories",
  "units",
  "suppliers",
  "customers",
  "salesmen",
  "regions",
  "counters",
];

async function main() {
  if (!process.argv.includes("--yes")) {
    console.error(
      "⚠️  Perintah ini akan menghapus SEMUA data master & transaksi (akun user tetap aman)."
    );
    console.error("   Jalankan ulang dengan flag --yes untuk melanjutkan:");
    console.error("   npx tsx scripts/reset-demo-data.ts --yes\n");
    process.exit(1);
  }

  const users = await prisma.user.findMany({
    orderBy: { id: "asc" },
    select: { id: true, name: true, email: true, role: true },
  });

  console.log("Akun user yang dipertahankan:");
  for (const u of users) {
    console.log(`  #${u.id}  ${u.email}  (${u.role})`);
  }

  const tableList = TABLES.map((t) => `"${t}"`).join(", ");
  await prisma.$executeRawUnsafe(
    `TRUNCATE TABLE ${tableList} RESTART IDENTITY CASCADE;`
  );

  console.log(
    `\n✅ Data demo dihapus: ${TABLES.length} tabel dikosongkan dan ID di-reset.`
  );
  console.log("   Akun user tidak tersentuh.");
}

main()
  .catch((e) => {
    console.error("❌ Gagal menghapus data demo:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
