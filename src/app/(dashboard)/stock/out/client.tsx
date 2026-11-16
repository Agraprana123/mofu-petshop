"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  ChevronLeft,
  ChevronRight,
  PackageMinus,
  Minus,
  RotateCcw,
  Search,
  AlertCircle,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog } from "@/components/ui/dialog";
import { ProductPicker } from "@/components/product-picker";
import { createStockAdjustmentAction } from "@/server/actions/stock.action";
import { cn } from "@/lib/utils";

interface MovementRecord {
  id: number;
  type: "SALE" | "RETURN_OUT" | "ADJUSTMENT";
  qtyBase: string;
  refType: string | null;
  refId: number | null;
  createdAt: string;
  product: {
    id: number;
    name: string;
    code: string;
    baseUnit: { code: string };
  };
  batch: {
    id: number;
    costPerBase: string;
  } | null;
}

interface ProductOption {
  id: number;
  name: string;
  code: string;
  baseUnit: { code: string };
  category?: { name: string } | null;
  batches: { qtyRemaining: string }[];
}

function formatQty(value: number) {
  return value.toLocaleString("id-ID", { maximumFractionDigits: 3 });
}

function todayValue() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(
    2,
    "0"
  )}-${String(now.getDate()).padStart(2, "0")}`;
}

/** Kunci tanggal lokal (YYYY-MM-DD) untuk filter periode. */
function dateKey(value: Date | string) {
  const date = value instanceof Date ? value : new Date(value);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
    2,
    "0"
  )}-${String(date.getDate()).padStart(2, "0")}`;
}

function addDays(date: Date, days: number) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + days);
}

const PAGE_SIZES = [10, 25, 50, 100];

