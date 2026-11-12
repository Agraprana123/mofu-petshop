"use client";

import { useState } from "react";
import {
  DollarSign,
  Search,
  TrendingUp,
  Percent,
  Layers,
  ArrowUpRight,
} from "lucide-react";
import { Input } from "@/components/ui/input";

interface ProfitRecord {
  id: number;
  invoiceNo: string;
  date: string;
  productName: string;
  productCode: string;
  unitCode: string;
  qty: number;
  revenue: number;
  cogs: number;
  grossProfit: number;
  marginPercent: number;
}

export function ProfitReportClient({ records }: { records: ProfitRecord[] }) {
  const [search, setSearch] = useState("");

  const filtered = records.filter(
    (r) =>
      r.productName.toLowerCase().includes(search.toLowerCase()) ||
      r.productCode.toLowerCase().includes(search.toLowerCase()) ||
      r.invoiceNo.toLowerCase().includes(search.toLowerCase())
  );

  const totalRevenue = filtered.reduce((s, r) => s + r.revenue, 0);
  const totalCogs = filtered.reduce((s, r) => s + r.cogs, 0);
  const totalProfit = totalRevenue - totalCogs;
  const overallMargin =
    totalRevenue > 0 ? Math.round((totalProfit / totalRevenue) * 1000) / 10 : 0;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-zinc-900 tracking-tight">
          Laporan Profit & Analisis Margin (FIFO)
        </h1>
        <p className="text-zinc-500 mt-1 text-sm">
          Perhitungan laba kotor akurat berdasarkan HPP modal batch FIFO yang sebenarnya terpakai
        </p>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-zinc-200/80 shadow-xs">
          <p className="text-xs text-zinc-500 font-medium">Total Omset Penjualan</p>
          <p className="text-xl font-bold text-zinc-900 mt-1">
            Rp {totalRevenue.toLocaleString("id-ID")}
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-zinc-200/80 shadow-xs">
          <p className="text-xs text-zinc-500 font-medium">Total HPP / Modal (FIFO)</p>
          <p className="text-xl font-bold text-zinc-600 mt-1">
            Rp {totalCogs.toLocaleString("id-ID")}
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-zinc-200/80 shadow-xs">
          <p className="text-xs text-zinc-500 font-medium">Total Laba Kotor</p>
          <p className="text-xl font-bold text-emerald-600 mt-1">
            Rp {totalProfit.toLocaleString("id-ID")}
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-zinc-200/80 shadow-xs">
          <p className="text-xs text-zinc-500 font-medium">Rata-rata Margin Laba</p>
          <p className="text-xl font-bold text-[#87482D] mt-1">
            {overallMargin}%
          </p>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="bg-white rounded-2xl border border-zinc-200/80 shadow-xs overflow-hidden">
        {/* Search header */}
        <div className="p-4 border-b border-zinc-100 flex items-center justify-between gap-4">
          <div className="relative max-w-sm w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <Input
              placeholder="Cari faktur atau produk..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-10 rounded-xl"
            />
          </div>
          <span className="text-xs text-zinc-400 font-medium whitespace-nowrap">
            {filtered.length} baris alokasi penjualan
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
                <th className="px-5 py-3.5">Produk</th>
                <th className="px-5 py-3.5 text-center">Qty Jual</th>
                <th className="px-5 py-3.5 text-right">Omset Jual</th>
                <th className="px-5 py-3.5 text-right">Modal FIFO (HPP)</th>
                <th className="px-5 py-3.5 text-right">Laba Bersih</th>
                <th className="px-5 py-3.5 text-center">Margin</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-5 py-12 text-center text-zinc-400">
                    <DollarSign className="w-8 h-8 mx-auto mb-2 opacity-40" />
                    Belum ada data transaksi profit
                  </td>
                </tr>
              ) : (
                filtered.map((r, i) => (
                  <tr key={r.id} className="hover:bg-zinc-50/70 transition-colors">
                    <td className="px-5 py-3.5 text-zinc-400 text-xs">{i + 1}</td>
                    <td className="px-5 py-3.5 font-bold font-mono text-xs text-zinc-900">
                      {r.invoiceNo}
                    </td>
                    <td className="px-5 py-3.5 text-xs text-zinc-500">
                      {new Date(r.date).toLocaleDateString("id-ID", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>
                    <td className="px-5 py-3.5">
                      <p className="font-semibold text-zinc-900">{r.productName}</p>
                      <p className="text-[11px] text-zinc-400">{r.productCode}</p>
                    </td>
                    <td className="px-5 py-3.5 text-center text-xs font-medium text-zinc-700">
                      {r.qty} {r.unitCode}
                    </td>
                    <td className="px-5 py-3.5 text-right font-semibold text-zinc-900">
                      Rp {r.revenue.toLocaleString("id-ID")}
                    </td>
                    <td className="px-5 py-3.5 text-right text-zinc-500 text-xs">
                      Rp {r.cogs.toLocaleString("id-ID")}
                    </td>
                    <td className="px-5 py-3.5 text-right font-bold text-emerald-600">
                      +Rp {r.grossProfit.toLocaleString("id-ID")}
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-[#87482D]/10 text-[#87482D]">
                        {r.marginPercent}%
                      </span>
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

