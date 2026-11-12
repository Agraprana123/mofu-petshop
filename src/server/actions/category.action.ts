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

export async function deleteCategory(id: number, moveToCategoryId?: number) {
  try {
    const category = await prisma.category.findUnique({
      where: { id },
      include: {
        _count: { select: { products: true } },
      },
    });

    if (!category) return { error: "Kategori tidak ditemukan" };

    if (category._count.products > 0) {
      if (moveToCategoryId && moveToCategoryId !== id) {
        await prisma.$transaction([
          prisma.product.updateMany({
            where: { categoryId: id },
            data: { categoryId: moveToCategoryId },
          }),
          prisma.category.delete({ where: { id } }),
        ]);
        revalidatePath("/master/categories");
        revalidatePath("/master/products");
        return { success: true, reassigned: true };
      }

      return {
        error: "HAS_PRODUCTS",
        count: category._count.products,
        message: `Kategori "${category.name}" masih digunakan oleh ${category._count.products} produk. Pindahkan produk ke kategori lain terlebih dahulu jika ingin menghapus.`,
      };
    }

    await prisma.category.delete({ where: { id } });
    revalidatePath("/master/categories");
    return { success: true };
  } catch {
    return { error: "Gagal menghapus kategori" };
  }
}

