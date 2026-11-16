"use client";

import { useMemo, useState } from "react";
import {
  BarChart3,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  DollarSign,
  Percent,
  RotateCcw,
  Search,
  TrendingUp,
  Trophy,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

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

const PAGE_SIZES = [10, 25, 50, 100];
const MS_PER_DAY = 86_400_000;

/** Kunci tanggal lokal (YYYY-MM-DD), sama seperti yang dipakai di server. */
function dateKey(value: Date | string) {
  const date = value instanceof Date ? value : new Date(value);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
    2,
    "0"
  )}-${String(date.getDate()).padStart(2, "0")}`;
}

function formatRupiah(value: number) {
  const rounded = Math.round(value);
  const sign = rounded < 0 ? "-" : "";
  return `${sign}Rp ${Math.abs(rounded).toLocaleString("id-ID")}`;
}

function formatSignedRupiah(value: number) {
  const rounded = Math.round(value);
  return `${rounded >= 0 ? "+" : ""}${formatRupiah(rounded)}`;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatShortDate(key: string) {
  return new Date(`${key}T00:00:00`).toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
  });
}

/** Label sumbu rupiah yang ringkas: 1,2 jt / 350 rb. */
function formatCompactRupiah(value: number) {
  const abs = Math.abs(value);
  if (abs >= 1_000_000_000) {
    return `${(value / 1_000_000_000).toLocaleString("id-ID", {
      maximumFractionDigits: 1,
    })} M`;
  }
  if (abs >= 1_000_000) {
    return `${(value / 1_000_000).toLocaleString("id-ID", {
      maximumFractionDigits: 1,
    })} jt`;
  }
  if (abs >= 1_000) {
    return `${(value / 1_000).toLocaleString("id-ID", {
      maximumFractionDigits: 0,
    })} rb`;
  }
  return value.toLocaleString("id-ID");
}

function niceCeil(value: number) {
  if (value <= 0) return 1;
  const magnitude = Math.pow(10, Math.floor(Math.log10(value)));
  const normalized = value / magnitude;
  const step =
    normalized <= 1 ? 1 : normalized <= 2 ? 2 : normalized <= 5 ? 5 : 10;
  return step * magnitude;
}

function addDays(date: Date, days: number) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + days);
}

/** Daftar tanggal penuh dalam rentang; kosong bila rentang terlalu panjang. */
function buildDateList(from: string, to: string) {
  if (!from || !to) return [];
  const start = new Date(`${from}T00:00:00`);
  const end = new Date(`${to}T00:00:00`);
  const count =
    Math.round(
      (Date.UTC(end.getFullYear(), end.getMonth(), end.getDate()) -
        Date.UTC(start.getFullYear(), start.getMonth(), start.getDate())) /
        MS_PER_DAY
    ) + 1;

  if (count <= 0 || count > 62) return [];

  return Array.from({ length: count }, (_, index) =>
    dateKey(addDays(start, index))
  );
}

function LegendDot({
  className,
  label,
}: {
  className: string;
  label: string;
}) {
  return (
    <span className="flex items-center gap-1.5 text-[11px] font-medium text-zinc-500">
      <span className={cn("size-2.5 rounded-sm", className)} />
      {label}
    </span>
  );
}

export function ProfitReportClient({
  records,
  defaultFrom,
  defaultTo,
}: {
  records: ProfitRecord[];
  defaultFrom: string;
  defaultTo: string;
}) {
  // Nilai yang sedang diisi di filter vs nilai yang sudah diterapkan.
  const [draftFrom, setDraftFrom] = useState(defaultFrom);
  const [draftTo, setDraftTo] = useState(defaultTo);
  const [from, setFrom] = useState(defaultFrom);
  const [to, setTo] = useState(defaultTo);
  const [search, setSearch] = useState("");
  const [pageSize, setPageSize] = useState(25);
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();

    return records.filter((record) => {
      const key = dateKey(record.date);
      if (from && key < from) return false;
      if (to && key > to) return false;
      if (!term) return true;
      return (
        record.productName.toLowerCase().includes(term) ||
        record.productCode.toLowerCase().includes(term) ||
        record.invoiceNo.toLowerCase().includes(term)
      );
    });
  }, [records, from, to, search]);

  const totalRevenue = filtered.reduce((sum, r) => sum + r.revenue, 0);
  const totalCogs = filtered.reduce((sum, r) => sum + r.cogs, 0);
  const totalProfit = totalRevenue - totalCogs;
  const overallMargin =
    totalRevenue > 0 ? Math.round((totalProfit / totalRevenue) * 1000) / 10 : 0;

  // Grafik harian: omzet, laba, dan margin per hari.
  const daily = useMemo(() => {
    const byDay = new Map<
      string,
      { revenue: number; cogs: number; profit: number }
    >();

    for (const record of filtered) {
      const key = dateKey(record.date);
      const current = byDay.get(key) ?? { revenue: 0, cogs: 0, profit: 0 };
      current.revenue += record.revenue;
      current.cogs += record.cogs;
      current.profit += record.grossProfit;
      byDay.set(key, current);
    }

    const rangeKeys = buildDateList(from, to);
    const keys = rangeKeys.length > 0 ? rangeKeys : [...byDay.keys()].sort();

    return keys.map((key) => {
      const value = byDay.get(key) ?? { revenue: 0, cogs: 0, profit: 0 };
      return {
        key,
        label: formatShortDate(key),
        revenue: value.revenue,
        cogs: value.cogs,
        profit: value.profit,
        margin: value.revenue > 0 ? (value.profit / value.revenue) * 100 : 0,
      };
    });
  }, [filtered, from, to]);

  // Produk paling menguntungkan pada periode terpilih.
  const topProducts = useMemo(() => {
    const byProduct = new Map<
      string,
      {
        name: string;
        code: string;
        revenue: number;
        profit: number;
      }
    >();

    for (const record of filtered) {
      const current = byProduct.get(record.productCode) ?? {
        name: record.productName,
        code: record.productCode,
        revenue: 0,
        profit: 0,
      };
      current.revenue += record.revenue;
      current.profit += record.grossProfit;
      byProduct.set(record.productCode, current);
    }

    return [...byProduct.values()]
      .sort((a, b) => b.profit - a.profit)
      .slice(0, 5);
  }, [filtered]);

  const maxProductProfit = Math.max(
    ...topProducts.map((product) => Math.max(product.profit, 0)),
    1
  );

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const startIndex = (currentPage - 1) * pageSize;
  const paginated = filtered.slice(startIndex, startIndex + pageSize);
  const hasActiveFilter = Boolean(from || to || search.trim());

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

  function applyPreset(preset: "TODAY" | "7D" | "30D" | "MONTH" | "ALL") {
    const today = new Date();
    const todayKey = dateKey(today);

    if (preset === "ALL") {
      setDraftFrom("");
      setDraftTo("");
      setFrom("");
      setTo("");
      setPage(1);
      return;
    }

    let start = today;
    if (preset === "7D") start = addDays(today, -6);
    if (preset === "30D") start = addDays(today, -29);
    if (preset === "MONTH") start = new Date(today.getFullYear(), today.getMonth(), 1);

    setDraftFrom(dateKey(start));
    setDraftTo(todayKey);
    setFrom(dateKey(start));
    setTo(todayKey);
    setPage(1);
  }

  function resetFilters() {
    setSearch("");
    setDraftFrom(defaultFrom);
    setDraftTo(defaultTo);
    setFrom(defaultFrom);
    setTo(defaultTo);
    setPageSize(25);
    setPage(1);
  }

  // Skala diagram.
  const chartHeight = 260;
  const padding = { top: 18, right: 46, bottom: 42, left: 58 };
  const innerHeight = chartHeight - padding.top - padding.bottom;
  const slotWidth =
    daily.length > 0
      ? Math.max(48, Math.min(96, Math.floor(760 / daily.length)))
      : 56;
  const chartWidth = Math.max(
    620,
    padding.left + padding.right + slotWidth * Math.max(daily.length, 1)
  );
  const maxValue = niceCeil(
    Math.max(...daily.map((day) => Math.max(day.revenue, day.profit)), 1)
  );
  const maxMargin = Math.max(
    10,
    Math.ceil(Math.max(...daily.map((day) => day.margin), 0) / 10) * 10
  );
  const yValue = (value: number) =>
    padding.top + innerHeight - (value / maxValue) * innerHeight;
  const yMargin = (value: number) =>
    padding.top + innerHeight - (value / maxMargin) * innerHeight;
  const barWidth = Math.max(7, Math.min(18, slotWidth * 0.2));
  const gridTicks = [0, 1, 2, 3, 4];
  const labelStep = Math.max(1, Math.ceil(daily.length / 14));

  const marginPoints = daily
    .map((day, index) => {
      const x = padding.left + index * slotWidth + slotWidth / 2;
      return `${x},${yMargin(day.margin)}`;
    })
    .join(" ");

  return (
    <div className="page-enter mx-auto max-w-7xl space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-zinc-900">
            Laporan Profit &amp; Analisis Margin
          </h1>
          <p className="mt-1 text-sm text-zinc-500">
            Laba kotor dihitung dari HPP modal batch FIFO yang benar-benar
            terpakai
          </p>
        </div>
        <p className="flex items-center gap-1.5 text-[11px] text-zinc-400">
          <CalendarDays className="size-3.5" />
          {from ? formatDate(`${from}T00:00:00`) : "Awal data"} &ndash;{" "}
          {to ? formatDate(`${to}T00:00:00`) : "Sekarang"}
        </p>
      </div>

      {/* Filter periode */}
      <div className="rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-xs">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end">
          <div className="w-full space-y-1.5 sm:w-52">
            <Label
              htmlFor="profitFrom"
              className="text-xs font-semibold text-zinc-600"
            >
              Dari Tanggal
            </Label>
            <Input
              id="profitFrom"
              type="date"
              value={draftFrom}
              onChange={(event) => setDraftFrom(event.target.value)}
              className="h-11 rounded-xl"
            />
          </div>

          <div className="w-full space-y-1.5 sm:w-52">
            <Label
              htmlFor="profitTo"
              className="text-xs font-semibold text-zinc-600"
            >
              Sampai Tanggal
            </Label>
            <Input
              id="profitTo"
              type="date"
              value={draftTo}
              onChange={(event) => setDraftTo(event.target.value)}
              className="h-11 rounded-xl"
            />
          </div>

          <Button onClick={() => applyRange()} className="h-11 shrink-0 px-6">
            Tampilkan
          </Button>

          <div className="flex flex-wrap items-center gap-1.5 xl:ml-auto">
            {(
              [
                ["TODAY", "Hari Ini"],
                ["7D", "7 Hari"],
                ["30D", "30 Hari"],
                ["MONTH", "Bulan Ini"],
                ["ALL", "Semua"],
              ] as const
            ).map(([preset, label]) => (
              <button
                key={preset}
                type="button"
                onClick={() => applyPreset(preset)}
                className="rounded-lg border border-zinc-200 bg-white px-2.5 py-1.5 text-[11px] font-semibold text-zinc-500 transition-colors hover:border-[#87482D]/30 hover:bg-[#87482D]/8 hover:text-[#87482D]"
              >
                {label}
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

      {/* Ringkasan mengikuti filter */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-xs">
          <p className="flex items-center gap-1.5 text-xs font-medium text-zinc-500">
            <DollarSign className="size-3.5" />
            Total Omset
          </p>
          <p className="mt-1 text-xl font-bold tabular-nums text-zinc-900">
            {formatRupiah(totalRevenue)}
          </p>
          <p className="mt-0.5 text-[10px] text-zinc-400">
            {filtered.length} baris penjualan
          </p>
        </div>

        <div className="rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-xs">
          <p className="flex items-center gap-1.5 text-xs font-medium text-zinc-500">
            <BarChart3 className="size-3.5" />
            Total HPP (FIFO)
          </p>
          <p className="mt-1 text-xl font-bold tabular-nums text-zinc-600">
            {formatRupiah(totalCogs)}
          </p>
          <p className="mt-0.5 text-[10px] text-zinc-400">
            modal batch terpakai
          </p>
        </div>

        <div className="rounded-2xl border border-emerald-200/70 bg-gradient-to-br from-emerald-50/70 to-white p-5 shadow-xs">
          <p className="flex items-center gap-1.5 text-xs font-medium text-emerald-700/80">
            <TrendingUp className="size-3.5" />
            Total Laba Kotor
          </p>
          <p
            className={cn(
              "mt-1 text-xl font-bold tabular-nums",
              totalProfit >= 0 ? "text-emerald-600" : "text-red-600"
            )}
          >
            {formatRupiah(totalProfit)}
          </p>
          <p className="mt-0.5 text-[10px] text-zinc-400">
            omset &minus; HPP
          </p>
        </div>

        <div className="rounded-2xl border border-[#87482D]/20 bg-gradient-to-br from-[#87482D]/8 to-white p-5 shadow-xs">
          <p className="flex items-center gap-1.5 text-xs font-medium text-[#87482D]/80">
            <Percent className="size-3.5" />
            Margin Laba
          </p>
          <p className="mt-1 text-xl font-bold tabular-nums text-[#87482D]">
            {overallMargin}%
          </p>
          <p className="mt-0.5 text-[10px] text-zinc-400">
            laba / omset
          </p>
        </div>
      </div>

      {/* Grafik */}
      <div className="grid gap-4 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <div className="overflow-hidden rounded-2xl border border-zinc-200/80 bg-white shadow-xs">
          <div className="flex flex-col gap-2 border-b border-zinc-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="flex items-center gap-1.5 text-sm font-bold text-zinc-900">
                <BarChart3 className="size-4 text-[#87482D]" />
                Tren Omset &amp; Laba Harian
              </h2>
              <p className="mt-0.5 text-[11px] text-zinc-400">
                Margin ditampilkan sebagai garis pada sumbu kanan
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <LegendDot className="bg-[#e7d3c8]" label="Omset" />
              <LegendDot className="bg-[#87482D]" label="Laba" />
              <span className="flex items-center gap-1.5 text-[11px] font-medium text-zinc-500">
                <span className="h-0.5 w-3 rounded-full bg-emerald-500" />
                Margin %
              </span>
            </div>
          </div>

          {filtered.length === 0 ? (
            <div className="px-5 py-16 text-center text-zinc-400">
              <BarChart3 className="mx-auto mb-2 size-8 opacity-40" />
              <p className="text-sm">Belum ada data pada periode ini</p>
            </div>
          ) : (
            <div className="overflow-x-auto p-3">
              <svg
                width={chartWidth}
                height={chartHeight}
                role="img"
                aria-label="Grafik omzet dan laba harian"
                className="max-w-none"
              >
                <defs>
                  <linearGradient id="profitBar" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#87482D" />
                    <stop offset="100%" stopColor="#6d3a24" />
                  </linearGradient>
                </defs>

                {/* Grid + label sumbu */}
                {gridTicks.map((tick) => {
                  const value = (maxValue / 4) * tick;
                  const marginValue = (maxMargin / 4) * tick;
                  const y = yValue(value);
                  return (
                    <g key={tick}>
                      <line
                        x1={padding.left}
                        x2={chartWidth - padding.right}
                        y1={y}
                        y2={y}
                        stroke={tick === 0 ? "#e4e4e7" : "#f1f1f2"}
                        strokeDasharray={tick === 0 ? undefined : "3 4"}
                      />
                      <text
                        x={padding.left - 8}
                        y={y + 3}
                        textAnchor="end"
                        className="fill-zinc-400"
                        fontSize="9"
                      >
                        {formatCompactRupiah(value)}
                      </text>
                      <text
                        x={chartWidth - padding.right + 8}
                        y={y + 3}
                        textAnchor="start"
                        className="fill-emerald-600/70"
                        fontSize="9"
                      >
                        {Math.round(marginValue)}%
                      </text>
                    </g>
                  );
                })}

                {daily.map((day, index) => {
                  const centerX =
                    padding.left + index * slotWidth + slotWidth / 2;
                  const revenueX = centerX - barWidth - 1.5;
                  const profitX = centerX + 1.5;
                  const revenueY = yValue(Math.max(day.revenue, 0));
                  const profitY = yValue(Math.max(day.profit, 0));
                  const baseY = yValue(0);

                  return (
                    <g key={day.key}>
                      <rect
                        x={padding.left + index * slotWidth}
                        y={padding.top}
                        width={slotWidth}
                        height={innerHeight}
                        fill="transparent"
                      >
                        <title>
                          {`${formatDate(`${day.key}T00:00:00`)}\nOmset: ${formatRupiah(
                            day.revenue
                          )}\nHPP: ${formatRupiah(day.cogs)}\nLaba: ${formatRupiah(
                            day.profit
                          )}\nMargin: ${day.margin.toFixed(1)}%`}
                        </title>
                      </rect>

                      <rect
                        x={revenueX}
                        y={revenueY}
                        width={barWidth}
                        height={Math.max(baseY - revenueY, 0)}
                        rx={3}
                        fill="#e7d3c8"
                      />
                      <rect
                        x={profitX}
                        y={profitY}
                        width={barWidth}
                        height={Math.max(baseY - profitY, 0)}
                        rx={3}
                        fill="url(#profitBar)"
                      />

                      {index % labelStep === 0 && (
                        <text
                          x={centerX}
                          y={chartHeight - 20}
                          textAnchor="middle"
                          className="fill-zinc-500"
                          fontSize="9"
                        >
                          {day.label}
                        </text>
                      )}
                    </g>
                  );
                })}

                {/* Garis margin */}
                {daily.length > 1 && (
                  <polyline
                    points={marginPoints}
                    fill="none"
                    stroke="#10b981"
                    strokeWidth={2}
                    strokeLinejoin="round"
                    strokeLinecap="round"
                    opacity={0.85}
                  />
                )}
                {daily.map((day, index) => (
                  <circle
                    key={`margin-${day.key}`}
                    cx={padding.left + index * slotWidth + slotWidth / 2}
                    cy={yMargin(day.margin)}
                    r={daily.length === 1 ? 4 : 2.5}
                    fill="#fff"
                    stroke="#10b981"
                    strokeWidth={2}
                  />
                ))}

                <line
                  x1={padding.left}
                  x2={chartWidth - padding.right}
                  y1={yValue(0)}
                  y2={yValue(0)}
                  stroke="#d4d4d8"
                />
              </svg>
            </div>
          )}
        </div>

        {/* Produk paling untung */}
        <div className="rounded-2xl border border-zinc-200/80 bg-white shadow-xs">
          <div className="border-b border-zinc-100 px-5 py-4">
            <h2 className="flex items-center gap-1.5 text-sm font-bold text-zinc-900">
              <Trophy className="size-4 text-[#87482D]" />
              Produk Paling Untung
            </h2>
            <p className="mt-0.5 text-[11px] text-zinc-400">
              Top 5 kontributor laba pada periode ini
            </p>
          </div>

          {topProducts.length === 0 ? (
            <div className="px-5 py-12 text-center text-sm text-zinc-400">
              Belum ada produk terjual pada periode ini
            </div>
          ) : (
            <ul className="divide-y divide-zinc-100">
              {topProducts.map((product, index) => {
                const margin =
                  product.revenue > 0
                    ? Math.round((product.profit / product.revenue) * 1000) / 10
                    : 0;
                const width = Math.max(
                  4,
                  (Math.max(product.profit, 0) / maxProductProfit) * 100
                );

                return (
                  <li key={product.code} className="px-5 py-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex min-w-0 items-start gap-2">
                        <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-md bg-[#87482D]/10 text-[10px] font-bold tabular-nums text-[#87482D]">
                          {index + 1}
                        </span>
                        <div className="min-w-0">
                          <p className="truncate text-xs font-semibold text-zinc-800">
                            {product.name}
                          </p>
                          <p className="text-[10px] text-zinc-400">
                            {product.code}
                          </p>
                        </div>
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="text-xs font-bold tabular-nums text-emerald-600">
                          {formatRupiah(product.profit)}
                        </p>
                        <p className="text-[10px] text-zinc-400">
                          margin {margin}%
                        </p>
                      </div>
                    </div>
                    <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-zinc-100">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-[#a8613f] to-[#87482D]"
                        style={{ width: `${width}%` }}
                      />
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>

      {/* Main Table Card */}
      <div className="overflow-hidden rounded-2xl border border-zinc-200/80 bg-white shadow-xs">
        {/* Search header */}
        <div className="flex flex-col gap-3 border-b border-zinc-100 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-zinc-400" />
            <Input
              placeholder="Cari faktur, produk, atau kode..."
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setPage(1);
              }}
              className="h-10 rounded-xl pl-9 pr-9"
            />
            {search && (
              <button
                type="button"
                onClick={() => {
                  setSearch("");
                  setPage(1);
                }}
                aria-label="Hapus pencarian"
                className="absolute right-2.5 top-1/2 grid size-6 -translate-y-1/2 place-items-center rounded-md text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-600"
              >
                <X className="size-3.5" />
              </button>
            )}
          </div>

          <span className="text-xs font-medium text-zinc-400">
            {filtered.length} baris alokasi penjualan
          </span>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-sm">
            <thead>
              <tr className="border-b border-zinc-100 text-left text-xs font-semibold uppercase tracking-wider text-zinc-400">
                <th className="px-5 py-3.5">#</th>
                <th className="whitespace-nowrap px-5 py-3.5">No Faktur</th>
                <th className="whitespace-nowrap px-5 py-3.5">Tanggal</th>
                <th className="px-5 py-3.5">Produk</th>
                <th className="whitespace-nowrap px-5 py-3.5 text-center">Qty Jual</th>
                <th className="whitespace-nowrap px-5 py-3.5 text-right">Omset Jual</th>
                <th className="whitespace-nowrap px-5 py-3.5 text-right">Modal FIFO (HPP)</th>
                <th className="whitespace-nowrap px-5 py-3.5 text-right">Laba Kotor</th>
                <th className="whitespace-nowrap px-5 py-3.5 text-center">Margin</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {paginated.length === 0 ? (
                <tr>
                  <td
                    colSpan={9}
                    className="px-5 py-14 text-center text-zinc-400"
                  >
                    <DollarSign className="mx-auto mb-2 size-8 opacity-40" />
                    <p className="text-sm">
                      Belum ada data transaksi pada periode ini
                    </p>
                    <p className="mt-1 text-[11px] text-zinc-400">
                      Coba ubah rentang tanggal atau tekan tombol Reset
                    </p>
                  </td>
                </tr>
              ) : (
                paginated.map((record, index) => (
                  <tr
                    key={record.id}
                    className="transition-colors hover:bg-zinc-50/70"
                  >
                    <td className="px-5 py-3.5 text-xs tabular-nums text-zinc-400">
                      {startIndex + index + 1}
                    </td>
                    <td className="whitespace-nowrap px-5 py-3.5 font-mono text-xs font-bold text-zinc-900">
                      {record.invoiceNo}
                    </td>
                    <td className="whitespace-nowrap px-5 py-3.5 text-xs text-zinc-500">
                      {formatDate(record.date)}
                    </td>
                    <td className="px-5 py-3.5">
                      <p className="font-semibold text-zinc-900">
                        {record.productName}
                      </p>
                      <p className="text-[11px] text-zinc-400">
                        {record.productCode}
                      </p>
                    </td>
                    <td className="whitespace-nowrap px-5 py-3.5 text-center text-xs font-medium text-zinc-700">
                      {record.qty} {record.unitCode}
                    </td>
                    <td className="whitespace-nowrap px-5 py-3.5 text-right font-semibold tabular-nums text-zinc-900">
                      {formatRupiah(record.revenue)}
                    </td>
                    <td className="whitespace-nowrap px-5 py-3.5 text-right text-xs tabular-nums text-zinc-500">
                      {formatRupiah(record.cogs)}
                    </td>
                    <td
                      className={cn(
                        "whitespace-nowrap px-5 py-3.5 text-right font-bold tabular-nums",
                        record.grossProfit >= 0
                          ? "text-emerald-600"
                          : "text-red-600"
                      )}
                    >
                      {formatSignedRupiah(record.grossProfit)}
                    </td>
                    <td className="whitespace-nowrap px-5 py-3.5 text-center">
                      <span className="inline-flex items-center rounded-full bg-[#87482D]/10 px-2 py-0.5 text-xs font-semibold tabular-nums text-[#87482D]">
                        {record.marginPercent}%
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex flex-col items-center justify-between gap-3 border-t border-zinc-100 px-5 py-3.5 sm:flex-row">
          <div className="flex items-center gap-2 text-[11px] text-zinc-400">
            <span>Baris per halaman</span>
            <select
              value={pageSize}
              onChange={(event) => {
                setPageSize(Number(event.target.value));
                setPage(1);
              }}
              aria-label="Jumlah baris per halaman"
              className="h-8 rounded-lg border border-zinc-200 bg-white px-2 text-[11px] font-semibold text-zinc-600 outline-none focus:border-[#87482D] focus:ring-4 focus:ring-[#87482D]/12"
            >
              {PAGE_SIZES.map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
            <span>
              Menampilkan{" "}
              <strong className="font-semibold text-zinc-600">
                {filtered.length === 0 ? 0 : startIndex + 1}–
                {Math.min(startIndex + pageSize, filtered.length)}
              </strong>{" "}
              dari{" "}
              <strong className="font-semibold text-zinc-600">
                {filtered.length}
              </strong>
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setPage(Math.max(1, currentPage - 1))}
              disabled={currentPage <= 1}
              aria-label="Halaman sebelumnya"
              className="grid size-8 place-items-center rounded-lg border border-zinc-200 text-zinc-500 transition-colors hover:border-zinc-300 hover:bg-zinc-50 disabled:pointer-events-none disabled:opacity-40"
            >
              <ChevronLeft className="size-4" />
            </button>
            <span className="px-1 text-[11px] font-semibold tabular-nums text-zinc-600">
              {currentPage} / {totalPages}
            </span>
            <button
              type="button"
              onClick={() => setPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage >= totalPages}
              aria-label="Halaman berikutnya"
              className="grid size-8 place-items-center rounded-lg border border-zinc-200 text-zinc-500 transition-colors hover:border-zinc-300 hover:bg-zinc-50 disabled:pointer-events-none disabled:opacity-40"
            >
              <ChevronRight className="size-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
