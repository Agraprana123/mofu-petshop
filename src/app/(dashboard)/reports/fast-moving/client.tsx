"use client";

import { useMemo, useState } from "react";
import {
  Award,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Flame,
  RotateCcw,
  Search,
  TrendingUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const PAGE_SIZE = 10;

interface DailySale {
  date: string;
  qty: number;
  revenue: number;
}

interface FastMovingItem {
  id: number;
  code: string;
  name: string;
  categoryName: string;
  unitCode: string;
  currentStock: number;
  needsReorder: boolean;
  dailySales: DailySale[];
}

type Preset = "TODAY" | "7D" | "30D" | "MONTH" | "ALL" | "CUSTOM";

function dateKey(value: Date) {
  return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(
    2,
    "0"
  )}-${String(value.getDate()).padStart(2, "0")}`;
}

function addDays(date: Date, days: number) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + days);
}

function formatDay(key: string) {
  return new Date(`${key}T00:00:00`).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function FastMovingClient({ items }: { items: FastMovingItem[] }) {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [preset, setPreset] = useState<Preset>("ALL");
  const [draftFrom, setDraftFrom] = useState("");
  const [draftTo, setDraftTo] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const hasRange = Boolean(from || to);
  const hasActiveFilter = hasRange || search.trim() !== "";

  function applyRange(nextFrom = draftFrom, nextTo = draftTo) {
    let appliedFrom = nextFrom;
    let appliedTo = nextTo;

    // Kalau urutan tanggal terbalik, tukar otomatis.
    if (appliedFrom && appliedTo && appliedFrom > appliedTo) {
      [appliedFrom, appliedTo] = [appliedTo, appliedFrom];
    }

    setDraftFrom(appliedFrom);
    setDraftTo(appliedTo);
    setFrom(appliedFrom);
    setTo(appliedTo);
    setPage(1);
  }

  function applyPreset(next: Preset) {
    setPreset(next);

    if (next === "ALL") {
      setDraftFrom("");
      setDraftTo("");
      setFrom("");
      setTo("");
      setPage(1);
      return;
    }

    const today = new Date();
    let start = today;
    if (next === "7D") start = addDays(today, -6);
    if (next === "30D") start = addDays(today, -29);
    if (next === "MONTH") {
      start = new Date(today.getFullYear(), today.getMonth(), 1);
    }

    const startKey = dateKey(start);
    const endKey = dateKey(today);
    setDraftFrom(startKey);
    setDraftTo(endKey);
    setFrom(startKey);
    setTo(endKey);
    setPage(1);
  }

  function resetFilters() {
    setSearch("");
    setPreset("ALL");
    setDraftFrom("");
    setDraftTo("");
    setFrom("");
    setTo("");
    setPage(1);
  }

  // Hitung volume & omset sesuai periode, lalu urutkan ulang peringkatnya.
  const ranged = useMemo(() => {
    return items
      .map((item) => {
        let qty = 0;
        let revenue = 0;

        for (const day of item.dailySales) {
          if (from && day.date < from) continue;
          if (to && day.date > to) continue;
          qty += day.qty;
          revenue += day.revenue;
        }

        return {
          ...item,
          totalQtySold: Math.round(qty * 10) / 10,
          totalRevenue: Math.round(revenue),
        };
      })
      .filter((item) => (hasRange ? item.totalQtySold > 0 : true))
      .sort(
        (a, b) =>
          b.totalQtySold - a.totalQtySold || b.totalRevenue - a.totalRevenue
      );
  }, [items, from, to, hasRange]);

  const filtered = ranged.filter(
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

  const topProduct = ranged[0];
  const totalVolume = ranged.reduce((s, i) => s + i.totalQtySold, 0);
  const soldCount = ranged.filter((i) => i.totalQtySold > 0).length;

  const rangeLabel = hasRange
    ? `${from ? formatDay(from) : "Awal"} – ${to ? formatDay(to) : "Sekarang"}`
    : "Semua waktu";

  const presets: { id: Preset; label: string }[] = [
    { id: "TODAY", label: "Hari Ini" },
    { id: "7D", label: "7 Hari" },
    { id: "30D", label: "30 Hari" },
    { id: "MONTH", label: "Bulan Ini" },
    { id: "ALL", label: "Semua" },
  ];

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

      {/* Filter periode */}
      <div className="rounded-2xl border border-zinc-200/80 bg-white p-4 shadow-xs sm:p-5">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-end">
          <div className="w-full space-y-1.5 sm:w-52">
            <Label
              htmlFor="fastMovingFrom"
              className="text-xs font-semibold text-zinc-600"
            >
              Dari Tanggal
            </Label>
            <Input
              id="fastMovingFrom"
              type="date"
              value={draftFrom}
              onChange={(event) => {
                setDraftFrom(event.target.value);
                setPreset("CUSTOM");
              }}
              className="h-11 rounded-xl"
            />
          </div>

          <div className="w-full space-y-1.5 sm:w-52">
            <Label
              htmlFor="fastMovingTo"
              className="text-xs font-semibold text-zinc-600"
            >
              Sampai Tanggal
            </Label>
            <Input
              id="fastMovingTo"
              type="date"
              value={draftTo}
              onChange={(event) => {
                setDraftTo(event.target.value);
                setPreset("CUSTOM");
              }}
              className="h-11 rounded-xl"
            />
          </div>

          <Button onClick={() => applyRange()} className="h-11 shrink-0 px-6">
            Tampilkan
          </Button>

          <div className="flex flex-wrap items-center gap-1.5 xl:ml-auto">
            {presets.map((option) => (
              <button
                key={option.id}
                type="button"
                onClick={() => applyPreset(option.id)}
                className={`rounded-lg border px-2.5 py-1.5 text-[11px] font-semibold transition-colors ${
                  preset === option.id
                    ? "border-[#87482D]/30 bg-[#87482D]/10 text-[#87482D]"
                    : "border-zinc-200 bg-white text-zinc-500 hover:border-[#87482D]/30 hover:bg-[#87482D]/8 hover:text-[#87482D]"
                }`}
              >
                {option.label}
              </button>
            ))}
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={resetFilters}
              disabled={!hasActiveFilter}
              className="h-8 px-2 text-[11px]"
            >
              <RotateCcw className="size-3" />
              Reset
            </Button>
          </div>
        </div>
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
              {topProduct
                ? `${topProduct.totalQtySold} ${topProduct.unitCode} terjual`
                : ""}
            </p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-zinc-200/80 shadow-xs">
          <p className="text-xs text-zinc-500 font-medium">Total Volume Terjual</p>
          <p className="text-2xl font-bold text-zinc-900 mt-1">
            {totalVolume.toLocaleString("id-ID")} Unit
          </p>
          <p className="text-[11px] text-zinc-400 mt-1 flex items-center gap-1">
            <CalendarDays className="size-3" />
            {rangeLabel}
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-zinc-200/80 shadow-xs">
          <p className="text-xs text-zinc-500 font-medium">Produk Terjual</p>
          <p className="text-2xl font-bold text-emerald-600 mt-1">
            {soldCount} Produk
          </p>
          <p className="text-[11px] text-zinc-400 mt-1">
            dari {items.length} produk aktif
          </p>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="bg-white rounded-2xl border border-zinc-200/80 shadow-xs overflow-hidden">
        {/* Search header */}
        <div className="p-4 border-b border-zinc-100 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
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
                    {search.trim()
                      ? "Tidak ada produk yang cocok dengan pencarian."
                      : hasRange
                      ? "Tidak ada penjualan pada periode ini."
                      : "Belum ada data transaksi penjualan."}
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
