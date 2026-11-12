"use client";

import { useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  Search,
  ShoppingCart,
  AlertCircle,
  PackageX,
  Truck,
  Layers,
  ArrowRight,
  ExternalLink,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";

interface LowStockItem {
  id: number;
  code: string;
  name: string;
  categoryId: number;
  categoryName: string;
  unitCode: string;
  currentStock: number;
  minStock: number;
  deficit: number;
  costPerBase: number;
  estimatedRestockCost: number;
  status: "OUT_OF_STOCK" | "CRITICAL" | "LOW" | "SAFE";
  lastSupplier: {
    name: string;
    phone: string | null;
  } | null;
}

interface CategoryOption {
  id: number;
  name: string;
}

export function LowStockClient({
  items,
  categories,
}: {
  items: LowStockItem[];
  categories: CategoryOption[];
}) {
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [levelFilter, setLevelFilter] = useState<string>("ALL_LOW");

  // Summary Metrics calculations
  const outOfStockItems = items.filter((i) => i.status === "OUT_OF_STOCK");
  const criticalItems = items.filter(
    (i) => i.status === "OUT_OF_STOCK" || i.status === "CRITICAL" || i.status === "LOW"
  );
  const totalDeficitUnits = criticalItems.reduce((s, i) => s + i.deficit, 0);
  const totalRestockBudget = criticalItems.reduce(
    (s, i) => s + i.estimatedRestockCost,
    0
  );

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

    // Level
    let matchLevel = true;
    if (levelFilter === "ALL_LOW") {
      matchLevel = item.status !== "SAFE";
    } else if (levelFilter === "OUT_OF_STOCK") {
      matchLevel = item.status === "OUT_OF_STOCK";
    } else if (levelFilter === "CRITICAL") {
      matchLevel = item.status === "CRITICAL";
    } else if (levelFilter === "LOW") {
      matchLevel = item.status === "LOW";
    } else if (levelFilter === "ALL") {
      matchLevel = true;
    }

    return matchSearch && matchCategory && matchLevel;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 tracking-tight flex items-center gap-2">
            <AlertTriangle className="w-6 h-6 text-red-600" />
            Laporan Stok Kritis & Perlu Reorder
          </h1>
          <p className="text-zinc-500 mt-1 text-sm">
            Daftar barang yang habis atau di bawah batas minimum aman stok gudang
          </p>
        </div>

        <Button
          asChild
          className="bg-[#87482D] hover:bg-[#6d3a24] text-white shadow-sm shadow-[#87482D]/20 self-start sm:self-auto"
        >
          <Link href="/transactions/purchases">
            <ShoppingCart className="w-4 h-4 mr-2" />
            Buat Faktur Pembelian
          </Link>
        </Button>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-zinc-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <p className="text-xs text-zinc-500 font-medium">Total Item Menipis</p>
            <span className="p-2 bg-red-50 rounded-xl text-red-600">
              <AlertCircle className="w-4 h-4" />
            </span>
          </div>
          <p className="text-2xl font-bold text-red-600 mt-2">
            {criticalItems.length}{" "}
            <span className="text-xs font-normal text-zinc-400">Produk</span>
          </p>
          <p className="text-[11px] text-zinc-400 mt-1">Stok di bawah batas minimum (5 unit)</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-zinc-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <p className="text-xs text-zinc-500 font-medium">Stok Habis Total (0)</p>
            <span className="p-2 bg-zinc-900/10 rounded-xl text-zinc-900">
              <PackageX className="w-4 h-4" />
            </span>
          </div>
          <p className="text-2xl font-bold text-zinc-900 mt-2">
            {outOfStockItems.length}{" "}
            <span className="text-xs font-normal text-zinc-400">Produk</span>
          </p>
          <p className="text-[11px] text-zinc-400 mt-1">Gudang kosong sama sekali</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-zinc-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <p className="text-xs text-zinc-500 font-medium">Total Unit Defisit</p>
            <span className="p-2 bg-amber-50 rounded-xl text-amber-700">
              <Layers className="w-4 h-4" />
            </span>
          </div>
          <p className="text-2xl font-bold text-zinc-900 mt-2">
            {totalDeficitUnits.toLocaleString("id-ID")}{" "}
            <span className="text-xs font-normal text-zinc-400">Unit</span>
          </p>
          <p className="text-[11px] text-zinc-400 mt-1">Kekurangan unit menuju stok aman</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-zinc-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <p className="text-xs text-zinc-500 font-medium">Estimasi Kebutuhan Belanja</p>
            <span className="p-2 bg-[#87482D]/10 rounded-xl text-[#87482D]">
              <ShoppingCart className="w-4 h-4" />
            </span>
          </div>
          <p className="text-2xl font-bold text-[#87482D] mt-2">
            Rp {totalRestockBudget.toLocaleString("id-ID")}
          </p>
          <p className="text-[11px] text-zinc-400 mt-1">Estimasi modal restock ke supplier</p>
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
                placeholder="Cari produk kritis..."
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
              value={levelFilter}
              onChange={(e) => setLevelFilter(e.target.value)}
              className="h-10 rounded-xl max-w-xs bg-white"
            >
              <option value="ALL_LOW">Semua Kritis & Menipis (≤ 5)</option>
              <option value="OUT_OF_STOCK">Habis Total (0 Stok)</option>
              <option value="CRITICAL">Kritis Gawat (1 - 2 Stok)</option>
              <option value="LOW">Menipis (3 - 5 Stok)</option>
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
                <th className="px-5 py-3.5 text-center">Sisa Stok</th>
                <th className="px-5 py-3.5 text-center">Batas Minimum</th>
                <th className="px-5 py-3.5 text-center">Defisit</th>
                <th className="px-5 py-3.5 text-right">Perkiraan Biaya</th>
                <th className="px-5 py-3.5">Supplier Terakhir</th>
                <th className="px-5 py-3.5 text-center">Aksi Reorder</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-5 py-12 text-center text-zinc-400">
                    <AlertTriangle className="w-8 h-8 mx-auto mb-2 opacity-40 text-emerald-500" />
                    Semua stok aman! Tidak ada produk kritis saat ini.
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
                          className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${
                            item.currentStock === 0
                              ? "bg-red-600 text-white"
                              : item.currentStock <= 2
                              ? "bg-red-100 text-red-800 border border-red-200"
                              : item.currentStock <= 5
                              ? "bg-amber-100 text-amber-800 border border-amber-200"
                              : "bg-emerald-100 text-emerald-800"
                          }`}
                        >
                          {item.currentStock} {item.unitCode}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-center text-xs font-medium text-zinc-500">
                        {item.minStock} {item.unitCode}
                      </td>
                      <td className="px-5 py-3.5 text-center">
                        {item.deficit > 0 ? (
                          <span className="font-bold text-xs text-red-600">
                            +{item.deficit} {item.unitCode}
                          </span>
                        ) : (
                          <span className="text-xs text-zinc-400">-</span>
                        )}
                      </td>
                      <td className="px-5 py-3.5 text-right font-bold text-xs text-[#87482D]">
                        Rp {item.estimatedRestockCost.toLocaleString("id-ID")}
                      </td>
                      <td className="px-5 py-3.5 text-xs">
                        {item.lastSupplier ? (
                          <div>
                            <p className="font-medium text-zinc-800">
                              {item.lastSupplier.name}
                            </p>
                            {item.lastSupplier.phone && (
                              <p className="text-[11px] text-zinc-400">
                                {item.lastSupplier.phone}
                              </p>
                            )}
                          </div>
                        ) : (
                          <span className="text-zinc-400">-</span>
                        )}
                      </td>
                      <td className="px-5 py-3.5 text-center">
                        <Link
                          href="/transactions/purchases"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-[#87482D]/10 text-[#87482D] hover:bg-[#87482D] hover:text-white transition-all shadow-2xs"
                        >
                          <ShoppingCart className="w-3.5 h-3.5" />
                          Order
                        </Link>
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

