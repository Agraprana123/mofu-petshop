"use client";

import { useState } from "react";
import {
  ShoppingCart,
  Search,
  Calendar,
  TrendingUp,
  Receipt,
  User,
  ArrowUpRight,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";

interface SaleReportRecord {
  id: number;
  invoiceNo: string;
  date: string;
  total: string;
  customer: { name: string; phone: string | null } | null;
  salesman: { name: string } | null;
  items: {
    id: number;
    qty: string;
    subtotal: string;
    product: { name: string };
    unit: { code: string };
  }[];
}

export function SalesReportClient({ sales }: { sales: SaleReportRecord[] }) {
  const [search, setSearch] = useState("");
  const [period, setPeriod] = useState<"ALL" | "TODAY" | "MONTH">("ALL");

  const todayStr = new Date().toISOString().slice(0, 10);
  const currentMonthStr = new Date().toISOString().slice(0, 7);

  const filtered = sales.filter((s) => {
    const matchSearch =
      s.invoiceNo.toLowerCase().includes(search.toLowerCase()) ||
      (s.customer && s.customer.name.toLowerCase().includes(search.toLowerCase())) ||
      (s.salesman && s.salesman.name.toLowerCase().includes(search.toLowerCase()));

    const sDate = s.date.slice(0, 10);
    const sMonth = s.date.slice(0, 7);

    if (period === "TODAY") return matchSearch && sDate === todayStr;
    if (period === "MONTH") return matchSearch && sMonth === currentMonthStr;
    return matchSearch;
  });

  const totalRevenue = filtered.reduce((sum, s) => sum + Number(s.total), 0);
  const totalTransactions = filtered.length;
  const avgTicket =
    totalTransactions > 0 ? Math.round(totalRevenue / totalTransactions) : 0;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-zinc-900 tracking-tight">
          Laporan Penjualan (Kasir)
        </h1>
        <p className="text-zinc-500 mt-1 text-sm">
          Analisis riwayat perolehan omset transaksi penjualan kasir toko
        </p>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-zinc-200/80 shadow-xs">
          <p className="text-xs text-zinc-500 font-medium">Total Omset Penjualan</p>
          <p className="text-2xl font-bold text-[#87482D] mt-1">
            Rp {totalRevenue.toLocaleString("id-ID")}
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-zinc-200/80 shadow-xs">
          <p className="text-xs text-zinc-500 font-medium">Total Transaksi</p>
          <p className="text-2xl font-bold text-zinc-900 mt-1">
            {totalTransactions} Transaksi
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-zinc-200/80 shadow-xs">
          <p className="text-xs text-zinc-500 font-medium">Rata-rata per Transaksi</p>
          <p className="text-2xl font-bold text-zinc-900 mt-1">
            Rp {avgTicket.toLocaleString("id-ID")}
          </p>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="bg-white rounded-2xl border border-zinc-200/80 shadow-xs overflow-hidden">
        {/* Filters */}
        <div className="p-4 border-b border-zinc-100 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="relative max-w-xs w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
              <Input
                placeholder="Cari no faktur atau pelanggan..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 h-10 rounded-xl"
              />
            </div>

            <Select
              value={period}
              onChange={(e) => setPeriod(e.target.value as "ALL" | "TODAY" | "MONTH")}
              className="h-10 text-xs w-44"
            >
              <option value="ALL">Semua Waktu</option>
              <option value="TODAY">Hari Ini</option>
              <option value="MONTH">Bulan Ini</option>
            </Select>
          </div>

          <span className="text-xs text-zinc-400 font-medium whitespace-nowrap">
            {filtered.length} transaksi tercatat
          </span>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-100 text-left text-zinc-400 text-xs uppercase tracking-wider font-semibold">
                <th className="px-5 py-3.5">#</th>
                <th className="px-5 py-3.5">No Faktur</th>
                <th className="px-5 py-3.5">Tanggal</th>
                <th className="px-5 py-3.5">Pelanggan</th>
                <th className="px-5 py-3.5">Salesman</th>
                <th className="px-5 py-3.5 text-center">Item Terjual</th>
                <th className="px-5 py-3.5 text-right">Total Transaksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-zinc-400">
                    <Receipt className="w-8 h-8 mx-auto mb-2 opacity-40" />
                    Belum ada data penjualan pada periode ini
                  </td>
                </tr>
              ) : (
                filtered.map((s, i) => (
                  <tr key={s.id} className="hover:bg-zinc-50/70 transition-colors">
                    <td className="px-5 py-3.5 text-zinc-400 text-xs">{i + 1}</td>
                    <td className="px-5 py-3.5 font-bold font-mono text-xs text-zinc-900">
                      {s.invoiceNo}
                    </td>
                    <td className="px-5 py-3.5 text-xs text-zinc-500">
                      {new Date(s.date).toLocaleDateString("id-ID", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>
                    <td className="px-5 py-3.5 font-medium text-zinc-800">
                      {s.customer?.name ?? "Umum / Walk-in"}
                    </td>
                    <td className="px-5 py-3.5 text-xs text-zinc-500">
                      {s.salesman?.name ?? "-"}
                    </td>
                    <td className="px-5 py-3.5 text-center text-xs font-semibold text-zinc-600">
                      {s.items.length} Barang
                    </td>
                    <td className="px-5 py-3.5 text-right font-bold text-zinc-900">
                      Rp {Number(s.total).toLocaleString("id-ID")}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

