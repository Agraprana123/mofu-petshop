"use client";

import { useState } from "react";
import {
  TrendingDown,
  Search,
  AlertOctagon,
  Clock,
  Layers,
  Sparkles,
  HelpCircle,
  PackageOpen,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";

interface SlowMovingItem {
  id: number;
  code: string;
  name: string;
  categoryId: number;
  categoryName: string;
  unitCode: string;
  totalQtySold: number;
  totalRevenue: number;
  currentStock: number;
  costPerBase: number;
  assetValue: number;
  lastSoldAt: string | null;
  status: "DEAD_STOCK" | "VERY_SLOW" | "SLOW" | "NORMAL";
}

interface CategoryOption {
  id: number;
  name: string;
}

export function SlowMovingClient({
  items,
  categories,
}: {
  items: SlowMovingItem[];
  categories: CategoryOption[];
}) {
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [statusFilter, setStatusFilter] = useState<string>("ALL_SLOW");

  // Summary Metrics calculations (from all items)
  const deadStockItems = items.filter(
    (i) => i.status === "DEAD_STOCK" && i.currentStock > 0
  );
  const slowItems = items.filter((i) => i.status !== "NORMAL");
  const totalStuckAssetValue = slowItems.reduce((s, i) => s + i.assetValue, 0);

  // Category with highest stuck asset value
  const categoryStuckMap: Record<string, number> = {};
  slowItems.forEach((i) => {
    categoryStuckMap[i.categoryName] =
      (categoryStuckMap[i.categoryName] || 0) + i.assetValue;
  });
  const topStuckCategory = Object.entries(categoryStuckMap).sort(
    (a, b) => b[1] - a[1]
  )[0];

  // Filtering
  const filtered = items.filter((item) => {
    // Search
    const matchSearch =
      item.name.toLowerCase().includes(search.toLowerCase()) ||
      item.code.toLowerCase().includes(search.toLowerCase()) ||
      item.categoryName.toLowerCase().includes(search.toLowerCase());

    // Category
    const matchCategory =
      selectedCategory === "ALL" ||
      item.categoryId.toString() === selectedCategory;

    // Status Filter
    let matchStatus = true;
    if (statusFilter === "ALL_SLOW") {
      matchStatus = item.status !== "NORMAL";
    } else if (statusFilter === "DEAD_STOCK") {
      matchStatus = item.status === "DEAD_STOCK";
    } else if (statusFilter === "VERY_SLOW") {
      matchStatus = item.status === "VERY_SLOW";
    } else if (statusFilter === "SLOW") {
      matchStatus = item.status === "SLOW";
    } else if (statusFilter === "ALL") {
      matchStatus = true;
    }

    return matchSearch && matchCategory && matchStatus;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-zinc-900 tracking-tight flex items-center gap-2">
          <TrendingDown className="w-6 h-6 text-[#87482D]" />
          Laporan Produk Slow Moving & Dead Stock
        </h1>
        <p className="text-zinc-500 mt-1 text-sm">
          Monitoring produk dengan perputaran penjualan lambat dan modal mengendap di gudang
        </p>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-zinc-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <p className="text-xs text-zinc-500 font-medium">Total Slow Moving</p>
            <span className="p-2 bg-amber-50 rounded-xl text-amber-700">
              <Clock className="w-4 h-4" />
            </span>
          </div>
          <p className="text-2xl font-bold text-zinc-900 mt-2">
            {slowItems.length}{" "}
            <span className="text-xs font-normal text-zinc-400">Produk</span>
          </p>
          <p className="text-[11px] text-zinc-400 mt-1">Perputaran penjualan rendah</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-zinc-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <p className="text-xs text-zinc-500 font-medium">Nilai Modal Mengendap</p>
            <span className="p-2 bg-[#87482D]/10 rounded-xl text-[#87482D]">
              <Layers className="w-4 h-4" />
            </span>
          </div>
          <p className="text-2xl font-bold text-[#87482D] mt-2">
            Rp {totalStuckAssetValue.toLocaleString("id-ID")}
          </p>
          <p className="text-[11px] text-zinc-400 mt-1">Total aset terkunci di stok lambat</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-zinc-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <p className="text-xs text-zinc-500 font-medium">Stok Mati (Dead Stock)</p>
            <span className="p-2 bg-red-50 rounded-xl text-red-600">
              <AlertOctagon className="w-4 h-4" />
            </span>
          </div>
          <p className="text-2xl font-bold text-red-600 mt-2">
            {deadStockItems.length}{" "}
            <span className="text-xs font-normal text-zinc-400">Produk</span>
          </p>
          <p className="text-[11px] text-zinc-400 mt-1">Belum pernah terjual sama sekali</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-zinc-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <p className="text-xs text-zinc-500 font-medium">Kategori Paling Mengendap</p>
            <span className="p-2 bg-zinc-100 rounded-xl text-zinc-600">
              <PackageOpen className="w-4 h-4" />
            </span>
          </div>
          <p className="text-base font-bold text-zinc-900 mt-2 truncate">
            {topStuckCategory ? topStuckCategory[0] : "-"}
          </p>
          <p className="text-[11px] text-[#87482D] font-semibold mt-1">
            {topStuckCategory
              ? `Rp ${topStuckCategory[1].toLocaleString("id-ID")}`
              : "Rp 0"}
          </p>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="bg-white rounded-2xl border border-zinc-200/80 shadow-xs overflow-hidden">
        {/* Filter Bar */}
        <div className="p-4 border-b border-zinc-100 flex flex-col md:flex-row md:items-center justify-between gap-3 bg-zinc-50/50">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 w-full md:w-auto flex-1">
            <div className="relative max-w-xs w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
              <Input
                placeholder="Cari produk slow moving..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 h-10 rounded-xl bg-white"
              />
            </div>

            <Select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="h-10 rounded-xl max-w-xs bg-white"
            >
              <option value="ALL">Semua Kategori</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id.toString()}>
                  {c.name}
                </option>
              ))}
            </Select>

            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-10 rounded-xl max-w-xs bg-white"
            >
              <option value="ALL_SLOW">Semua Slow Moving</option>
              <option value="DEAD_STOCK">Stok Mati (0 Terjual)</option>
              <option value="VERY_SLOW">Sangat Lambat (≤ 3 Terjual)</option>
              <option value="SLOW">Lambat (4 - 8 Terjual)</option>
              <option value="ALL">Tampilkan Seluruh Produk</option>
            </Select>
          </div>

          <span className="text-xs text-zinc-400 font-medium whitespace-nowrap self-end md:self-center">
            Menampilkan {filtered.length} produk
          </span>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-100 text-left text-zinc-400 text-xs uppercase tracking-wider font-semibold bg-white">
                <th className="px-5 py-3.5">Produk</th>
                <th className="px-5 py-3.5">Kategori</th>
                <th className="px-5 py-3.5 text-center">Volume Terjual</th>
                <th className="px-5 py-3.5 text-center">Sisa Stok</th>
                <th className="px-5 py-3.5 text-right">Modal / Unit</th>
                <th className="px-5 py-3.5 text-right">Modal Mengendap</th>
                <th className="px-5 py-3.5 text-center">Status</th>
                <th className="px-5 py-3.5 text-center">Rekomendasi Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-5 py-12 text-center text-zinc-400">
                    <TrendingDown className="w-8 h-8 mx-auto mb-2 opacity-40" />
                    Tidak ada produk slow moving yang sesuai filter
                  </td>
                </tr>
              ) : (
                filtered.map((item) => {
                  return (
                    <tr
                      key={item.id}
                      className="hover:bg-zinc-50/70 transition-colors"
                    >
                      <td className="px-5 py-3.5">
                        <p className="font-semibold text-zinc-900">{item.name}</p>
                        <p className="text-[11px] text-zinc-400">{item.code}</p>
                      </td>
                      <td className="px-5 py-3.5 text-xs text-zinc-600">
                        {item.categoryName}
                      </td>
                      <td className="px-5 py-3.5 text-center">
                        <span
                          className={`font-semibold text-xs ${
                            item.totalQtySold === 0
                              ? "text-red-500 font-bold"
                              : "text-zinc-700"
                          }`}
                        >
                          {item.totalQtySold} {item.unitCode}
                        </span>
                        {item.lastSoldAt ? (
                          <p className="text-[10px] text-zinc-400 mt-0.5">
                            Akhir:{" "}
                            {new Date(item.lastSoldAt).toLocaleDateString(
                              "id-ID",
                              { day: "numeric", month: "short" }
                            )}
                          </p>
                        ) : (
                          <p className="text-[10px] text-zinc-400 mt-0.5">
                            Belum pernah
                          </p>
                        )}
                      </td>
                      <td className="px-5 py-3.5 text-center font-medium text-xs text-zinc-900">
                        {item.currentStock} {item.unitCode}
                      </td>
                      <td className="px-5 py-3.5 text-right text-xs text-zinc-600">
                        Rp {item.costPerBase.toLocaleString("id-ID")}
                      </td>
                      <td className="px-5 py-3.5 text-right font-bold text-xs text-[#87482D]">
                        Rp {item.assetValue.toLocaleString("id-ID")}
                      </td>
                      <td className="px-5 py-3.5 text-center">
                        {item.status === "DEAD_STOCK" ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-red-50 text-red-700 border border-red-200">
                            Stok Mati
                          </span>
                        ) : item.status === "VERY_SLOW" ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                            Sangat Lambat
                          </span>
                        ) : item.status === "SLOW" ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-zinc-100 text-zinc-700 border border-zinc-200">
                            Lambat
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            Normal
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-3.5 text-center">
                        {item.status === "DEAD_STOCK" ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-red-50 text-red-700">
                            <Sparkles className="w-3 h-3 text-red-500" />
                            Diskon Cuci Gudang
                          </span>
                        ) : item.status === "VERY_SLOW" ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-amber-50 text-amber-800">
                            Paket Bundling
                          </span>
                        ) : item.status === "SLOW" ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-zinc-100 text-zinc-700">
                            Tunda Reorder
                          </span>
                        ) : (
                          <span className="text-xs text-zinc-400">Pertahankan</span>
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

