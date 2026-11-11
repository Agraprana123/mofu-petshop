"use server";

import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function getRegions(search?: string) {
  return prisma.region.findMany({
    where: search
      ? { name: { contains: search, mode: "insensitive" } }
      : undefined,
    orderBy: { name: "asc" },
    include: {
      _count: { select: { salesmen: true, customers: true } },
    },
  });
}

export async function createRegion(formData: FormData) {
  const name = (formData.get("name") as string)?.trim();
  if (!name) return { error: "Nama wilayah harus diisi" };

  try {
    await prisma.region.create({ data: { name } });
    revalidatePath("/master/regions");
    return { success: true };
  } catch {
    return { error: "Wilayah sudah ada" };
  }
}

export async function updateRegion(id: number, formData: FormData) {
  const name = (formData.get("name") as string)?.trim();
  if (!name) return { error: "Nama wilayah harus diisi" };

  try {
    await prisma.region.update({ where: { id }, data: { name } });
    revalidatePath("/master/regions");
    return { success: true };
  } catch {
    return { error: "Gagal memperbarui wilayah" };
  }
}

export async function deleteRegion(id: number) {
  try {
    await prisma.region.delete({ where: { id } });
    revalidatePath("/master/regions");
    return { success: true };
  } catch {
    return { error: "Wilayah masih digunakan, tidak bisa dihapus" };
  }
}

