"use client";

import { useState } from "react";
import {
  TrendingUp,
  Search,
  Flame,
  Award,
  AlertCircle,
  Package,
} from "lucide-react";
import { Input } from "@/components/ui/input";

interface FastMovingItem {
  id: number;
  code: string;
  name: string;
  categoryName: string;
  unitCode: string;
  totalQtySold: number;
  totalRevenue: number;
  currentStock: number;
  needsReorder: boolean;
}

export function FastMovingClient({ items }: { items: FastMovingItem[] }) {
  const [search, setSearch] = useState("");

  const filtered = items.filter(
    (item) =>
      item.name.toLowerCase().includes(search.toLowerCase()) ||
      item.code.toLowerCase().includes(search.toLowerCase()) ||
      item.categoryName.toLowerCase().includes(search.toLowerCase())
  );

  const topProduct = items[0];
  const totalVolume = items.reduce((s, i) => s + i.totalQtySold, 0);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-zinc-900 tracking-tight flex items-center gap-2">
          <Flame className="w-6 h-6 text-[#87482D]" />
          Laporan Produk Fast Moving
        </h1>
        <p className="text-zinc-500 mt-1 text-sm">
          Peringkat produk terlaris dengan perputaran penjualan tercepat di toko
        </p>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-zinc-200/80 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-[#87482D]/10 text-[#87482D] flex items-center justify-center shrink-0">
            <Award className="w-6 h-6" />
          </div>
          <div className="min-w-0">
            <p className="text-xs text-zinc-500 font-medium">Produk Terlaris #1</p>
            <p className="text-base font-bold text-zinc-900 truncate mt-0.5">
              {topProduct ? topProduct.name : "-"}
            </p>
            <p className="text-xs text-[#87482D] font-semibold">
              {topProduct ? `${topProduct.totalQtySold} ${topProduct.unitCode} terjual` : ""}
            </p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-zinc-200/80 shadow-xs">
          <p className="text-xs text-zinc-500 font-medium">Total Volume Terjual</p>
          <p className="text-2xl font-bold text-zinc-900 mt-1">
            {totalVolume.toLocaleString("id-ID")} Unit
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-zinc-200/80 shadow-xs">
          <p className="text-xs text-zinc-500 font-medium">Status Katalog</p>
          <p className="text-2xl font-bold text-emerald-600 mt-1">
            {items.length} Produk Terpantau
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
              placeholder="Cari produk terlaris..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-10 rounded-xl"
            />
          </div>
          <span className="text-xs text-zinc-400 font-medium whitespace-nowrap">
            {filtered.length} produk diurutkan berdasarkan perputaran tertinggi
          </span>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-100 text-left text-zinc-400 text-xs uppercase tracking-wider font-semibold">
                <th className="px-5 py-3.5 text-center">Peringkat</th>
                <th className="px-5 py-3.5">Produk</th>
                <th className="px-5 py-3.5">Kategori</th>
                <th className="px-5 py-3.5 text-center">Volume Terjual</th>
                <th className="px-5 py-3.5 text-right">Kontribusi Omset</th>
                <th className="px-5 py-3.5 text-center">Sisa Stok Gudang</th>
                <th className="px-5 py-3.5 text-center">Rekomendasi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-zinc-400">
                    <TrendingUp className="w-8 h-8 mx-auto mb-2 opacity-40" />
                    Belum ada data transaksi penjualan
                  </td>
                </tr>
              ) : (
                filtered.map((item, i) => {
                  const rank = i + 1;
                  return (
                    <tr key={item.id} className="hover:bg-zinc-50/70 transition-colors">
                      <td className="px-5 py-3.5 text-center">
                        <span
                          className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold ${
                            rank === 1
                              ? "bg-amber-100 text-amber-800"
                              : rank === 2
                              ? "bg-zinc-200 text-zinc-700"
                              : rank === 3
                              ? "bg-orange-100 text-orange-800"
                              : "text-zinc-400"
                          }`}
                        >
                          #{rank}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <p className="font-semibold text-zinc-900">{item.name}</p>
                        <p className="text-[11px] text-zinc-400">{item.code}</p>
                      </td>
                      <td className="px-5 py-3.5 text-xs text-zinc-600">
                        {item.categoryName}
                      </td>
                      <td className="px-5 py-3.5 text-center font-bold text-zinc-900">
                        {item.totalQtySold} {item.unitCode}
                      </td>
                      <td className="px-5 py-3.5 text-right font-semibold text-zinc-900 text-xs">
                        Rp {item.totalRevenue.toLocaleString("id-ID")}
                      </td>
                      <td className="px-5 py-3.5 text-center font-medium text-xs">
                        {item.currentStock} {item.unitCode}
                      </td>
                      <td className="px-5 py-3.5 text-center">
                        {item.needsReorder ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-50 text-red-600 border border-red-200">
                            Perlu Restock
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700">
                            Stok Aman
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

