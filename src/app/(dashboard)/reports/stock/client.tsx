"use client";

import { useMemo, useState } from "react";
import {
  Boxes,
  Search,
  Download,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  X,
  SlidersHorizontal,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { cn } from "@/lib/utils";

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
  minStock: number;
  estimatedSellPrice: number;
  isCritical: boolean;
}

interface CategoryOption {
  id: number;
  name: string;
}

type StatusFilter = "ALL" | "SAFE" | "CRITICAL" | "OUT";
type SortKey = "NAME_ASC" | "STOCK_ASC" | "STOCK_DESC" | "ASSET_DESC";

const PAGE_SIZES = [10, 25, 50, 100];

type StockStatus = "SAFE" | "CRITICAL" | "OUT";

function getStatus(item: StockReportItem): StockStatus {
  if (item.totalStock <= 0) return "OUT";
  if (item.isCritical) return "CRITICAL";
  return "SAFE";
}

function getStatusLabel(item: StockReportItem) {
  const status = getStatus(item);
  if (status === "OUT") return "Stok Habis";
  if (status === "CRITICAL") return `Kritis (<${item.minStock})`;
  return "Aman";
}

function StatusBadge({
  status,
  minStock,
}: {
  status: StockStatus;
  minStock: number;
}) {
  if (status === "OUT") {
    return (
      <span className="inline-flex items-center rounded-full border border-red-200 bg-red-50 px-2.5 py-0.5 text-xs font-semibold text-red-600">
        Stok Habis
      </span>
    );
  }

  if (status === "CRITICAL") {
    return (
      <span className="inline-flex items-center rounded-full border border-amber-200 bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-700">
        Kritis (&lt;{minStock})
      </span>
    );
  }

  return (
    <span className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">
      Aman
    </span>
  );
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
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
  const [sortKey, setSortKey] = useState<SortKey>("NAME_ASC");
  const [pageSize, setPageSize] = useState(10);
  const [page, setPage] = useState(1);

  const hasActiveFilter =
    search.trim() !== "" ||
    selectedCategory !== "ALL" ||
    statusFilter !== "ALL" ||
    sortKey !== "NAME_ASC";

  const statusCounts = useMemo(() => {
    const term = search.trim().toLowerCase();
    const base = items.filter((item) => {
      const matchSearch =
        !term ||
        item.name.toLowerCase().includes(term) ||
        item.code.toLowerCase().includes(term);
      const matchCategory =
        selectedCategory === "ALL" ||
        item.categoryId.toString() === selectedCategory;
      return matchSearch && matchCategory;
    });

    return base.reduce(
      (acc, item) => {
        acc[getStatus(item)] += 1;
        return acc;
      },
      { SAFE: 0, CRITICAL: 0, OUT: 0 } as Record<StockStatus, number>
    );
  }, [items, search, selectedCategory]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();

    const result = items.filter((item) => {
      const matchSearch =
        !term ||
        item.name.toLowerCase().includes(term) ||
        item.code.toLowerCase().includes(term) ||
        item.categoryName.toLowerCase().includes(term);
      const matchCategory =
        selectedCategory === "ALL" ||
        item.categoryId.toString() === selectedCategory;
      const matchStatus =
        statusFilter === "ALL" || getStatus(item) === statusFilter;

      return matchSearch && matchCategory && matchStatus;
    });

    return result.sort((a, b) => {
      switch (sortKey) {
        case "STOCK_ASC":
          return a.totalStock - b.totalStock || a.name.localeCompare(b.name);
        case "STOCK_DESC":
          return b.totalStock - a.totalStock || a.name.localeCompare(b.name);
        case "ASSET_DESC":
          return b.assetValue - a.assetValue || a.name.localeCompare(b.name);
        default:
          return a.name.localeCompare(b.name);
      }
    });
  }, [items, search, selectedCategory, statusFilter, sortKey]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const startIndex = (currentPage - 1) * pageSize;
  const paginated = filtered.slice(startIndex, startIndex + pageSize);

  const totalProducts = filtered.length;
  const totalPhysicalStock = filtered.reduce((s, i) => s + i.totalStock, 0);
  const totalAssetValue = filtered.reduce((s, i) => s + i.assetValue, 0);
  const criticalCount = filtered.filter((i) => getStatus(i) !== "SAFE").length;

  function resetFilters() {
    setSearch("");
    setSelectedCategory("ALL");
    setStatusFilter("ALL");
    setSortKey("NAME_ASC");
    setPageSize(10);
    setPage(1);
  }

  function changeFilter(action: () => void) {
    action();
    setPage(1);
  }

  function exportCsv() {
    if (filtered.length === 0) return;

    const header = [
      "No",
      "Kode Produk",
      "Nama Produk",
      "Kategori",
      "Satuan Dasar",
      "Total Stok",
      "Modal Terakhir",
      "Margin (%)",
      "Estimasi Jual (FIFO)",
      "Nilai Aset Stok",
      "Status",
    ];

    const rows = filtered.map((item, index) => [
      index + 1,
      item.code,
      item.name,
      item.categoryName,
      item.unitCode,
      item.totalStock,
      item.costPerBase,
      item.margin,
      item.estimatedSellPrice,
      item.assetValue,
      getStatusLabel(item),
    ]);

    const csv = [header, ...rows]
      .map((row) =>
        row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")
      )
      .join("\n");

    const blob = new Blob([`\uFEFF${csv}`], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `mofu_stok_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="page-enter mx-auto max-w-7xl space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-zinc-900">
            Laporan Stok Gudang
          </h1>
          <p className="mt-1 text-sm text-zinc-500">
            Ringkasan ketersediaan stok fisik, modal FIFO aktif, dan nilai total
            aset barang
          </p>
        </div>
        <Button
          type="button"
          onClick={exportCsv}
          disabled={filtered.length === 0}
          className="h-11 bg-[#87482D] text-white shadow-sm shadow-[#87482D]/20 hover:bg-[#6d3a24]"
        >
          <Download className="size-4" />
          Export Laporan (CSV)
        </Button>
      </div>

      {/* Metric Cards — mengikuti filter aktif */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-xs">
          <p className="text-xs font-medium text-zinc-500">Total Produk</p>
          <p className="mt-1 text-2xl font-bold tabular-nums text-zinc-900">
            {totalProducts.toLocaleString("id-ID")}
          </p>
          <p className="mt-0.5 text-[10px] text-zinc-400">
            {hasActiveFilter ? `difilter dari ${items.length}` : "seluruh produk"}
          </p>
        </div>

        <div className="rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-xs">
          <p className="text-xs font-medium text-zinc-500">Total Stok Fisik</p>
          <p className="mt-1 text-2xl font-bold tabular-nums text-zinc-900">
            {totalPhysicalStock.toLocaleString("id-ID")}
          </p>
          <p className="mt-0.5 text-[10px] text-zinc-400">
            akumulasi satuan dasar
          </p>
        </div>

        <div className="rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-xs">
          <p className="text-xs font-medium text-zinc-500">
            Nilai Total Modal Aset
          </p>
          <p className="mt-1 text-2xl font-bold tabular-nums text-[#87482D]">
            Rp {totalAssetValue.toLocaleString("id-ID")}
          </p>
          <p className="mt-0.5 text-[10px] text-zinc-400">
            modal FIFO batch aktif
          </p>
        </div>

        <div className="rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-xs">
          <p className="text-xs font-medium text-zinc-500">Produk Stok Kritis</p>
          <p className="mt-1 text-2xl font-bold tabular-nums text-red-600">
            {criticalCount.toLocaleString("id-ID")}
          </p>
          <p className="mt-0.5 text-[10px] text-zinc-400">
            kritis + stok habis
          </p>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="overflow-hidden rounded-2xl border border-zinc-200/80 bg-white shadow-xs">
        {/* Filters */}
        <div className="space-y-3 border-b border-zinc-100 p-4">
          <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.08em] text-zinc-400">
            <SlidersHorizontal className="size-3.5" />
            Filter & Urutkan
            {hasActiveFilter && (
              <span className="rounded-full bg-[#87482D]/10 px-2 py-0.5 text-[10px] font-semibold normal-case tracking-normal text-[#87482D]">
                Aktif
              </span>
            )}
          </div>

          <div className="flex flex-col gap-2.5 lg:flex-row lg:items-center">
            <div className="relative w-full lg:max-w-xs">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-zinc-400" />
              <Input
                placeholder="Cari nama, kode, atau kategori..."
                value={search}
                onChange={(event) =>
                  changeFilter(() => setSearch(event.target.value))
                }
                className="h-10 rounded-xl pl-9 pr-9"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => changeFilter(() => setSearch(""))}
                  aria-label="Hapus pencarian"
                  className="absolute right-2.5 top-1/2 grid size-6 -translate-y-1/2 place-items-center rounded-md text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-600"
                >
                  <X className="size-3.5" />
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3 lg:flex lg:flex-1">
              <Select
                value={selectedCategory}
                onChange={(event) =>
                  changeFilter(() => setSelectedCategory(event.target.value))
                }
                aria-label="Filter kategori"
                className="h-10 rounded-xl text-xs lg:w-48"
              >
                <option value="ALL">
                  Semua Kategori ({items.length})
                </option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id.toString()}>
                    {category.name}
                  </option>
                ))}
              </Select>

              <Select
                value={statusFilter}
                onChange={(event) =>
                  changeFilter(() =>
                    setStatusFilter(event.target.value as StatusFilter)
                  )
                }
                aria-label="Filter status stok"
                className="h-10 rounded-xl text-xs lg:w-44"
              >
                <option value="ALL">
                  Semua Status ({statusCounts.SAFE + statusCounts.CRITICAL + statusCounts.OUT})
                </option>
                <option value="SAFE">Aman ({statusCounts.SAFE})</option>
                <option value="CRITICAL">
                  Stok Kritis ({statusCounts.CRITICAL})
                </option>
                <option value="OUT">Stok Habis ({statusCounts.OUT})</option>
              </Select>

              <Select
                value={sortKey}
                onChange={(event) =>
                  changeFilter(() => setSortKey(event.target.value as SortKey))
                }
                aria-label="Urutkan data"
                className="h-10 rounded-xl text-xs lg:w-52"
              >
                <option value="NAME_ASC">Urutkan: Nama A–Z</option>
                <option value="STOCK_ASC">Stok Terendah</option>
                <option value="STOCK_DESC">Stok Tertinggi</option>
                <option value="ASSET_DESC">Nilai Aset Terbesar</option>
              </Select>

              <Button
                type="button"
                variant="outline"
                onClick={resetFilters}
                disabled={!hasActiveFilter}
                className="h-10 shrink-0 lg:ml-auto"
              >
                <RotateCcw className="size-3.5" />
                Reset
              </Button>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 text-[11px]">
            <p className="text-zinc-400">
              Menampilkan{" "}
              <strong className="font-semibold text-zinc-600">
                {filtered.length === 0 ? 0 : startIndex + 1}–
                {Math.min(startIndex + pageSize, filtered.length)}
              </strong>{" "}
              dari{" "}
              <strong className="font-semibold text-zinc-600">
                {filtered.length}
              </strong>{" "}
              produk
              {hasActiveFilter && (
                <span className="text-zinc-400">
                  {" "}
                  (total keseluruhan {items.length} produk)
                </span>
              )}
            </p>

            <div className="flex flex-wrap items-center gap-1.5">
              {[
                { key: "SAFE" as const, label: "Aman", dot: "bg-emerald-500" },
                {
                  key: "CRITICAL" as const,
                  label: "Kritis",
                  dot: "bg-amber-500",
                },
                { key: "OUT" as const, label: "Habis", dot: "bg-red-500" },
              ].map((status) => {
                const active = statusFilter === status.key;
                return (
                  <button
                    key={status.key}
                    type="button"
                    onClick={() =>
                      changeFilter(() =>
                        setStatusFilter(active ? "ALL" : status.key)
                      )
                    }
                    aria-pressed={active}
                    className={cn(
                      "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-semibold transition-colors",
                      active
                        ? "border-[#87482D] bg-[#87482D] text-white"
                        : "border-zinc-200 bg-white text-zinc-500 hover:border-[#87482D]/30 hover:text-[#87482D]"
                    )}
                  >
                    <span
                      className={cn(
                        "size-1.5 rounded-full",
                        active ? "bg-white" : status.dot
                      )}
                    />
                    {status.label}
                    <span
                      className={cn(
                        "tabular-nums",
                        active ? "text-white/70" : "text-zinc-400"
                      )}
                    >
                      {statusCounts[status.key]}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-100 text-left text-xs font-semibold uppercase tracking-wider text-zinc-400">
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
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-5 py-14 text-center">
                    <Boxes className="mx-auto mb-2 size-8 text-zinc-300" />
                    <p className="text-sm font-medium text-zinc-500">
                      Tidak ada produk yang cocok
                    </p>
                    <p className="mt-1 text-xs text-zinc-400">
                      Coba ubah kata kunci, kategori, atau status stok.
                    </p>
                    {hasActiveFilter && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={resetFilters}
                        className="mt-3"
                      >
                        <RotateCcw className="size-3.5" />
                        Reset Filter
                      </Button>
                    )}
                  </td>
                </tr>
              ) : (
                paginated.map((item, index) => {
                  const status = getStatus(item);

                  return (
                    <tr
                      key={item.id}
                      className="transition-colors hover:bg-zinc-50/70"
                    >
                      <td className="px-5 py-3.5 text-xs tabular-nums text-zinc-400">
                        {startIndex + index + 1}
                      </td>
                      <td className="px-5 py-3.5">
                        <p className="font-semibold text-zinc-900">
                          {item.name}
                        </p>
                        <p className="text-[11px] text-zinc-400">{item.code}</p>
                      </td>
                      <td className="px-5 py-3.5 text-xs text-zinc-600">
                        {item.categoryName}
                      </td>
                      <td className="px-5 py-3.5 text-center font-bold tabular-nums text-zinc-900">
                        {item.totalStock.toLocaleString("id-ID")}{" "}
                        {item.unitCode}
                      </td>
                      <td className="px-5 py-3.5 text-right text-xs tabular-nums text-zinc-600">
                        {item.costPerBase > 0
                          ? `Rp ${item.costPerBase.toLocaleString("id-ID")}`
                          : "-"}
                      </td>
                      <td className="px-5 py-3.5 text-right text-xs font-semibold tabular-nums text-zinc-900">
                        {item.estimatedSellPrice > 0
                          ? `Rp ${item.estimatedSellPrice.toLocaleString("id-ID")}`
                          : "-"}
                      </td>
                      <td className="px-5 py-3.5 text-right text-xs font-bold tabular-nums text-[#87482D]">
                        Rp {item.assetValue.toLocaleString("id-ID")}
                      </td>
                      <td className="px-5 py-3.5 text-center">
                        <StatusBadge status={status} minStock={item.minStock} />
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex flex-col gap-3 border-t border-zinc-100 px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2 text-[11px] text-zinc-400">
            <span>Baris per halaman</span>
            <Select
              value={pageSize.toString()}
              onChange={(event) => {
                setPageSize(Number(event.target.value));
                setPage(1);
              }}
              aria-label="Jumlah baris per halaman"
              className="h-8 w-20 rounded-lg text-xs"
            >
              {PAGE_SIZES.map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </Select>
          </div>

          <p className="text-[11px] text-zinc-400">
            Halaman{" "}
            <strong className="font-semibold text-zinc-600">
              {currentPage}
            </strong>{" "}
            dari{" "}
            <strong className="font-semibold text-zinc-600">
              {totalPages}
            </strong>
          </p>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              aria-label="Halaman sebelumnya"
              className="grid size-9 place-items-center rounded-lg text-zinc-500 transition-colors hover:bg-zinc-100 disabled:opacity-30 disabled:hover:bg-transparent"
            >
              <ChevronLeft className="size-4" />
            </button>

            {Array.from({ length: totalPages }, (_, index) => index + 1)
              .filter(
                (number) =>
                  number === 1 ||
                  number === totalPages ||
                  Math.abs(number - currentPage) <= 1
              )
              .map((number, index, list) => {
                const previous = list[index - 1];
                return (
                  <span key={number} className="flex items-center">
                    {previous && number - previous > 1 && (
                      <span className="px-1 text-[11px] text-zinc-300">…</span>
                    )}
                    <button
                      type="button"
                      onClick={() => setPage(number)}
                      aria-label={`Halaman ${number}`}
                      aria-current={number === currentPage ? "page" : undefined}
                      className={cn(
                        "grid size-9 place-items-center rounded-lg text-[12px] font-semibold transition-colors",
                        number === currentPage
                          ? "bg-[#87482D] text-white shadow-sm shadow-[#87482D]/20"
                          : "text-zinc-500 hover:bg-zinc-100"
                      )}
                    >
                      {number}
                    </button>
                  </span>
                );
              })}

            <button
              type="button"
              onClick={() => setPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              aria-label="Halaman berikutnya"
              className="grid size-9 place-items-center rounded-lg text-zinc-500 transition-colors hover:bg-zinc-100 disabled:opacity-30 disabled:hover:bg-transparent"
            >
              <ChevronRight className="size-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