export function StockOutClient({
  movements,
  products,
}: {
  movements: MovementRecord[];
  products: ProductOption[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [error, setError] = useState("");

  // Filter periode + pagination riwayat.
  const initialFrom =
    movements.length > 0
      ? dateKey(movements[movements.length - 1].createdAt)
      : todayValue();
  const [draftFrom, setDraftFrom] = useState(initialFrom);
  const [draftTo, setDraftTo] = useState(todayValue());
  const [from, setFrom] = useState(initialFrom);
  const [to, setTo] = useState(todayValue());
  const [pageSize, setPageSize] = useState(10);
  const [page, setPage] = useState(1);

  // State adjustment
  const [productId, setProductId] = useState<number>(0);
  const [qty, setQty] = useState<number>(1);
  const [notes, setNotes] = useState("");

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();

    return movements.filter((m) => {
      const key = dateKey(m.createdAt);
      if (from && key < from) return false;
      if (to && key > to) return false;
      if (!term) return true;
      return (
        m.product.name.toLowerCase().includes(term) ||
        m.product.code.toLowerCase().includes(term) ||
        (m.refType && m.refType.toLowerCase().includes(term))
      );
    });
  }, [movements, search, from, to]);

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
    if (preset === "MONTH") {
      start = new Date(today.getFullYear(), today.getMonth(), 1);
    }

    setDraftFrom(dateKey(start));
    setDraftTo(todayKey);
    setFrom(dateKey(start));
    setTo(todayKey);
    setPage(1);
  }

  function resetFilters() {
    setSearch("");
    setDraftFrom(initialFrom);
    setDraftTo(todayValue());
    setFrom(initialFrom);
    setTo(todayValue());
    setPageSize(10);
    setPage(1);
  }

  function openModal() {
    setError("");
    setProductId(0);
    setQty(1);
    setNotes("");
    setModalOpen(true);
  }

  function handleSubmitAdjustment() {
    if (!productId || qty <= 0) {
      setError("Pilih produk dan masukkan jumlah qty > 0.");
      return;
    }

    startTransition(async () => {
      const res = await createStockAdjustmentAction({
        productId,
        qty,
        type: "OUT",
        notes: notes.trim(),
      });

      if (res.error) {
        setError(res.error);
      } else {
        setModalOpen(false);
        router.refresh();
      }
    });
  }

  const typeBadge: Record<string, { label: string; className: string }> = {
    SALE: {
      label: "Faktur Penjualan",
      className: "bg-emerald-50 text-emerald-700 border border-emerald-200",
    },
    RETURN_OUT: {
      label: "Retur ke Supplier",
      className: "bg-[#87482D]/10 text-[#87482D] border border-[#87482D]/20",
    },
    ADJUSTMENT: {
      label: "Penyesuaian (Rusak/Hilang)",
      className: "bg-red-50 text-red-700 border border-red-200",
    },
  };

  const selectedProd = products.find((p) => p.id === productId);
  const totalStock = selectedProd
    ? selectedProd.batches.reduce((sum, b) => sum + Number(b.qtyRemaining), 0)
    : 0;
  const stockAfter = totalStock - qty;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 tracking-tight">
            Stock Keluar
          </h1>
          <p className="text-zinc-500 mt-1 text-sm">
            Riwayat pengurangan stok dari transaksi kasir, retur supplier, atau barang rusak/hilang (FIFO)
          </p>
        </div>
        <Button
          onClick={openModal}
          className="bg-[#87482D] hover:bg-[#6d3a24] text-white shadow-sm shadow-[#87482D]/20"
        >
          <Minus className="w-4 h-4" />
          Koreksi Pengurangan Stok Manual
        </Button>
      </div>

      {/* Filter periode */}
      <div className="rounded-2xl border border-zinc-200/80 bg-white p-4 shadow-xs sm:p-5">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-end">
          <div className="w-full space-y-1.5 sm:w-52">
            <Label
              htmlFor="stockOutFrom"
              className="text-xs font-semibold text-zinc-600"
            >
              Dari Tanggal
            </Label>
            <Input
              id="stockOutFrom"
              type="date"
              value={draftFrom}
              onChange={(event) => setDraftFrom(event.target.value)}
              className="h-11 rounded-xl"
            />
          </div>

          <div className="w-full space-y-1.5 sm:w-52">
            <Label
              htmlFor="stockOutTo"
              className="text-xs font-semibold text-zinc-600"
            >
              Sampai Tanggal
            </Label>
            <Input
              id="stockOutTo"
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

      {/* Main Table Card */}
      <div className="bg-white rounded-2xl border border-zinc-200/80 shadow-xs overflow-hidden">
        {/* Search header */}
        <div className="flex flex-col gap-3 border-b border-zinc-100 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-zinc-400" />
            <Input
              placeholder="Cari produk atau referensi..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
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
          <span className="whitespace-nowrap text-xs font-medium text-zinc-400">
            {filtered.length} riwayat stok keluar
          </span>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full min-w-[860px] text-sm">
            <thead>
              <tr className="border-b border-zinc-100 text-left text-xs font-semibold uppercase tracking-wider text-zinc-400">
                <th className="px-5 py-3.5">#</th>
                <th className="whitespace-nowrap px-5 py-3.5">Tanggal</th>
                <th className="px-5 py-3.5">Produk</th>
                <th className="whitespace-nowrap px-5 py-3.5 text-center">
                  Tipe Keluar
                </th>
                <th className="whitespace-nowrap px-5 py-3.5 text-center">
                  Batch Terpakai
                </th>
                <th className="px-5 py-3.5">Referensi</th>
                <th className="whitespace-nowrap px-5 py-3.5 text-right">
                  Qty Keluar
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {paginated.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-5 py-14 text-center text-zinc-400"
                  >
                    <PackageMinus className="mx-auto mb-2 size-8 opacity-40" />
                    <p className="text-sm">
                      Belum ada riwayat stok keluar pada periode ini
                    </p>
                    <p className="mt-1 text-[11px] text-zinc-400">
                      Coba ubah rentang tanggal atau tekan tombol Reset
                    </p>
                  </td>
                </tr>
              ) : (
                paginated.map((m, i) => (
                  <tr
                    key={m.id}
                    className="transition-colors hover:bg-zinc-50/70"
                  >
                    <td className="px-5 py-3.5 text-xs tabular-nums text-zinc-400">
                      {startIndex + i + 1}
                    </td>
                    <td className="px-5 py-3.5 text-zinc-500 text-xs whitespace-nowrap">
                      {new Date(m.createdAt).toLocaleDateString("id-ID", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                    <td className="px-5 py-3.5">
                      <p className="font-semibold text-zinc-900">{m.product.name}</p>
                      <p className="text-[11px] text-zinc-400">{m.product.code}</p>
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                          typeBadge[m.type]?.className ?? ""
                        }`}
                      >
                        {typeBadge[m.type]?.label ?? m.type}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      {m.batch ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-[#87482D]/10 text-[#87482D] font-mono text-xs font-bold">
                          Batch #{m.batch.id}
                        </span>
                      ) : (
                        <span className="text-zinc-400 text-xs">-</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-zinc-600 text-xs">
                      {m.refType || "-"}
                    </td>
                    <td className="px-5 py-3.5 text-right font-bold text-red-600">
                      {Number(m.qtyBase)} {m.product.baseUnit.code}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex flex-col items-center justify-between gap-3 border-t border-zinc-100 px-5 py-3.5 sm:flex-row">
          <div className="flex flex-wrap items-center gap-2 text-[11px] text-zinc-400">
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

      {/* Modal Penyesuaian Pengurangan Stok Manual */}
      <Dialog
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Pengurangan Stok Manual"
        description="Catat barang rusak, hilang, atau kadaluarsa. Batch terlama dipotong lebih dulu (FIFO)."
        className="max-w-xl"
      >
        <div className="space-y-5">
          {error && (
            <div className="flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 p-3 text-[13px] text-red-700">
              <AlertCircle className="mt-0.5 size-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="space-y-2">
            <Label>
              1. Cari &amp; Pilih Barang <span className="text-red-500">*</span>
            </Label>
            <ProductPicker
              products={products.map((p) => ({
                id: p.id,
                name: p.name,
                code: p.code,
                category: p.category,
                baseUnit: p.baseUnit,
                stock: p.batches.reduce(
                  (sum, batch) => sum + Number(batch.qtyRemaining),
                  0
                ),
              }))}
              value={productId}
              onChange={setProductId}
              allowOutOfStock={false}
            />
          </div>

          {/* Simulasi stok */}
          <div className="rounded-2xl border border-red-100 bg-red-50/60 p-4">
            <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.08em] text-red-600/80">
              <Minus className="size-3.5" />
              Simulasi Pengurangan Stok
            </p>

            {selectedProd ? (
              <div className="mt-2.5 space-y-1.5 text-xs text-zinc-600">
                <div className="flex items-center justify-between gap-2">
                  <span>Stok saat ini</span>
                  <span className="font-semibold tabular-nums text-zinc-800">
                    {formatQty(totalStock)} {selectedProd.baseUnit.code}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span>Jumlah keluar</span>
                  <span className="font-semibold tabular-nums text-zinc-800">
                    {formatQty(qty)} {selectedProd.baseUnit.code}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-2 border-t border-red-200/70 pt-1.5">
                  <span className="font-semibold text-red-700">
                    Stok setelah simpan
                  </span>
                  <span
                    className={cn(
                      "font-bold tabular-nums",
                      stockAfter < 0 ? "text-red-600" : "text-red-700"
                    )}
                  >
                    {formatQty(stockAfter)} {selectedProd.baseUnit.code}
                  </span>
                </div>
              </div>
            ) : (
              <p className="mt-2 text-xs text-red-700/70">
                Pilih barang untuk melihat simulasi stok.
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="adjQtyOut">
                2. Jumlah Dikeluarkan (
                {selectedProd?.baseUnit.code ?? "Unit"})
              </Label>
              <Input
                id="adjQtyOut"
                type="number"
                min="1"
                max={totalStock}
                step="1"
                value={qty || ""}
                onChange={(e) => setQty(Number(e.target.value))}
                className="h-11"
                required
              />
              {selectedProd && qty > totalStock && (
                <p className="text-[10px] font-medium text-red-500">
                  Jumlah melebihi stok tersedia.
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="adjNotesOut">3. Alasan Pengurangan</Label>
              <Input
                id="adjNotesOut"
                placeholder="Contoh: Kemasan robek / kadaluarsa"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="h-11"
                required
              />
            </div>
          </div>

          <div className="flex flex-col-reverse gap-2.5 border-t border-zinc-100 pt-4 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => setModalOpen(false)}
            >
              Batal
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleSubmitAdjustment}
              disabled={
                isPending ||
                !productId ||
                totalStock <= 0 ||
                qty > totalStock
              }
            >
              {isPending ? "Mengurangi Stok..." : "Keluarkan Stok"}
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}

