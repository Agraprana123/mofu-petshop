import { PrismaClient } from "@prisma/client";

/**
 * Generate nomor faktur otomatis dengan format: PREFIX-YYYYMM-NNNN
 *
 * Contoh:
 *   nextNumber(prisma, "PUR") → "PUR-202611-0001"
 *   nextNumber(prisma, "SAL") → "SAL-202611-0001"
 *
 * Counter key-nya menyertakan bulan sehingga setiap bulan reset ke 1.
 */
export async function nextNumber(
  tx: Omit<PrismaClient, "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends">,
  prefix: string
): Promise<string> {
  const now = new Date();
  const yyyymm = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}`;
  const key = `${prefix}-${yyyymm}`;

  // Upsert atomik: buat key kalau belum ada, atau increment kalau sudah ada
  const counter = await tx.counter.upsert({
    where: { key },
    update: { value: { increment: 1 } },
    create: { key, value: 1 },
  });

  const seq = String(counter.value).padStart(4, "0");
  return `${prefix}-${yyyymm}-${seq}`;
}

