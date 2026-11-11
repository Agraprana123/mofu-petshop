"use server";

import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function getUnits(search?: string) {
  return prisma.unit.findMany({
    where: search
      ? {
          OR: [
            { code: { contains: search, mode: "insensitive" } },
            { name: { contains: search, mode: "insensitive" } },
          ],
        }
      : undefined,
    orderBy: { code: "asc" },
  });
}

export async function createUnit(formData: FormData) {
  const code = (formData.get("code") as string)?.trim().toUpperCase();
  const name = (formData.get("name") as string)?.trim();

  if (!code) return { error: "Kode satuan harus diisi" };
  if (!name) return { error: "Nama satuan harus diisi" };

  try {
    await prisma.unit.create({ data: { code, name } });
    revalidatePath("/master/units");
    return { success: true };
  } catch {
    return { error: "Kode satuan sudah ada" };
  }
}

export async function updateUnit(id: number, formData: FormData) {
  const code = (formData.get("code") as string)?.trim().toUpperCase();
  const name = (formData.get("name") as string)?.trim();

  if (!code) return { error: "Kode satuan harus diisi" };
  if (!name) return { error: "Nama satuan harus diisi" };

  try {
    await prisma.unit.update({ where: { id }, data: { code, name } });
    revalidatePath("/master/units");
    return { success: true };
  } catch {
    return { error: "Gagal memperbarui satuan" };
  }
}

export async function deleteUnit(id: number) {
  try {
    await prisma.unit.delete({ where: { id } });
    revalidatePath("/master/units");
    return { success: true };
  } catch {
    return { error: "Satuan masih digunakan, tidak bisa dihapus" };
  }
}

