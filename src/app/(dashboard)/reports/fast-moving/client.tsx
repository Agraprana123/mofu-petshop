"use client";

import { useState } from "react";
import {
  TrendingUp,
  Search,
  Flame,
  Award,
  AlertCircle,
  Package,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

const PAGE_SIZE = 10;
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
  const [page, setPage] = useState(1);

  const filtered = items.filter(
    (item) =>
      item.name.toLowerCase().includes(search.toLowerCase()) ||
      item.code.toLowerCase().includes(search.toLowerCase()) ||
      item.categoryName.toLowerCase().includes(search.toLowerCase())
  );

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const paginated = filtered.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
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
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
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
                paginated.map((item, i) => {
                  const rank = (currentPage - 1) * PAGE_SIZE + i + 1;
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

        {totalPages > 1 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-6 py-4 border-t border-zinc-100 bg-zinc-50/40">
            <span className="text-xs text-zinc-500">
              Menampilkan{" "}
              <span className="font-semibold text-zinc-700">
                {(currentPage - 1) * PAGE_SIZE + 1}–
                {Math.min(currentPage * PAGE_SIZE, filtered.length)}
              </span>{" "}
              dari <span className="font-semibold text-zinc-700">{filtered.length}</span> produk
            </span>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={currentPage <= 1}
                className="p-1.5 rounded-lg border border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                aria-label="Halaman sebelumnya"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              {Array.from({ length: totalPages }, (_, idx) => idx + 1)
                .filter(
                  (p) =>
                    p === 1 ||
                    p === totalPages ||
                    Math.abs(p - currentPage) <= 1
                )
                .reduce<(number | "ellipsis")[]>((acc, p, idx, arr) => {
                  if (idx > 0 && p - arr[idx - 1] > 1) acc.push("ellipsis");
                  acc.push(p);
                  return acc;
                }, [])
                .map((p, idx) =>
                  p === "ellipsis" ? (
                    <span
                      key={`ellipsis-${idx}`}
                      className="px-2 text-xs text-zinc-400"
                    >
                      …
                    </span>
                  ) : (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setPage(p)}
                      className={`min-w-8 h-8 px-2.5 rounded-lg text-xs font-semibold transition-colors ${
                        p === currentPage
                          ? "bg-[#87482D] text-white shadow-sm"
                          : "border border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50"
                      }`}
                    >
                      {p}
                    </button>
                  )
                )}
              <button
                type="button"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage >= totalPages}
                className="p-1.5 rounded-lg border border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                aria-label="Halaman berikutnya"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

