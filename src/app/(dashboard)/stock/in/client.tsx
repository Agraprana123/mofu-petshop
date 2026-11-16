"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  ArrowDownLeft,
  CalendarDays,
  Check,
  ChevronLeft,
  ChevronRight,
  FileText,
  FlaskConical,
  Minus,
  Package,
  PackagePlus,
  Plus,
  RotateCcw,
  Search,
  StickyNote,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Dialog } from "@/components/ui/dialog";
import { createStockAdjustmentAction } from "@/server/actions/stock.action";
import { cn } from "@/lib/utils";

interface MovementRecord {
  id: number;
  type: "PURCHASE" | "RETURN_IN" | "ADJUSTMENT";
  qtyBase: string;
  refType: string | null;
  refId: number | null;
  note: string | null;
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
    qtyRemaining: string;
  } | null;
}

interface ProductOption {
  id: number;
  name: string;
  code: string;
  sellPrice: string | null;
  category: { id: number; name: string } | null;
  baseUnit: { id: number; code: string; name: string };
  units: {
    id: number;
    unitId: number;
    conversionToBase: string;
    unit: { id: number; code: string; name: string };
  }[];
  batches: {
    qtyRemaining: string;
    costPerBase: string;
    sellPricePerBase: string;
    receivedAt: string;
  }[];
}

function normalize(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function getProductStock(product: ProductOption) {
  return product.batches.reduce(
    (sum, batch) => sum + Number(batch.qtyRemaining),
    0
  );
}

function getLatestCost(product: ProductOption) {
  const latest = product.batches.find((batch) => Number(batch.costPerBase) > 0);
  return latest ? Number(latest.costPerBase) : 0;
}

function getLatestSellPrice(product: ProductOption) {
  const latest = product.batches.find(
    (batch) => Number(batch.sellPricePerBase) > 0
  );
  if (latest) return Number(latest.sellPricePerBase);
  return Number(product.sellPrice ?? 0);
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

function ProductSearchField({
  products,
  value,
  onChange,
}: {
  products: ProductOption[];
  value: number;
  onChange: (product: ProductOption) => void;
}) {
  const [query, setQuery] = useState("");
  const [changing, setChanging] = useState(false);
  const selected = products.find((product) => product.id === value);
  const showSearch = !selected || changing;

  const results = useMemo(() => {
    const terms = normalize(query).split(" ").filter(Boolean);

    return products
      .filter((product) => {
        if (terms.length === 0) return true;
        const haystack = normalize(
          `${product.name} ${product.code} ${product.category?.name ?? ""}`
        );
        return terms.every((term) => haystack.includes(term));
      })
      .slice(0, 60);
  }, [products, query]);

  if (showSearch) {
    return (
      <div className="space-y-2">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-zinc-400" />
          <input
            autoFocus
            type="text"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && results[0]) {
                event.preventDefault();
                onChange(results[0]);
                setQuery("");
                setChanging(false);
              }
            }}
            placeholder="Ketik nama produk, kode, atau kategori..."
            aria-label="Cari produk"
            className="h-11 w-full rounded-xl border border-zinc-200 bg-white pl-9 pr-3 text-sm text-zinc-900 shadow-xs outline-none transition-all placeholder:text-zinc-400 focus:border-[#87482D] focus:ring-4 focus:ring-[#87482D]/12"
          />
        </div>

        {selected && changing && (
          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => {
                setChanging(false);
                setQuery("");
              }}
              className="text-[11px] font-semibold text-zinc-400 transition-colors hover:text-[#87482D]"
            >
              Batal ganti barang
            </button>
          </div>
        )}

        <div className="max-h-56 overflow-y-auto rounded-xl border border-zinc-200 bg-white">
          {results.length === 0 ? (
            <div className="px-4 py-8 text-center text-xs text-zinc-400">
              Produk tidak ditemukan. Coba kata kunci lain.
            </div>
          ) : (
            results.map((product) => {
              const stock = getProductStock(product);
              return (
                <button
                  key={product.id}
                  type="button"
                  onClick={() => {
                    onChange(product);
                    setQuery("");
                    setChanging(false);
                  }}
                  className="flex w-full items-center gap-3 border-b border-zinc-100 px-3 py-2.5 text-left transition-colors last:border-b-0 hover:bg-[#87482D]/5"
                >
                  <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-[#87482D]/10 text-[#87482D]">
                    <Package className="size-4" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[13px] font-semibold text-zinc-800">
                      {product.name}
                    </span>
                    <span className="mt-0.5 flex items-center gap-1.5 text-[10px] text-zinc-400">
                      <span className="font-mono">{product.code}</span>
                      {product.category && (
                        <>
                          <span>·</span>
                          <span className="truncate">
                            {product.category.name}
                          </span>
                        </>
                      )}
                    </span>
                  </span>
                  <span
                    className={cn(
                      "shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold tabular-nums",
                      stock > 0
                        ? "bg-emerald-50 text-emerald-700"
                        : "bg-red-50 text-red-600"
                    )}
                  >
                    {stock > 0
                      ? `${formatQty(stock)} ${product.baseUnit.code}`
                      : "Habis"}
                  </span>
                </button>
              );
            })
          )}
        </div>
      </div>
    );
  }

  const stock = getProductStock(selected);

  return (
    <div className="flex items-center gap-3 rounded-xl border border-[#87482D]/25 bg-[#87482D]/5 p-3">
      <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-white text-[#87482D] shadow-xs">
        <Check className="size-5" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-zinc-900">
          {selected.name}
        </p>
        <p className="mt-0.5 flex flex-wrap items-center gap-x-1.5 text-[10px] text-zinc-500">
          <span className="font-mono">{selected.code}</span>
          {selected.category && (
            <>
              <span>·</span>
              <span>{selected.category.name}</span>
            </>
          )}
          <span>·</span>
          <span className="font-semibold text-emerald-600">
            Stok {formatQty(stock)} {selected.baseUnit.code}
          </span>
        </p>
      </div>
      <button
        type="button"
        onClick={() => {
          setChanging(true);
          setQuery("");
        }}
        className="shrink-0 rounded-lg px-2.5 py-1 text-[11px] font-semibold text-[#87482D] transition-colors hover:bg-[#87482D]/10"
      >
        Ganti Barang
      </button>
    </div>
  );
}

