"use server";

import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { setSession, clearSession } from "@/lib/auth";
import { redirect } from "next/navigation";

// ────────── Login ──────────

export interface LoginState {
  error?: string;
  success?: boolean;
}

export async function loginAction(
  _prevState: LoginState,
  formData: FormData
): Promise<LoginState> {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  if (!email || !password) {
    return { error: "Email dan password harus diisi" };
  }

  // Cari user di database
  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase().trim() },
  });

  if (!user || !user.isActive) {
    return { error: "Email atau password salah" };
  }

  // Verifikasi password
  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    return { error: "Email atau password salah" };
  }

  // Buat session
  await setSession({
    userId: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
  });

  redirect("/");
}

// ────────── Logout ──────────

export async function logoutAction(): Promise<void> {
  await clearSession();
  redirect("/login");
}

