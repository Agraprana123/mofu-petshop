"use client";

import { useState } from "react";
import {
  Boxes,
  Search,
  Download,
  AlertTriangle,
  CheckCircle2,
  DollarSign,
  Package,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

interface StockReportItem {
  id: number;
  code: string;
  name: string;
  categoryId: number;
  categoryName: string;
  unitCode: string;
  totalStock: number;
  costPerBase: number;
  assetValue: number;
  margin: number;
  estimatedSellPrice: number;
  isCritical: boolean;
}

interface CategoryOption {
  id: number;
  name: string;
}

export function StockReportClient({
  items,
  categories,
}: {
  items: StockReportItem[];
  categories: CategoryOption[];
}) {
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");

  const filtered = items.filter((item) => {
    const matchSearch =
      item.name.toLowerCase().includes(search.toLowerCase()) ||
      item.code.toLowerCase().includes(search.toLowerCase());
    const matchCat =
      selectedCategory === "ALL" ||
      item.categoryId.toString() === selectedCategory;
    return matchSearch && matchCat;
  });

  const totalProducts = items.length;
  const totalPhysicalStock = items.reduce((s, i) => s + i.totalStock, 0);
  const totalAssetValue = items.reduce((s, i) => s + i.assetValue, 0);
  const criticalCount = items.filter((i) => i.isCritical).length;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 tracking-tight">
            Laporan Stok Gudang
          </h1>
          <p className="text-zinc-500 mt-1 text-sm">
            Ringkasan ketersediaan stok fisik, modal FIFO aktif, dan nilai total aset barang
          </p>
        </div>
        <Button
          asChild
          className="bg-[#87482D] hover:bg-[#6d3a24] text-white shadow-sm shadow-[#87482D]/20"
        >
          <a href="/api/export/stock" download>
            <Download className="w-4 h-4" />
            Export Laporan (CSV)
          </a>
        </Button>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-zinc-200/80 shadow-xs">
          <p className="text-xs text-zinc-500 font-medium">Total Produk</p>
          <p className="text-2xl font-bold text-zinc-900 mt-1">{totalProducts}</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-zinc-200/80 shadow-xs">
          <p className="text-xs text-zinc-500 font-medium">Total Stok Fisik</p>
          <p className="text-2xl font-bold text-zinc-900 mt-1">
            {totalPhysicalStock.toLocaleString("id-ID")}
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-zinc-200/80 shadow-xs">
          <p className="text-xs text-zinc-500 font-medium">Nilai Total Modal Aset</p>
          <p className="text-2xl font-bold text-[#87482D] mt-1">
            Rp {totalAssetValue.toLocaleString("id-ID")}
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-zinc-200/80 shadow-xs">
          <p className="text-xs text-zinc-500 font-medium">Produk Stok Kritis</p>
          <p className="text-2xl font-bold text-red-600 mt-1">{criticalCount}</p>
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
                placeholder="Cari kode atau nama..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 h-10 rounded-xl"
              />
            </div>

            <Select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="h-10 text-xs w-44"
            >
              <option value="ALL">Semua Kategori</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id.toString()}>
                  {c.name}
                </option>
              ))}
            </Select>
          </div>

          <span className="text-xs text-zinc-400 font-medium whitespace-nowrap">
            Menampilkan {filtered.length} dari {items.length} produk
          </span>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-100 text-left text-zinc-400 text-xs uppercase tracking-wider font-semibold">
                <th className="px-5 py-3.5">#</th>
                <th className="px-5 py-3.5">Produk</th>
                <th className="px-5 py-3.5">Kategori</th>
                <th className="px-5 py-3.5 text-center">Sisa Stok</th>
                <th className="px-5 py-3.5 text-right">Modal Terakhir</th>
                <th className="px-5 py-3.5 text-right">Estimasi Jual (FIFO)</th>
                <th className="px-5 py-3.5 text-right">Nilai Aset Stok</th>
                <th className="px-5 py-3.5 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-5 py-12 text-center text-zinc-400">
                    <Boxes className="w-8 h-8 mx-auto mb-2 opacity-40" />
                    Tidak ada data produk yang cocok
                  </td>
                </tr>
              ) : (
                filtered.map((item, i) => (
                  <tr key={item.id} className="hover:bg-zinc-50/70 transition-colors">
                    <td className="px-5 py-3.5 text-zinc-400 text-xs">{i + 1}</td>
                    <td className="px-5 py-3.5">
                      <p className="font-semibold text-zinc-900">{item.name}</p>
                      <p className="text-[11px] text-zinc-400">{item.code}</p>
                    </td>
                    <td className="px-5 py-3.5 text-xs text-zinc-600">
                      {item.categoryName}
                    </td>
                    <td className="px-5 py-3.5 text-center font-bold text-zinc-900">
                      {item.totalStock} {item.unitCode}
                    </td>
                    <td className="px-5 py-3.5 text-right text-xs text-zinc-600">
                      {item.costPerBase > 0
                        ? `Rp ${item.costPerBase.toLocaleString("id-ID")}`
                        : "-"}
                    </td>
                    <td className="px-5 py-3.5 text-right text-xs font-semibold text-zinc-900">
                      {item.estimatedSellPrice > 0
                        ? `Rp ${item.estimatedSellPrice.toLocaleString("id-ID")}`
                        : "-"}
                    </td>
                    <td className="px-5 py-3.5 text-right text-xs font-bold text-[#87482D]">
                      Rp {item.assetValue.toLocaleString("id-ID")}
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      {item.isCritical ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-50 text-red-600 border border-red-200">
                          Kritis (&lt;5)
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700">
                          Aman
                        </span>
                      )}
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