export function StockInClient({
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

  // State form stok masuk
  const [productId, setProductId] = useState<number>(0);
  const [unitId, setUnitId] = useState<number>(0);
  const [qty, setQty] = useState<number>(1);
  const [costPerBase, setCostPerBase] = useState<number>(0);
  const [sellPricePerBase, setSellPricePerBase] = useState<number>(0);
  const [receivedAt, setReceivedAt] = useState(todayValue());
  const [notes, setNotes] = useState("");

  const selectedProduct = products.find((p) => p.id === productId);
  const selectedUnit = selectedProduct
    ? unitId === selectedProduct.baseUnit.id
      ? null
      : selectedProduct.units.find((unit) => unit.unitId === unitId)
    : null;
  const conversion = selectedUnit ? Number(selectedUnit.conversionToBase) : 1;
  const unitCode =
    selectedUnit?.unit.code ??
    selectedProduct?.baseUnit.code ??
    "UNIT";
  const currentStock = selectedProduct ? getProductStock(selectedProduct) : 0;
  const qtyBase = Math.round(qty * conversion * 1000) / 1000;
  const stockAfter = currentStock + qtyBase;
  const marginPercent =
    costPerBase > 0 && sellPricePerBase > 0
      ? ((sellPricePerBase - costPerBase) / costPerBase) * 100
      : null;

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
        (m.refType && m.refType.toLowerCase().includes(term)) ||
        (m.note && m.note.toLowerCase().includes(term))
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
    setUnitId(0);
    setQty(1);
    setCostPerBase(0);
    setSellPricePerBase(0);
    setReceivedAt(todayValue());
    setNotes("");
    setModalOpen(true);
  }

  function handleSelectProduct(product: ProductOption) {
    setProductId(product.id);
    setUnitId(product.baseUnit.id);
    setQty(1);
    setCostPerBase(getLatestCost(product));
    setSellPricePerBase(getLatestSellPrice(product));
  }

  function handleSubmitAdjustment() {
    if (!selectedProduct) {
      setError("Pilih produk terlebih dahulu.");
      return;
    }
    if (qty <= 0) {
      setError("Jumlah masuk harus lebih dari 0.");
      return;
    }
    if (!receivedAt) {
      setError("Tanggal masuk wajib diisi.");
      return;
    }

    startTransition(async () => {
      const res = await createStockAdjustmentAction({
        productId,
        unitId,
        qty,
        type: "IN",
        costPerBase,
        sellPricePerBase: sellPricePerBase > 0 ? sellPricePerBase : undefined,
        notes: notes.trim(),
        receivedAt: new Date(`${receivedAt}T12:00:00`).toISOString(),
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
    PURCHASE: {
      label: "Faktur Pembelian",
      className: "bg-[#87482D]/10 text-[#87482D] border border-[#87482D]/20",
    },
    RETURN_IN: {
      label: "Retur Penjualan (Customer)",
      className: "bg-blue-50 text-blue-700 border border-blue-200",
    },
    ADJUSTMENT: {
      label: "Penyesuaian / Opname",
      className: "bg-emerald-50 text-emerald-700 border border-emerald-200",
    },
  };

  return (
    <div className="page-enter mx-auto max-w-7xl space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3.5">
          <div className="hidden size-12 shrink-0 place-items-center rounded-2xl bg-[#87482D]/10 text-[#87482D] sm:grid">
            <PackagePlus className="size-6" />
          </div>
          <div>
            <h1 className="font-display text-2xl font-bold tracking-tight text-zinc-900">
              Stock Masuk
            </h1>
            <p className="mt-1 text-sm text-zinc-500">
              Catat penerimaan barang dalam satuan kemasan — otomatis dikonversi
              ke stok gudang.
            </p>
          </div>
        </div>
        <Button onClick={openModal} className="h-11 sm:self-center">
          <Plus className="size-4" />
          Catat Stok Masuk
        </Button>
      </div>

      {/* Filter periode */}
      <div className="rounded-2xl border border-zinc-200/80 bg-white p-4 shadow-xs sm:p-5">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-end">
          <div className="w-full space-y-1.5 sm:w-52">
            <Label
              htmlFor="stockInFrom"
              className="text-xs font-semibold text-zinc-600"
            >
              Dari Tanggal
            </Label>
            <Input
              id="stockInFrom"
              type="date"
              value={draftFrom}
              onChange={(event) => setDraftFrom(event.target.value)}
              className="h-11 rounded-xl"
            />
          </div>

          <div className="w-full space-y-1.5 sm:w-52">
            <Label
              htmlFor="stockInTo"
              className="text-xs font-semibold text-zinc-600"
            >
              Sampai Tanggal
            </Label>
            <Input
              id="stockInTo"
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
      <div className="overflow-hidden rounded-2xl border border-zinc-200/80 bg-white shadow-xs">
        {/* Search header */}
        <div className="flex flex-col gap-3 border-b border-zinc-100 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-zinc-400" />
            <Input
              placeholder="Cari produk, catatan, atau referensi..."
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
            {filtered.length} riwayat stok masuk
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
                  Tipe Masuk
                </th>
                <th className="px-5 py-3.5 text-center">Batch</th>
                <th className="px-5 py-3.5">Referensi / Catatan</th>
                <th className="whitespace-nowrap px-5 py-3.5 text-right">
                  Qty Masuk
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
                    <PackagePlus className="mx-auto mb-2 size-8 opacity-40" />
                    <p className="text-sm">
                      Belum ada riwayat stok masuk pada periode ini
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
                    <td className="whitespace-nowrap px-5 py-3.5 text-xs text-zinc-500">
                      {new Date(m.createdAt).toLocaleDateString("id-ID", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                    <td className="px-5 py-3.5">
                      <p className="font-semibold text-zinc-900">
                        {m.product.name}
                      </p>
                      <p className="text-[11px] text-zinc-400">
                        {m.product.code}
                      </p>
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      <span
                        className={cn(
                          "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold",
                          typeBadge[m.type]?.className ?? ""
                        )}
                      >
                        {typeBadge[m.type]?.label ?? m.type}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      {m.batch ? (
                        <span className="inline-flex items-center rounded-md bg-[#87482D]/10 px-2 py-0.5 font-mono text-xs font-bold text-[#87482D]">
                          #{m.batch.id}
                        </span>
                      ) : (
                        <span className="text-xs text-zinc-400">-</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-xs text-zinc-600">
                      {m.note ? (
                        <span className="flex items-center gap-1.5">
                          <StickyNote className="size-3 shrink-0 text-zinc-400" />
                          <span className="line-clamp-2">{m.note}</span>
                        </span>
                      ) : (
                        <span className="text-zinc-400">{m.refType || "-"}</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-right font-bold text-emerald-600">
                      +{formatQty(Number(m.qtyBase))}{" "}
                      {m.product.baseUnit.code}
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

      {/* Modal Catat Stok Masuk */}
      <Dialog
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Catat Stok Masuk"
        description="Cari barang, pilih satuan kemasan, lalu simpan. Stok gudang dihitung otomatis."
        className="max-w-2xl"
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
            <ProductSearchField
              products={products}
              value={productId}
              onChange={handleSelectProduct}
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="stockUnit">
                2. Satuan Kemasan <span className="text-red-500">*</span>
              </Label>
              <Select
                id="stockUnit"
                value={unitId || ""}
                onChange={(event) => setUnitId(Number(event.target.value))}
                disabled={!selectedProduct}
                className="h-11 rounded-xl text-sm"
              >
                {!selectedProduct && <option value="">Pilih produk dulu</option>}
                {selectedProduct && (
                  <>
                    <option value={selectedProduct.baseUnit.id}>
                      {selectedProduct.baseUnit.code} — satuan dasar
                    </option>
                    {selectedProduct.units.map((unit) => (
                      <option key={unit.unitId} value={unit.unitId}>
                        {unit.unit.code} — 1 {unit.unit.code} ={" "}
                        {formatQty(Number(unit.conversionToBase))}{" "}
                        {selectedProduct.baseUnit.code}
                      </option>
                    ))}
                  </>
                )}
              </Select>
              <p className="text-[10px] text-zinc-400">
                {selectedProduct
                  ? selectedUnit
                    ? `1 ${selectedUnit.unit.code} = ${formatQty(
                        conversion
                      )} ${selectedProduct.baseUnit.code}`
                    : `Menggunakan satuan dasar ${selectedProduct.baseUnit.code}`
                  : "Pilih barang untuk melihat satuan kemasan."}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="stockQty">
                3. Jumlah Masuk ({unitCode}) <span className="text-red-500">*</span>
              </Label>
              <div className="flex h-11 items-center rounded-xl border border-zinc-200 bg-white shadow-xs">
                <button
                  type="button"
                  onClick={() => setQty((value) => Math.max(1, value - 1))}
                  aria-label="Kurangi jumlah"
                  className="grid h-10 w-10 place-items-center rounded-l-xl text-zinc-400 transition-colors hover:bg-zinc-50 hover:text-zinc-700"
                >
                  <Minus className="size-4" />
                </button>
                <input
                  id="stockQty"
                  type="number"
                  min={0}
                  step="any"
                  value={qty || ""}
                  onChange={(event) => setQty(Number(event.target.value))}
                  className="h-full min-w-0 flex-1 border-0 bg-transparent text-center text-sm font-semibold text-zinc-900 outline-none"
                />
                <button
                  type="button"
                  onClick={() => setQty((value) => value + 1)}
                  aria-label="Tambah jumlah"
                  className="grid h-10 w-10 place-items-center rounded-r-xl text-zinc-400 transition-colors hover:bg-zinc-50 hover:text-zinc-700"
                >
                  <Plus className="size-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Simulasi Penambahan Stok */}
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-4">
            <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.08em] text-emerald-700">
              <FlaskConical className="size-3.5" />
              Simulasi Penambahan Stok Gudang
            </p>

            {selectedProduct ? (
              <div className="mt-2.5 space-y-1.5 text-xs text-zinc-600">
                <div className="flex items-center justify-between gap-2">
                  <span>Stok saat ini</span>
                  <span className="font-semibold tabular-nums text-zinc-800">
                    {formatQty(currentStock)} {selectedProduct.baseUnit.code}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span>Input</span>
                  <span className="font-semibold tabular-nums text-zinc-800">
                    {formatQty(qty)} {unitCode}
                    {conversion !== 1
                      ? ` (1 ${unitCode} = ${formatQty(conversion)} ${
                          selectedProduct.baseUnit.code
                        })`
                      : ""}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-2 border-t border-emerald-200/70 pt-1.5">
                  <span className="font-semibold text-emerald-700">
                    Total stok masuk
                  </span>
                  <span className="font-bold tabular-nums text-emerald-700">
                    +{formatQty(qtyBase)} {selectedProduct.baseUnit.code}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span className="font-semibold text-emerald-700">
                    Stok setelah simpan
                  </span>
                  <span className="font-bold tabular-nums text-emerald-700">
                    {formatQty(stockAfter)} {selectedProduct.baseUnit.code}
                  </span>
                </div>
              </div>
            ) : (
              <p className="mt-2 text-xs text-emerald-700/70">
                Pilih produk untuk melihat simulasi stok.
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="stockDate">
                <span className="inline-flex items-center gap-1.5">
                  <CalendarDays className="size-3.5 text-zinc-400" />
                  Tanggal Masuk <span className="text-red-500">*</span>
                </span>
              </Label>
              <Input
                id="stockDate"
                type="date"
                value={receivedAt}
                onChange={(event) => setReceivedAt(event.target.value)}
                className="h-11 rounded-xl"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="stockCost">
                Estimasi Harga Modal
                {selectedProduct
                  ? ` (@ ${selectedProduct.baseUnit.code})`
                  : " (@ Base Unit)"}
              </Label>
              <div className="relative">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-zinc-400">
                  Rp
                </span>
                <Input
                  id="stockCost"
                  type="number"
                  min="0"
                  step="100"
                  placeholder="0"
                  value={costPerBase || ""}
                  onChange={(event) =>
                    setCostPerBase(Number(event.target.value))
                  }
                  className="h-11 rounded-xl pl-9"
                />
              </div>
              <p className="text-[10px] text-zinc-400">
                Modal per satuan dasar, dipakai untuk perhitungan laba FIFO.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="stockSellPrice">
                Harga Jual
                {selectedProduct
                  ? ` (@ ${selectedProduct.baseUnit.code})`
                  : " (@ Base Unit)"}
              </Label>
              <div className="relative">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-zinc-400">
                  Rp
                </span>
                <Input
                  id="stockSellPrice"
                  type="number"
                  min="0"
                  step="100"
                  placeholder="Otomatis"
                  value={sellPricePerBase || ""}
                  onChange={(event) =>
                    setSellPricePerBase(Number(event.target.value))
                  }
                  className="h-11 rounded-xl pl-9"
                />
              </div>
              <p className="text-[10px] text-zinc-400">
                Harga jual batch ini. Kosong = otomatis dari harga master /
                margin produk.
              </p>
            </div>

            <div className="space-y-2">
              <Label>Margin Batch</Label>
              <div
                className={cn(
                  "flex h-11 items-center justify-between rounded-xl border px-3 text-sm font-bold tabular-nums",
                  marginPercent === null
                    ? "border-zinc-200 bg-zinc-50 text-zinc-400"
                    : marginPercent >= 0
                      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                      : "border-red-200 bg-red-50 text-red-600"
                )}
              >
                <span className="text-[11px] font-medium">
                  {marginPercent === null ? "Belum dihitung" : "Laba kotor"}
                </span>
                <span>
                  {marginPercent === null
                    ? "—"
                    : `${marginPercent >= 0 ? "+" : ""}${marginPercent.toLocaleString(
                        "id-ID",
                        { maximumFractionDigits: 1 }
                      )}%`}
                </span>
              </div>
              <p className="text-[10px] text-zinc-400">
                Dihitung otomatis dari harga modal dan harga jual per satuan
                dasar.
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="stockNotes">
              <span className="inline-flex items-center gap-1.5">
                <FileText className="size-3.5 text-zinc-400" />
                Catatan / No. DO Supplier
              </span>
            </Label>
            <Input
              id="stockNotes"
              placeholder="Contoh: Kiriman PO Royal Canin / DO-2026-0116"
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              className="h-11 rounded-xl"
            />
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
              onClick={handleSubmitAdjustment}
              disabled={isPending || !selectedProduct}
            >
              <ArrowDownLeft className="size-4" />
              {isPending ? "Menyimpan..." : "Simpan & Tambahkan ke Stok"}
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}
