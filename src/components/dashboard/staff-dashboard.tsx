"use client";

import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  CheckCircle2,
  Package,
  RotateCcw,
  ShoppingCart,
  TrendingUp,
  Wallet,
} from "lucide-react";
import type { SessionPayload } from "@/lib/auth";

interface StaffDashboardProps {
  session: SessionPayload;
  stats: {
    totalProducts: number;
    totalSales: number;
    totalPurchases: number;
    totalSuppliers: number;
    totalCustomers: number;
  };
  todaySalesTotal: number;
  todaySalesCount: number;
  todayLabel: string;
  recentSales: {
    id: number;
    invoiceNo: string;
    total: string;
    date: string;
    customer: { name: string } | null;
    paymentStatus: string;
  }[];
}

export function StaffDashboard({
  session,
  stats,
  todaySalesTotal,
  todaySalesCount,
  todayLabel,
  recentSales,
}: StaffDashboardProps) {
  const firstName = session.name.split(" ")[0];

  const statCards = [
    {
      label: "Penjualan Hari Ini",
      value: `Rp ${todaySalesTotal.toLocaleString("id-ID")}`,
      hint: `${todaySalesCount} transaksi hari ini`,
      icon: Wallet,
      tone: "bg-emerald-50 text-emerald-600",
    },
    {
      label: "Total Transaksi",
      value: stats.totalSales.toLocaleString("id-ID"),
      hint: "Seluruh transaksi penjualan",
      icon: ShoppingCart,
      tone: "bg-[#87482D]/10 text-[#87482D]",
    },
    {
      label: "Produk Aktif",
      value: stats.totalProducts.toLocaleString("id-ID"),
      hint: "Produk yang siap dijual",
      icon: Package,
      tone: "bg-sky-50 text-sky-600",
    },
  ];

  return (
    <div className="page-enter space-y-6">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#87482D] via-[#7c4229] to-[#5f3220] p-6 text-white shadow-xl shadow-[#87482D]/20 sm:p-8">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -right-20 -top-24 size-80 rounded-full bg-white/10 blur-2xl" />
          <div className="absolute -bottom-28 left-1/3 size-72 rounded-full bg-black/10 blur-2xl" />
        </div>

        <div className="relative grid gap-6 lg:grid-cols-[1.5fr_1fr] lg:items-center">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-[11px] font-semibold text-white/80 ring-1 ring-white/15">
              <span className="size-1.5 rounded-full bg-emerald-300" />
              {todayLabel}
            </span>
            <h1 className="mt-4 font-display text-2xl font-bold tracking-tight sm:text-3xl">
              Halo, {firstName}
            </h1>
            <p className="mt-1.5 max-w-lg text-sm leading-relaxed text-white/65">
              Siap melayani pelanggan hari ini? Mulai transaksi baru dengan
              cepat dan pastikan setiap penjualan tercatat rapi.
            </p>
            <div className="mt-5 flex flex-wrap gap-2.5">
              <Link
                href="/transactions/sales"
                className="inline-flex h-11 items-center gap-2 rounded-xl bg-[#FBF7F3] px-4 text-sm font-semibold text-[#87482D] shadow-lg shadow-black/10 transition-all hover:-translate-y-0.5 hover:bg-white active:scale-[0.98]"
              >
                <ShoppingCart className="size-4" />
                Mulai Transaksi
              </Link>
              <Link
                href="/returns"
                className="inline-flex h-11 items-center gap-2 rounded-xl bg-white/10 px-4 text-sm font-semibold text-white ring-1 ring-white/20 transition-all hover:bg-white/15 active:scale-[0.98]"
              >
                <RotateCcw className="size-4" />
                Proses Retur
              </Link>
            </div>
          </div>

          <div className="rounded-2xl bg-white/10 p-4 ring-1 ring-white/15 backdrop-blur-sm">
            <div className="flex items-center justify-between">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-white/55">
                Omzet hari ini
              </p>
              <span className="grid size-8 place-items-center rounded-lg bg-white/10">
                <TrendingUp className="size-4 text-emerald-300" />
              </span>
            </div>
            <p className="mt-3 font-display text-3xl font-bold tracking-tight">
              Rp {todaySalesTotal.toLocaleString("id-ID")}
            </p>
            <div className="mt-3 flex items-center gap-2 border-t border-white/10 pt-3 text-[12px] text-white/60">
              <CheckCircle2 className="size-3.5 text-emerald-300" />
              {todaySalesCount} transaksi selesai
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {statCards.map((card, index) => {
          const Icon = card.icon;
          return (
            <div
              key={card.label}
              style={{ animationDelay: `${index * 45}ms` }}
              className="animate-enter rounded-2xl border border-zinc-200/70 bg-white p-5 shadow-[0_1px_2px_rgba(24,25,26,0.04),0_16px_40px_-32px_rgba(24,25,26,0.25)] transition-all duration-200 hover:-translate-y-0.5 hover:border-zinc-300 hover:shadow-lg hover:shadow-zinc-950/5"
            >
              <div
                className={`grid size-11 place-items-center rounded-xl ${card.tone}`}
              >
                <Icon className="size-5" />
              </div>
              <p className="mt-4 font-display text-2xl font-bold tracking-tight text-zinc-900">
                {card.value}
              </p>
              <p className="mt-1 text-[13px] font-medium text-zinc-500">
                {card.label}
              </p>
              <p className="mt-2 text-[11px] text-zinc-400">{card.hint}</p>
            </div>
          );
        })}
      </section>

      {/* Quick actions */}
      <section className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {[
          {
            label: "Transaksi Penjualan",
            description: "Buka kasir dan buat faktur baru",
            href: "/transactions/sales",
            icon: ShoppingCart,
            tone: "bg-[#87482D] text-white",
          },
          {
            label: "Retur Barang",
            description: "Catat retur customer atau supplier",
            href: "/returns",
            icon: RotateCcw,
            tone: "bg-[#87482D]/10 text-[#87482D]",
          },
        ].map((action) => {
          const Icon = action.icon;
          return (
            <Link
              key={action.href}
              href={action.href}
              className="group flex items-center gap-3 rounded-2xl border border-zinc-200/70 bg-white p-4 shadow-xs transition-all duration-200 hover:-translate-y-0.5 hover:border-[#87482D]/25 hover:shadow-md hover:shadow-[#87482D]/5"
            >
              <span
                className={`grid size-11 shrink-0 place-items-center rounded-xl ${action.tone}`}
              >
                <Icon className="size-5" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-[13px] font-semibold text-zinc-900">
                  {action.label}
                </span>
                <span className="block truncate text-[11px] text-zinc-400">
                  {action.description}
                </span>
              </span>
              <ArrowRight className="size-4 -translate-x-1 text-zinc-300 opacity-0 transition-all group-hover:translate-x-0 group-hover:text-[#87482D] group-hover:opacity-100" />
            </Link>
          );
        })}
      </section>

      {/* Recent sales */}
      <section className="overflow-hidden rounded-2xl border border-zinc-200/70 bg-white shadow-[0_1px_2px_rgba(24,25,26,0.04),0_16px_40px_-32px_rgba(24,25,26,0.25)]">
        <div className="flex items-center justify-between gap-3 border-b border-zinc-100 px-5 py-4">
          <div>
            <h2 className="font-display text-base font-semibold text-zinc-900">
              Transaksi Terbaru
            </h2>
            <p className="mt-0.5 text-[11px] text-zinc-400">
              Aktivitas penjualan terakhir
            </p>
          </div>
          <Link
            href="/transactions/sales"
            className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[12px] font-semibold text-[#87482D] transition-colors hover:bg-[#87482D]/5"
          >
            Lihat semua
            <ArrowUpRight className="size-3.5" />
          </Link>
        </div>

        {recentSales.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-6 py-14 text-center">
            <span className="grid size-14 place-items-center rounded-2xl bg-[#87482D]/8 text-[#87482D]">
              <ShoppingCart className="size-6" />
            </span>
            <p className="mt-4 text-sm font-semibold text-zinc-700">
              Belum ada transaksi
            </p>
            <p className="mt-1 text-xs text-zinc-400">
              Mulai transaksi pertama Anda hari ini.
            </p>
            <Link
              href="/transactions/sales"
              className="mt-4 inline-flex h-9 items-center gap-2 rounded-xl bg-[#87482D] px-3.5 text-xs font-semibold text-white transition-colors hover:bg-[#6d3a24]"
            >
              <ShoppingCart className="size-3.5" />
              Buka Kasir
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-zinc-100">
            {recentSales.map((sale) => (
              <Link
                key={sale.id}
                href="/transactions/sales"
                className="flex items-center gap-3 px-5 py-3.5 transition-colors hover:bg-zinc-50/80"
              >
                <span className="grid size-10 shrink-0 place-items-center rounded-full bg-[#87482D]/8 text-[12px] font-bold text-[#87482D]">
                  {(sale.customer?.name ?? "Umum")
                    .split(" ")
                    .slice(0, 2)
                    .map((word) => word.charAt(0))
                    .join("")
                    .toUpperCase()}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] font-semibold text-zinc-900">
                    {sale.customer?.name ?? "Pelanggan Umum"}
                  </p>
                  <p className="mt-0.5 flex items-center gap-1.5 text-[11px] text-zinc-400">
                    <span className="font-mono text-[10px]">
                      {sale.invoiceNo}
                    </span>
                    <span className="size-0.5 rounded-full bg-zinc-300" />
                    {new Date(sale.date).toLocaleDateString("id-ID", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-[13px] font-bold tabular-nums text-zinc-900">
                    Rp {Number(sale.total).toLocaleString("id-ID")}
                  </p>
                  <span className="mt-1 inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-600">
                    <span className="size-1.5 rounded-full bg-emerald-500" />
                    Selesai
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
