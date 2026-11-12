"use client";

import { useActionState, useState } from "react";
import {
  ArrowRight,
  BarChart3,
  Boxes,
  Eye,
  EyeOff,
  Loader2,
  PawPrint,
  ShieldCheck,
  ShoppingCart,
} from "lucide-react";
import { loginAction, type LoginState } from "@/server/actions/auth.action";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const FEATURES = [
  {
    icon: ShoppingCart,
    title: "Kasir & penjualan FIFO",
    description: "Harga jual otomatis mengikuti batch stok tertua.",
  },
  {
    icon: Boxes,
    title: "Stok selalu terpantau",
    description: "Notifikasi stok kritis dan riwayat pergerakan barang.",
  },
  {
    icon: BarChart3,
    title: "Laporan siap pakai",
    description: "Omzet, profit, fast moving, dan slow moving.",
  },
];

export function LoginForm() {
  const [state, formAction, isPending] = useActionState<LoginState, FormData>(
    loginAction,
    {}
  );
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[1.05fr_1fr]">
      {/* Brand panel */}
      <section className="relative hidden overflow-hidden bg-gradient-to-br from-[#87482D] via-[#7c4229] to-[#5a2f1e] p-10 text-white lg:flex lg:flex-col lg:justify-between xl:p-14">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -right-32 -top-32 size-[28rem] rounded-full bg-white/10 blur-3xl" />
          <div className="absolute -bottom-40 -left-24 size-[26rem] rounded-full bg-black/15 blur-3xl" />
          <div className="absolute right-10 top-1/2 hidden -translate-y-1/2 rotate-12 opacity-[0.06] xl:block">
            <PawPrint className="size-96" />
          </div>
        </div>

        <div className="relative flex items-center gap-3">
          <div className="grid size-12 place-items-center rounded-2xl bg-[#FBF7F3] text-[#87482D] shadow-lg shadow-black/15">
            <PawPrint className="size-6" />
          </div>
          <div>
            <p className="font-display text-lg font-bold leading-tight">MOFU</p>
            <p className="text-[11px] font-medium text-white/60">
              Petshop &amp; Care
            </p>
          </div>
        </div>

        <div className="relative max-w-lg py-12">
          <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-[11px] font-semibold text-white/80 ring-1 ring-white/15">
            <span className="size-1.5 rounded-full bg-emerald-300" />
            Sistem Kasir &amp; Inventori
          </span>
          <h1 className="mt-5 font-display text-4xl font-bold leading-[1.15] tracking-tight xl:text-[42px]">
            Kelola petshop lebih rapi dalam satu tempat.
          </h1>
          <p className="mt-4 max-w-md text-[15px] leading-relaxed text-white/65">
            Mulai dari transaksi kasir, stok FIFO, hingga laporan penjualan —
            semua tercatat otomatis dan mudah ditelusuri.
          </p>

          <ul className="mt-8 space-y-4">
            {FEATURES.map((feature) => {
              const Icon = feature.icon;
              return (
                <li key={feature.title} className="flex items-start gap-3.5">
                  <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-white/10 text-white ring-1 ring-white/15">
                    <Icon className="size-5" />
                  </span>
                  <span>
                    <span className="block text-[13px] font-semibold text-white">
                      {feature.title}
                    </span>
                    <span className="mt-0.5 block text-[12px] leading-relaxed text-white/55">
                      {feature.description}
                    </span>
                  </span>
                </li>
              );
            })}
          </ul>
        </div>

        <div className="relative flex items-center gap-2 text-[11px] text-white/45">
          <ShieldCheck className="size-3.5" />
          © {new Date().getFullYear()} MOFU Petshop &amp; Care
        </div>
      </section>

      {/* Form panel */}
      <section className="relative flex min-h-screen flex-col justify-center px-5 py-10 sm:px-8 lg:min-h-0 lg:px-12">
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -right-24 -top-24 size-72 rounded-full bg-[#87482D]/6 blur-3xl" />
        </div>

        <div className="relative mx-auto w-full max-w-sm animate-enter">
          {/* Mobile brand */}
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <div className="grid size-12 place-items-center rounded-2xl bg-[#87482D] text-white shadow-lg shadow-[#87482D]/25">
              <PawPrint className="size-6" />
            </div>
            <div>
              <p className="font-display text-lg font-bold leading-tight text-zinc-900">
                MOFU
              </p>
              <p className="text-[11px] font-medium text-zinc-400">
                Petshop &amp; Care
              </p>
            </div>
          </div>

          <div>
            <h2 className="font-display text-[26px] font-bold tracking-tight text-zinc-900">
              Masuk ke akun
            </h2>
            <p className="mt-1.5 text-sm text-zinc-500">
              Gunakan email dan password yang terdaftar untuk melanjutkan.
            </p>
          </div>

          {state.error && (
            <div
              role="alert"
              className="mt-6 animate-pop rounded-xl border border-red-200 bg-red-50 p-3 text-[13px] font-medium text-red-700"
            >
              {state.error}
            </div>
          )}

          <form action={formAction} className="mt-7 space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="nama@mofu.com"
                required
                autoComplete="email"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  required
                  autoComplete="current-password"
                  className="pr-11"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((value) => !value)}
                  aria-label={
                    showPassword ? "Sembunyikan password" : "Tampilkan password"
                  }
                  className="absolute right-1.5 top-1/2 grid size-8 -translate-y-1/2 place-items-center rounded-lg text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-700"
                >
                  {showPassword ? (
                    <EyeOff className="size-4" />
                  ) : (
                    <Eye className="size-4" />
                  )}
                </button>
              </div>
            </div>

            <Button type="submit" size="lg" className="w-full" disabled={isPending}>
              {isPending ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Memproses...
                </>
              ) : (
                <>
                  Masuk
                  <ArrowRight className="size-4" />
                </>
              )}
            </Button>
          </form>

          <p className="mt-8 text-center text-[11px] leading-relaxed text-zinc-400 lg:hidden">
            © {new Date().getFullYear()} MOFU Petshop &amp; Care
          </p>
        </div>
      </section>
    </div>
  );
}
