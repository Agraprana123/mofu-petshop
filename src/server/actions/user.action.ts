"use server";

import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";
import type { Role } from "@prisma/client";

export interface ActionResult {
  success?: boolean;
  error?: string;
}

export async function createUser(formData: FormData): Promise<ActionResult> {
  const name = (formData.get("name") as string)?.trim();
  const email = (formData.get("email") as string)?.trim().toLowerCase();
  const password = formData.get("password") as string;
  const role = (formData.get("role") as Role) || "CASHIER";

  if (!name || !email || !password) {
    return { error: "Nama, email, dan password wajib diisi." };
  }

  if (password.length < 6) {
    return { error: "Password minimal 6 karakter." };
  }

  try {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return { error: `Email "${email}" sudah terdaftar.` };
    }

    const passwordHash = await bcrypt.hash(password, 10);

    await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
        role,
        isActive: true,
      },
    });

    revalidatePath("/settings/users");
    return { success: true };
  } catch (err: unknown) {
    console.error("Create user error:", err);
    return { error: "Gagal menambahkan user baru." };
  }
}

export async function updateUser(
  id: number,
  formData: FormData
): Promise<ActionResult> {
  const name = (formData.get("name") as string)?.trim();
  const email = (formData.get("email") as string)?.trim().toLowerCase();
  const role = formData.get("role") as Role;
  const isActive = formData.get("isActive") === "true";
  const newPassword = formData.get("password") as string;

  if (!name || !email) {
    return { error: "Nama dan email wajib diisi." };
  }

  try {
    const existing = await prisma.user.findFirst({
      where: {
        email,
        NOT: { id },
      },
    });

    if (existing) {
      return { error: `Email "${email}" sudah digunakan oleh akun lain.` };
    }

    const dataToUpdate: {
      name: string;
      email: string;
      role: Role;
      isActive: boolean;
      passwordHash?: string;
    } = {
      name,
      email,
      role,
      isActive,
    };

    if (newPassword && newPassword.trim().length > 0) {
      if (newPassword.length < 6) {
        return { error: "Password baru minimal 6 karakter." };
      }
      dataToUpdate.passwordHash = await bcrypt.hash(newPassword, 10);
    }

    await prisma.user.update({
      where: { id },
      data: dataToUpdate,
    });

    revalidatePath("/settings/users");
    return { success: true };
  } catch (err: unknown) {
    console.error("Update user error:", err);
    return { error: "Gagal memperbarui user." };
  }
}

export async function deleteUser(
  id: number,
  currentUserId: number
): Promise<ActionResult> {
  if (id === currentUserId) {
    return { error: "Anda tidak dapat menghapus akun Anda sendiri yang sedang aktif." };
  }

  try {
    const userCount = await prisma.user.count({ where: { role: "ADMIN" } });
    const targetUser = await prisma.user.findUnique({ where: { id } });

    if (targetUser?.role === "ADMIN" && userCount <= 1) {
      return { error: "Sistem harus memiliki minimal 1 Administrator." };
    }

    await prisma.user.delete({ where: { id } });
    revalidatePath("/settings/users");
    return { success: true };
  } catch (err: unknown) {
    console.error("Delete user error:", err);
    return { error: "Gagal menghapus user. User mungkin memiliki relasi data lain." };
  }
}

