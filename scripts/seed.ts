/**
 * Seed script — membuat akun pengguna awal dari environment variables.
 * Semua password dan email diambil dari .env (bukan hardcoded di source code).
 *
 * Jalankan dengan:
 *   npx tsx scripts/seed.ts
 */
import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const adminEmail = process.env.SEED_ADMIN_EMAIL;
  const adminPassword = process.env.SEED_ADMIN_PASSWORD;
  const staffEmail = process.env.SEED_STAFF_EMAIL;
  const staffPassword = process.env.SEED_STAFF_PASSWORD;

  if (!adminEmail || !adminPassword) {
    throw new Error(
      "❌ SEED_ADMIN_EMAIL atau SEED_ADMIN_PASSWORD belum diatur di file .env!"
    );
  }

  if (!staffEmail || !staffPassword) {
    throw new Error(
      "❌ SEED_STAFF_EMAIL atau SEED_STAFF_PASSWORD belum diatur di file .env!"
    );
  }

  console.log("🌱 Menjalankan seed akun ke database...\n");

  // ── 1. Akun Admin ──
  const adminHash = await bcrypt.hash(adminPassword, 10);
  const admin = await prisma.user.upsert({
    where: { email: adminEmail.toLowerCase().trim() },
    update: {
      passwordHash: adminHash,
      name: "Administrator",
      role: "ADMIN",
      isActive: true,
    },
    create: {
      name: "Administrator",
      email: adminEmail.toLowerCase().trim(),
      passwordHash: adminHash,
      role: "ADMIN",
      isActive: true,
    },
  });
  console.log(`✅ Admin terdaftar : ${admin.email} (Role: ${admin.role})`);

  // ── 2. Akun Staff ──
  const staffHash = await bcrypt.hash(staffPassword, 10);
  const staff = await prisma.user.upsert({
    where: { email: staffEmail.toLowerCase().trim() },
    update: {
      passwordHash: staffHash,
      name: "Staff",
      role: "CASHIER",
      isActive: true,
    },
    create: {
      name: "Staff",
      email: staffEmail.toLowerCase().trim(),
      passwordHash: staffHash,
      role: "CASHIER",
      isActive: true,
    },
  });
  console.log(`✅ Staff terdaftar : ${staff.email} (Role: ${staff.role})`);

  console.log("\n🎉 Seeding selesai! Data akun dan hash password tersimpan aman di database PostgreSQL.");
  console.log("🔒 Tidak ada password yang di-hardcode di kode aplikasi.");
}

main()
  .catch((e) => {
    console.error(e.message || e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
