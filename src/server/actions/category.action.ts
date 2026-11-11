"use server";

import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function getCategories(search?: string) {
  return prisma.category.findMany({
    where: search
      ? { name: { contains: search, mode: "insensitive" } }
      : undefined,
    orderBy: { name: "asc" },
    include: { _count: { select: { products: true } } },
  });
}

export async function createCategory(formData: FormData) {
  const name = (formData.get("name") as string)?.trim();
  const margin = parseFloat(formData.get("defaultMarginPercent") as string);

  if (!name) return { error: "Nama kategori harus diisi" };
  if (isNaN(margin) || margin < 0) return { error: "Margin tidak valid" };

  try {
    await prisma.category.create({
      data: { name, defaultMarginPercent: margin },
    });
    revalidatePath("/master/categories");
    return { success: true };
  } catch {
    return { error: "Kategori sudah ada atau terjadi kesalahan" };
  }
}

export async function updateCategory(id: number, formData: FormData) {
  const name = (formData.get("name") as string)?.trim();
  const margin = parseFloat(formData.get("defaultMarginPercent") as string);

  if (!name) return { error: "Nama kategori harus diisi" };
  if (isNaN(margin) || margin < 0) return { error: "Margin tidak valid" };

  try {
    await prisma.category.update({
      where: { id },
      data: { name, defaultMarginPercent: margin },
    });
    revalidatePath("/master/categories");
    return { success: true };
  } catch {
    return { error: "Gagal memperbarui kategori" };
  }
}

export async function deleteCategory(id: number) {
  try {
    await prisma.category.delete({ where: { id } });
    revalidatePath("/master/categories");
    return { success: true };
  } catch {
    return { error: "Kategori masih digunakan oleh produk, tidak bisa dihapus" };
  }
}

