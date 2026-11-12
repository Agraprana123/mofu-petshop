"use client";

import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  ArrowUpRight,
  CheckCircle2,
  DollarSign,
  FileText,
  Package,
  PackagePlus,
  Receipt,
  ShoppingCart,
  Sparkles,
  TrendingUp,
  Wallet,
} from "lucide-react";
import type { SessionPayload } from "@/lib/auth";

interface AdminDashboardProps {
  session: SessionPayload;
  stats: {
    totalProducts: number;
    totalSuppliers: number;
    totalCustomers: number;
    totalSales: number;
    totalPurchases: number;
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
  lowStockProducts: {
    product_id: number;
    name: string;
    code: string;
    total_remaining: number;
    base_unit_code: string;
  }[];
  lowStockCount: number;
}

const MIN_STOCK = 5;

export function AdminDashboard({
  session,
  stats,
  todaySalesTotal,
  todaySalesCount,
  todayLabel,
  recentSales,
  lowStockProducts,
  lowStockCount,
}: AdminDashboardProps) {
  const firstName = session.name.split(" ")[0];

  const statCards = [
    {
      label: "Penjualan Hari Ini",
      value: `Rp ${todaySalesTotal.toLocaleString("id-ID")}`,
      hint: `${todaySalesCount} transaksi tercatat hari ini`,
      icon: Wallet,
      tone: "bg-emerald-50 text-emerald-600",
      suffix: "Hari ini",
      suffixClass: "bg-emerald-50 text-emerald-700",
    },
    {
      label: "Stok Kritis",
      value: String(lowStockCount),
      hint: "Produk di bawah batas minimum",
      icon: AlertTriangle,
      tone: "bg-red-50 text-red-600",
      suffix: lowStockCount > 0 ? "Perlu restock" : "Aman",
      suffixClass:
        lowStockCount > 0
          ? "bg-red-50 text-red-700"
          : "bg-emerald-50 text-emerald-700",
    },
    {
      label: "Produk Aktif",
      value: stats.totalProducts.toLocaleString("id-ID"),
      hint: `${stats.totalSuppliers} supplier · ${stats.totalCustomers} customer`,
      icon: Package,
      tone: "bg-[#87482D]/10 text-[#87482D]",
      suffix: "Katalog",
      suffixClass: "bg-[#87482D]/8 text-[#87482D]",
    },
    {
      label: "Total Transaksi",
      value: stats.totalSales.toLocaleString("id-ID"),
      hint: `${stats.totalPurchases} faktur pembelian tercatat`,
      icon: Receipt,
      tone: "bg-sky-50 text-sky-600",
      suffix: "Semua waktu",
      suffixClass: "bg-sky-50 text-sky-700",
    },
  ];

  const quickActions = [
    {
      label: "Kasir Baru",
      description: "Buat faktur penjualan",
      href: "/transactions/sales",
      icon: ShoppingCart,
      tone: "bg-[#87482D] text-white",
    },
    {
      label: "Faktur Pembelian",
      description: "Catat stok dari supplier",
      href: "/transactions/purchases",
      icon: FileText,
      tone: "bg-[#87482D]/10 text-[#87482D]",
    },
    {
      label: "Stok Masuk",
      description: "Penyesuaian opname",
      href: "/stock/in",
      icon: PackagePlus,
      tone: "bg-emerald-50 text-emerald-600",
    },
    {
      label: "Laporan Profit",
      description: "Cek laba kotor FIFO",
      href: "/reports/profit",
      icon: DollarSign,
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
          <div className="absolute right-10 top-1/2 hidden -translate-y-1/2 rotate-12 opacity-[0.07] lg:block">
            <Sparkles className="size-64" />
          </div>
        </div>

        <div className="relative grid gap-6 lg:grid-cols-[1.5fr_1fr] lg:items-center">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-[11px] font-semibold text-white/80 ring-1 ring-white/15">
              <span className="size-1.5 rounded-full bg-emerald-300" />
              {todayLabel}
            </span>
            <h1 className="mt-4 font-display text-2xl font-bold tracking-tight sm:text-3xl">
              Selamat datang, {firstName}
            </h1>
            <p className="mt-1.5 max-w-lg text-sm leading-relaxed text-white/65">
              Ini ringkasan operasional MOFU Petshop &amp; Care hari ini.
              Pantau penjualan, stok, dan performa toko dalam satu tempat.
            </p>
            <div className="mt-5 flex flex-wrap gap-2.5">
              <Link
                href="/transactions/sales"
                className="inline-flex h-11 items-center gap-2 rounded-xl bg-[#FBF7F3] px-4 text-sm font-semibold text-[#87482D] shadow-lg shadow-black/10 transition-all hover:-translate-y-0.5 hover:bg-white active:scale-[0.98]"
              >
                <ShoppingCart className="size-4" />
                Transaksi Baru
              </Link>
              <Link
                href="/reports/sales"
                className="inline-flex h-11 items-center gap-2 rounded-xl bg-white/10 px-4 text-sm font-semibold text-white ring-1 ring-white/20 transition-all hover:bg-white/15 active:scale-[0.98]"
              >
                Lihat Laporan
                <ArrowUpRight className="size-4" />
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
              {todaySalesCount} transaksi selesai hari ini
            </div>
          </div>
        </div>
      </section>

      {/* Stat cards */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {statCards.map((card, index) => {
          const Icon = card.icon;
          return (
            <div
              key={card.label}
              style={{ animationDelay: `${index * 45}ms` }}
              className="group animate-enter rounded-2xl border border-zinc-200/70 bg-white p-5 shadow-[0_1px_2px_rgba(24,25,26,0.04),0_16px_40px_-32px_rgba(24,25,26,0.25)] transition-all duration-200 hover:-translate-y-0.5 hover:border-zinc-300 hover:shadow-lg hover:shadow-zinc-950/5"
            >
              <div className="flex items-start justify-between gap-3">
                <div
                  className={`grid size-11 place-items-center rounded-xl ${card.tone}`}
                >
                  <Icon className="size-5" />
                </div>
                <span
                  className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${card.suffixClass}`}
                >
                  {card.suffix}
                </span>
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
      <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {quickActions.map((action) => {
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

      {/* Detail panels */}
      <section className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        {/* Recent sales */}
        <div className="overflow-hidden rounded-2xl border border-zinc-200/70 bg-white shadow-[0_1px_2px_rgba(24,25,26,0.04),0_16px_40px_-32px_rgba(24,25,26,0.25)] lg:col-span-3">
          <div className="flex items-center justify-between gap-3 border-b border-zinc-100 px-5 py-4">
            <div>
              <h2 className="font-display text-base font-semibold text-zinc-900">
                Transaksi Terbaru
              </h2>
              <p className="mt-0.5 text-[11px] text-zinc-400">
                5 faktur penjualan terakhir
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
                Transaksi penjualan pertama akan muncul di sini.
              </p>
              <Link
                href="/transactions/sales"
                className="mt-4 inline-flex h-9 items-center gap-2 rounded-xl bg-[#87482D] px-3.5 text-xs font-semibold text-white transition-colors hover:bg-[#6d3a24]"
              >
                <ShoppingCart className="size-3.5" />
                Buat Penjualan
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
        </div>

        {/* Low stock */}
        <div className="overflow-hidden rounded-2xl border border-zinc-200/70 bg-white shadow-[0_1px_2px_rgba(24,25,26,0.04),0_16px_40px_-32px_rgba(24,25,26,0.25)] lg:col-span-2">
          <div className="flex items-center justify-between gap-3 border-b border-zinc-100 px-5 py-4">
            <div>
              <h2 className="flex items-center gap-2 font-display text-base font-semibold text-zinc-900">
                <span className="size-2 rounded-full bg-red-500" />
                Stok Kritis
              </h2>
              <p className="mt-0.5 text-[11px] text-zinc-400">
                Produk yang perlu restock
              </p>
            </div>
            <span className="rounded-full bg-red-50 px-2.5 py-1 text-[11px] font-bold text-red-600">
              {lowStockCount}
            </span>
          </div>

          {lowStockProducts.length === 0 ? (
            <div className="flex flex-col items-center justify-center px-6 py-14 text-center">
              <span className="grid size-14 place-items-center rounded-2xl bg-emerald-50 text-emerald-600">
                <CheckCircle2 className="size-6" />
              </span>
              <p className="mt-4 text-sm font-semibold text-zinc-700">
                Semua stok aman
              </p>
              <p className="mt-1 text-xs text-zinc-400">
                Tidak ada produk di bawah batas minimum.
              </p>
            </div>
          ) : (
            <>
              <div className="divide-y divide-zinc-100">
                {lowStockProducts.map((product) => {
                  const stock = Math.floor(product.total_remaining);
                  const percent = Math.max(
                    4,
                    Math.min(100, (product.total_remaining / MIN_STOCK) * 100)
                  );
                  const critical = stock === 0;

                  return (
                    <div key={product.product_id} className="px-5 py-3.5">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate text-[13px] font-semibold text-zinc-900">
                            {product.name}
                          </p>
                          <p className="mt-0.5 text-[10px] text-zinc-400">
                            {product.code}
                          </p>
                        </div>
                        <span
                          className={`shrink-0 rounded-full px-2 py-1 text-[10px] font-bold ${
                            critical
                              ? "bg-red-50 text-red-600"
                              : "bg-amber-50 text-amber-700"
                          }`}
                        >
                          {stock} {product.base_unit_code}
                        </span>
                      </div>
                      <div className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-zinc-100">
                        <div
                          className={`h-full rounded-full ${
                            critical ? "bg-red-500" : "bg-amber-400"
                          }`}
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                      <p className="mt-1 text-[10px] text-zinc-400">
                        Minimum {MIN_STOCK} {product.base_unit_code}
                      </p>
                    </div>
                  );
                })}
              </div>
              <Link
                href="/reports/low-stock"
                className="flex items-center justify-center gap-1.5 border-t border-zinc-100 px-5 py-3 text-[12px] font-semibold text-[#87482D] transition-colors hover:bg-[#87482D]/5"
              >
                Lihat semua stok kritis
                <ArrowUpRight className="size-3.5" />
              </Link>
            </>
          )}
        </div>
      </section>
    </div>
  );
}
