"use server";

import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function getSuppliers(search?: string) {
  return prisma.supplier.findMany({
    where: search
      ? {
          OR: [
            { name: { contains: search, mode: "insensitive" } },
            { phone: { contains: search, mode: "insensitive" } },
          ],
        }
      : undefined,
    orderBy: { name: "asc" },
    include: { _count: { select: { purchases: true } } },
  });
}

export async function createSupplier(formData: FormData) {
  const name = (formData.get("name") as string)?.trim();
  const phone = (formData.get("phone") as string)?.trim() || null;
  const address = (formData.get("address") as string)?.trim() || null;

  if (!name) return { error: "Nama supplier harus diisi" };

  await prisma.supplier.create({ data: { name, phone, address } });
  revalidatePath("/master/suppliers");
  return { success: true };
}

export async function updateSupplier(id: number, formData: FormData) {
  const name = (formData.get("name") as string)?.trim();
  const phone = (formData.get("phone") as string)?.trim() || null;
  const address = (formData.get("address") as string)?.trim() || null;

  if (!name) return { error: "Nama supplier harus diisi" };

  await prisma.supplier.update({ where: { id }, data: { name, phone, address } });
  revalidatePath("/master/suppliers");
  return { success: true };
}

export async function deleteSupplier(id: number) {
  try {
    await prisma.supplier.delete({ where: { id } });
    revalidatePath("/master/suppliers");
    return { success: true };
  } catch {
    return { error: "Supplier masih memiliki data pembelian, tidak bisa dihapus" };
  }
}

