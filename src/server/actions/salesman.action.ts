"use server";

import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function getSalesmen(search?: string) {
  return prisma.salesman.findMany({
    where: search
      ? {
          OR: [
            { name: { contains: search, mode: "insensitive" } },
            { phone: { contains: search, mode: "insensitive" } },
          ],
        }
      : undefined,
    orderBy: { name: "asc" },
    include: { region: true, _count: { select: { sales: true } } },
  });
}

export async function createSalesman(formData: FormData) {
  const name = (formData.get("name") as string)?.trim();
  const phone = (formData.get("phone") as string)?.trim() || null;
  const regionId = formData.get("regionId") ? parseInt(formData.get("regionId") as string) : null;

  if (!name) return { error: "Nama salesman harus diisi" };

  await prisma.salesman.create({ data: { name, phone, regionId } });
  revalidatePath("/master/salesmen");
  return { success: true };
}

export async function updateSalesman(id: number, formData: FormData) {
  const name = (formData.get("name") as string)?.trim();
  const phone = (formData.get("phone") as string)?.trim() || null;
  const regionId = formData.get("regionId") ? parseInt(formData.get("regionId") as string) : null;
  const isActive = formData.get("isActive") === "true";

  if (!name) return { error: "Nama salesman harus diisi" };

  await prisma.salesman.update({
    where: { id },
    data: { name, phone, regionId, isActive },
  });
  revalidatePath("/master/salesmen");
  return { success: true };
}

export async function deleteSalesman(id: number) {
  try {
    await prisma.salesman.delete({ where: { id } });
    revalidatePath("/master/salesmen");
    return { success: true };
  } catch {
    return { error: "Salesman masih memiliki data penjualan, tidak bisa dihapus" };
  }
}

