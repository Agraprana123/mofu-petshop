"use client";

import {
  ShoppingCart,
  TrendingUp,
  ArrowUpRight,
  CheckCircle2,
  Package,
} from "lucide-react";
import { Button } from "@/components/ui/button";
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
  recentSales,
}: StaffDashboardProps) {
  const roleLabel: Record<string, string> = {
    CASHIER: "Kasir/Staff",
    SALESMAN: "Salesman",
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Welcome Banner */}
      <div className="bg-white rounded-2xl p-6 border border-zinc-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <p className="text-sm text-zinc-500 font-medium">Selamat datang kembali 👋</p>
          <h1 className="text-2xl font-bold text-zinc-900 mt-1">
            MOFU Petshop & Care <span className="text-sm font-normal text-zinc-400">({roleLabel[session.role] ?? "Staff"})</span>
          </h1>
          <p className="text-xs text-zinc-400 mt-0.5">Sistem Kasir & Transaksi POS</p>
        </div>
        <Button asChild className="bg-[#87482D] hover:bg-[#6d3a24] text-white shadow-sm shadow-[#87482D]/20 h-11 px-5 rounded-xl font-medium shrink-0">
          <a href="/transactions/sales">
            <ShoppingCart className="w-4 h-4" />
            Faktur Penjualan Baru
          </a>
        </Button>
      </div>

      {/* Stat cards - 2 column */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Penjualan Hari Ini */}
        <div className="bg-white rounded-2xl p-5 border border-zinc-200/80 shadow-xs">
          <div className="flex items-start justify-between">
            <div>
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3">
                <TrendingUp className="w-5 h-5" />
              </div>
              <p className="text-2xl font-bold text-zinc-900 tracking-tight">
                Rp {todaySalesTotal.toLocaleString("id-ID")}
              </p>
              <p className="text-sm text-zinc-500 mt-1 font-medium">Penjualan Hari Ini</p>
            </div>
            <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full">
              Hari Ini
            </span>
          </div>
        </div>

        {/* Total Transaksi */}
        <div className="bg-white rounded-2xl p-5 border border-zinc-200/80 shadow-xs">
          <div className="flex items-start justify-between">
            <div>
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-3">
                <Package className="w-5 h-5" />
              </div>
              <p className="text-2xl font-bold text-zinc-900 tracking-tight">
                {stats.totalSales.toLocaleString("id-ID")}
              </p>
              <p className="text-sm text-zinc-500 mt-1 font-medium">Total Transaksi</p>
            </div>
          </div>
        </div>
      </div>

      {/* Transaksi Terbaru */}
      <div className="bg-white rounded-2xl border border-zinc-200/80 shadow-xs p-6">
        <div className="flex items-center justify-between pb-4 border-b border-zinc-100 mb-4">
          <h2 className="text-base font-bold text-zinc-900 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            Transaksi Terbaru
          </h2>
          <a
            href="/transactions/sales"
            className="text-xs text-[#87482D] hover:text-[#6d3a24] flex items-center gap-1 font-semibold"
          >
            Lihat semua <ArrowUpRight className="w-3.5 h-3.5" />
          </a>
        </div>

        <div>
          {recentSales.length === 0 ? (
            <div className="text-center py-10">
              <ShoppingCart className="w-10 h-10 text-zinc-300 mx-auto mb-3" />
              <p className="text-sm text-zinc-400">Belum ada data transaksi penjualan</p>
              <Button asChild variant="outline" size="sm" className="mt-4">
                <a href="/transactions/sales">Buat Penjualan Pertama</a>
              </Button>
            </div>
          ) : (
            <div className="divide-y divide-zinc-100">
              {recentSales.map((sale) => (
                <div
                  key={sale.id}
                  className="flex items-center gap-3 py-3 first:pt-0 last:pb-0"
                >
                  <div className="w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center shrink-0">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-zinc-900 truncate">
                      {sale.invoiceNo}
                    </p>
                    <p className="text-xs text-zinc-400 mt-0.5">
                      {sale.customer?.name ?? "Umum"} ·{" "}
                      {new Date(sale.date).toLocaleDateString("id-ID", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-zinc-900">
                      Rp {Number(sale.total).toLocaleString("id-ID")}
                    </p>
                    <p className="text-xs font-medium text-emerald-600">Selesai</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
