"use server";

import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function getCustomers(search?: string) {
  return prisma.customer.findMany({
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

export async function createCustomer(formData: FormData) {
  const name = (formData.get("name") as string)?.trim();
  const phone = (formData.get("phone") as string)?.trim() || null;
  const address = (formData.get("address") as string)?.trim() || null;
  const regionId = formData.get("regionId") ? parseInt(formData.get("regionId") as string) : null;

  if (!name) return { error: "Nama customer harus diisi" };

  await prisma.customer.create({ data: { name, phone, address, regionId } });
  revalidatePath("/master/customers");
  return { success: true };
}

export async function updateCustomer(id: number, formData: FormData) {
  const name = (formData.get("name") as string)?.trim();
  const phone = (formData.get("phone") as string)?.trim() || null;
  const address = (formData.get("address") as string)?.trim() || null;
  const regionId = formData.get("regionId") ? parseInt(formData.get("regionId") as string) : null;

  if (!name) return { error: "Nama customer harus diisi" };

  await prisma.customer.update({ where: { id }, data: { name, phone, address, regionId } });
  revalidatePath("/master/customers");
  return { success: true };
}

export async function deleteCustomer(id: number) {
  try {
    await prisma.customer.delete({ where: { id } });
    revalidatePath("/master/customers");
    return { success: true };
  } catch {
    return { error: "Customer masih memiliki data penjualan, tidak bisa dihapus" };
  }
}

