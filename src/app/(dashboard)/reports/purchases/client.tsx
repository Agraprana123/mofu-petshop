"use client";

import { useState } from "react";
import {
  FileText,
  Search,
  Truck,
  TrendingDown,
  Building,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";

interface PurchaseReportRecord {
  id: number;
  invoiceNo: string;
  date: string;
  supplierRef: string | null;
  total: string;
  supplierId: number;
  supplier: { name: string };
  items: {
    id: number;
    qty: string;
    subtotal: string;
    product: { name: string };
    unit: { code: string };
  }[];
}

interface SupplierOption {
  id: number;
  name: string;
}

export function PurchasesReportClient({
  purchases,
  suppliers,
}: {
  purchases: PurchaseReportRecord[];
  suppliers: SupplierOption[];
}) {
  const [search, setSearch] = useState("");
  const [selectedSupplier, setSelectedSupplier] = useState<string>("ALL");

  const filtered = purchases.filter((p) => {
    const matchSearch =
      p.invoiceNo.toLowerCase().includes(search.toLowerCase()) ||
      p.supplier.name.toLowerCase().includes(search.toLowerCase()) ||
      (p.supplierRef && p.supplierRef.toLowerCase().includes(search.toLowerCase()));

    const matchSup =
      selectedSupplier === "ALL" || p.supplierId.toString() === selectedSupplier;

    return matchSearch && matchSup;
  });

  const totalSpending = filtered.reduce((sum, p) => sum + Number(p.total), 0);
  const totalInvoices = filtered.length;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-zinc-900 tracking-tight">
          Laporan Pembelian Supplier
        </h1>
        <p className="text-zinc-500 mt-1 text-sm">
          Analisis pengeluaran belanja modal barang dagang dari para pemasok
        </p>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-zinc-200/80 shadow-xs">
          <p className="text-xs text-zinc-500 font-medium">Total Pengeluaran Pembelian</p>
          <p className="text-2xl font-bold text-[#87482D] mt-1">
            Rp {totalSpending.toLocaleString("id-ID")}
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-zinc-200/80 shadow-xs">
          <p className="text-xs text-zinc-500 font-medium">Total Faktur Pembelian</p>
          <p className="text-2xl font-bold text-zinc-900 mt-1">
            {totalInvoices} Faktur
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-zinc-200/80 shadow-xs">
          <p className="text-xs text-zinc-500 font-medium">Total Supplier Aktif</p>
          <p className="text-2xl font-bold text-zinc-900 mt-1">
            {suppliers.length} Pemasok
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
                placeholder="Cari no faktur atau supplier..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 h-10 rounded-xl"
              />
            </div>

            <Select
              value={selectedSupplier}
              onChange={(e) => setSelectedSupplier(e.target.value)}
              className="h-10 text-xs w-48"
            >
              <option value="ALL">Semua Supplier</option>
              {suppliers.map((s) => (
                <option key={s.id} value={s.id.toString()}>
                  {s.name}
                </option>
              ))}
            </Select>
          </div>

          <span className="text-xs text-zinc-400 font-medium whitespace-nowrap">
            {filtered.length} faktur tercatat
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
                <th className="px-5 py-3.5">Supplier</th>
                <th className="px-5 py-3.5">Ref. Supplier</th>
                <th className="px-5 py-3.5 text-center">Item Masuk</th>
                <th className="px-5 py-3.5 text-right">Total Pembelian</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-zinc-400">
                    <FileText className="w-8 h-8 mx-auto mb-2 opacity-40" />
                    Belum ada data pembelian tercatat
                  </td>
                </tr>
              ) : (
                filtered.map((p, i) => (
                  <tr key={p.id} className="hover:bg-zinc-50/70 transition-colors">
                    <td className="px-5 py-3.5 text-zinc-400 text-xs">{i + 1}</td>
                    <td className="px-5 py-3.5 font-bold font-mono text-xs text-zinc-900">
                      {p.invoiceNo}
                    </td>
                    <td className="px-5 py-3.5 text-xs text-zinc-500">
                      {new Date(p.date).toLocaleDateString("id-ID", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>
                    <td className="px-5 py-3.5 font-medium text-zinc-800">
                      {p.supplier.name}
                    </td>
                    <td className="px-5 py-3.5 text-xs text-zinc-500">
                      {p.supplierRef || "-"}
                    </td>
                    <td className="px-5 py-3.5 text-center text-xs font-semibold text-zinc-600">
                      {p.items.length} Barang
                    </td>
                    <td className="px-5 py-3.5 text-right font-bold text-zinc-900">
                      Rp {Number(p.total).toLocaleString("id-ID")}
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

