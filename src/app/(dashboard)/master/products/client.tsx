"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  Pencil,
  Trash2,
  Search,
  Package,
  AlertTriangle,
  ShieldCheck,
  Ban,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  History,
  Wand2,
  Loader2,
  Receipt,
  Wallet,
  CalendarDays,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Dialog } from "@/components/ui/dialog";
import {
  createProduct,
  updateProduct,
  deleteProduct,
  toggleProductActive,
  generateProductCode,
  getProductSalesHistory,
} from "@/server/actions/product.action";

interface Category {
  id: number;
  name: string;
  defaultMarginPercent: string;
}
interface UnitOption {
  id: number;
  code: string;
  name: string;
}
interface ProductUnit {
  id: number;
  unitId: number;
  conversionToBase: string;
  unit: { id: number; code: string; name: string };
}

interface Product {
  id: number;
  code: string;
  name: string;
  categoryId: number;
  baseUnitId: number;
  isActive: boolean;
  category: { id: number; name: string; defaultMarginPercent: string };
  baseUnit: { id: number; code: string; name: string };
  units: ProductUnit[];
  marginPercent: string;
  totalStock: number;
  minStock: number;
  buyPrice: number | null;
  sellPrice: number | null;
  effectiveBuyPrice: number | null;
  effectiveSellPrice: number | null;
}

interface SalesHistoryItem {
  id: number;
  saleId: number;
  invoiceNo: string;
  date: string;
  customerName: string;
  qty: number;
  qtyBase: number;
  unitCode: string;
  subtotal: number;
}

function formatRupiah(val: number | null): string {
  if (val === null || val <= 0) return "—";
  return `Rp ${Math.round(val).toLocaleString("id-ID")}`;
}

function formatQty(val: number): string {
  return Number(val.toFixed(3)).toLocaleString("id-ID");
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

const PAGE_SIZE = 10;

export function ProductsClient({
  products,
  categories,
  units,
}: {
  products: Product[];
  categories: Category[];
  units: UnitOption[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [priceFilter, setPriceFilter] = useState("ALL");
  const [page, setPage] = useState(1);

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [error, setError] = useState("");

  // Nilai terkontrol untuk kode & satuan dasar (dipakai auto-code).
  const [formCode, setFormCode] = useState("");
  const [formCategoryId, setFormCategoryId] = useState("");
  const [formBaseUnitId, setFormBaseUnitId] = useState("");
  const [autoCodeLoading, setAutoCodeLoading] = useState(false);

  // Delete dialog state
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);
  const [deleteWarning, setDeleteWarning] = useState<string | null>(null);

  // Sales history dialog state
  const [historyTarget, setHistoryTarget] = useState<Product | null>(null);
  const [historyItems, setHistoryItems] = useState<SalesHistoryItem[] | null>(
    null
  );
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState("");

  const filtered = products.filter((p) => {
    const matchSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.code.toLowerCase().includes(search.toLowerCase());
    const matchCategory =
      categoryFilter === "ALL" || p.categoryId.toString() === categoryFilter;
    const matchStatus =
      statusFilter === "ALL" ||
      (statusFilter === "ACTIVE" && p.isActive) ||
      (statusFilter === "INACTIVE" && !p.isActive);
    const hasPrice = (p.effectiveSellPrice ?? 0) > 0;
    const matchPrice =
      priceFilter === "ALL" ||
      (priceFilter === "SET" && hasPrice) ||
      (priceFilter === "UNSET" && !hasPrice);

    return matchSearch && matchCategory && matchStatus && matchPrice;
  });

  const activeCount = products.filter((p) => p.isActive).length;
  const lowStockCount = products.filter(
    (p) => p.totalStock < p.minStock
  ).length;
  const unpricedCount = products.filter(
    (p) => (p.effectiveSellPrice ?? 0) <= 0
  ).length;
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const paginated = filtered.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  const selectedBaseUnit = useMemo(
    () => units.find((unit) => unit.id.toString() === formBaseUnitId),
    [units, formBaseUnitId]
  );

  const historySummary = useMemo(() => {
    if (!historyItems) return { count: 0, qty: 0, revenue: 0 };
    return historyItems.reduce(
      (acc, item) => ({
        count: acc.count + 1,
        qty: acc.qty + item.qtyBase,
        revenue: acc.revenue + item.subtotal,
      }),
      { count: 0, qty: 0, revenue: 0 }
    );
  }, [historyItems]);

  function openCreateModal() {
    setEditing(null);
    setError("");
    setFormCode("");
    setFormCategoryId("");
    setFormBaseUnitId("");
    setModalOpen(true);
  }

  function openEditModal(product: Product) {
    setEditing(product);
    setError("");
    setFormCode(product.code);
    setFormCategoryId(product.categoryId.toString());
    setFormBaseUnitId(product.baseUnitId.toString());
    setModalOpen(true);
  }

  async function handleGenerateCode(categoryId = formCategoryId) {
    if (!categoryId) {
      setError("Pilih kategori terlebih dahulu agar kode bisa dibuat otomatis.");
      return;
    }
    setError("");
    setAutoCodeLoading(true);
    try {
      const result = await generateProductCode(Number(categoryId));
      setFormCode(result.code);
    } finally {
      setAutoCodeLoading(false);
    }
  }

  function handleCategoryChange(value: string) {
    setFormCategoryId(value);
    // Saat menambah produk, langsung isi kode otomatis bila masih kosong.
    if (!editing && value && !formCode) {
      void handleGenerateCode(value);
    }
  }

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      const result = editing
        ? await updateProduct(editing.id, formData)
        : await createProduct(formData);
      if (result.error) {
        setError(result.error);
      } else {
        setModalOpen(false);
        router.refresh();
      }
    });
  }

  function handleToggleActive(p: Product) {
    startTransition(async () => {
      await toggleProductActive(p.id, !p.isActive);
      router.refresh();
    });
  }

  function handleOpenDelete(p: Product) {
    setDeleteTarget(p);
    setDeleteWarning(null);
  }

  function handleConfirmDelete(forceSoftDelete = false) {
    if (!deleteTarget) return;
    startTransition(async () => {
      const res = await deleteProduct(deleteTarget.id, forceSoftDelete);
      if (res.error === "HAS_TRANSACTIONS") {
        setDeleteWarning(res.message || "Produk memiliki riwayat transaksi.");
      } else if (res.error) {
        alert(res.error);
      } else {
        setDeleteTarget(null);
        setDeleteWarning(null);
        router.refresh();
      }
    });
  }

  async function handleOpenHistory(product: Product) {
    setHistoryTarget(product);
    setHistoryItems(null);
    setHistoryError("");
    setHistoryLoading(true);
    try {
      const items = await getProductSalesHistory(product.id);
      setHistoryItems(items);
    } catch {
      setHistoryError("Gagal memuat riwayat penjualan.");
    } finally {
      setHistoryLoading(false);
    }
  }

  function stockTone(product: Product) {
    if (product.totalStock <= 0) return "bg-red-100 text-red-700";
    if (product.totalStock < product.minStock)
      return "bg-amber-100 text-amber-800";
    return "bg-emerald-100 text-emerald-800";
  }

  return (
    <div className="page-enter space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3.5">
          <div className="hidden size-12 shrink-0 place-items-center rounded-2xl bg-[#87482D]/10 text-[#87482D] sm:grid">
            <Package className="size-6" />
          </div>
          <div>
            <h1 className="font-display text-2xl font-bold tracking-tight text-zinc-900">
              Master Produk
            </h1>
            <p className="mt-1 text-sm text-zinc-500">
              Atur harga beli, harga jual, batas stok, dan pantau riwayat
              penjualan tiap produk.
            </p>
          </div>
        </div>
        <Button onClick={openCreateModal} className="h-11 sm:self-center">
          <Plus className="size-4" /> Tambah Produk
        </Button>
      </div>

      {/* Summary strip */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          {
            label: "Total Produk",
            value: products.length,
            icon: Package,
            tone: "bg-[#87482D]/10 text-[#87482D]",
          },
          {
            label: "Produk Aktif",
            value: activeCount,
            icon: CheckCircle2,
            tone: "bg-emerald-50 text-emerald-600",
          },
          {
            label: "Stok Kritis",
            value: lowStockCount,
            icon: AlertTriangle,
            tone: "bg-amber-50 text-amber-600",
          },
          {
            label: "Harga Belum Diatur",
            value: unpricedCount,
            icon: Wallet,
            tone: "bg-rose-50 text-rose-500",
          },
        ].map((item) => {
          const Icon = item.icon;
          return (
            <div
              key={item.label}
              className="rounded-2xl border border-zinc-200/70 bg-white p-4 shadow-xs"
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-medium text-zinc-400">
                  {item.label}
                </span>
                <span
                  className={`grid size-8 place-items-center rounded-lg ${item.tone}`}
                >
                  <Icon className="size-4" />
                </span>
              </div>
              <p className="mt-2 font-display text-lg font-bold tracking-tight text-zinc-900">
                {item.value.toLocaleString("id-ID")}
              </p>
            </div>
          );
        })}
      </div>

      {/* Filter and Table Card */}
      <div className="overflow-hidden rounded-2xl border border-zinc-200/70 bg-white shadow-[0_1px_2px_rgba(24,25,26,0.04),0_16px_40px_-32px_rgba(24,25,26,0.25)]">
        {/* Filters */}
        <div className="flex flex-col gap-3 border-b border-zinc-100 p-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:flex-1">
            <div className="relative w-full max-w-xs">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-zinc-400" />
              <Input
                placeholder="Cari nama atau kode produk..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="pl-9"
              />
            </div>

            <Select
              value={categoryFilter}
              onChange={(e) => {
                setCategoryFilter(e.target.value);
                setPage(1);
              }}
              className="max-w-xs"
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
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="max-w-xs"
            >
              <option value="ALL">Semua Status</option>
              <option value="ACTIVE">Hanya Aktif</option>
              <option value="INACTIVE">Hanya Nonaktif</option>
            </Select>

            <Select
              value={priceFilter}
              onChange={(e) => {
                setPriceFilter(e.target.value);
                setPage(1);
              }}
              className="max-w-xs"
            >
              <option value="ALL">Semua Harga</option>
              <option value="SET">Harga sudah diatur</option>
              <option value="UNSET">Harga belum diatur</option>
            </Select>
          </div>

          <span className="whitespace-nowrap text-[11px] font-medium text-zinc-400">
            {filtered.length} dari {products.length} produk
          </span>
        </div>

        {/* Table */}
        {paginated.length === 0 ? (
          <div className="flex flex-col items-center px-4 py-16 text-center">
            <span className="grid size-14 place-items-center rounded-2xl bg-zinc-100 text-zinc-400">
              <Package className="size-6" />
            </span>
            <p className="mt-4 text-sm font-semibold text-zinc-700">
              Tidak ada produk
            </p>
            <p className="mt-1 text-xs text-zinc-400">
              Coba ubah kata kunci atau filter yang dipilih.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1060px] text-sm">
              <thead>
                <tr className="border-b border-zinc-100 bg-zinc-50/60 text-left text-[10px] font-bold uppercase tracking-[0.12em] text-zinc-400">
                  <th className="px-4 py-3">#</th>
                  <th className="px-4 py-3">Produk</th>
                  <th className="px-4 py-3">Kategori</th>
                  <th className="px-4 py-3">Harga Beli</th>
                  <th className="px-4 py-3">Harga Jual</th>
                  <th className="px-4 py-3 text-center">Stok Gudang</th>
                  <th className="px-4 py-3 text-center">Status</th>
                  <th className="px-4 py-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {paginated.map((p, i) => (
                  <tr
                    key={p.id}
                    className={`transition-colors hover:bg-zinc-50/80 ${
                      !p.isActive ? "bg-zinc-50/40 opacity-75" : ""
                    }`}
                  >
                    <td className="px-4 py-3 text-xs text-zinc-400">
                      {(currentPage - 1) * PAGE_SIZE + i + 1}
                    </td>

                    {/* Produk: Name + Code */}
                    <td className="px-4 py-3">
                      <div className="font-semibold text-zinc-900">{p.name}</div>
                      <div className="mt-0.5 flex items-center gap-1.5 text-[11px] text-zinc-400">
                        <span className="rounded bg-zinc-100 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-zinc-500">
                          {p.code}
                        </span>
                        <span>{p.baseUnit.name}</span>
                      </div>
                    </td>

                    {/* Kategori */}
                    <td className="px-4 py-3 text-xs font-medium text-zinc-600">
                      {p.category.name}
                    </td>

                    {/* Harga Beli */}
                    <td className="px-4 py-3">
                      <div
                        className={`text-[13px] font-semibold ${
                          (p.effectiveBuyPrice ?? 0) > 0
                            ? "text-zinc-700"
                            : "text-zinc-400"
                        }`}
                      >
                        {formatRupiah(p.effectiveBuyPrice)}
                      </div>
                      <div className="text-[10px] text-zinc-400">
                        per {p.baseUnit.code}
                      </div>
                    </td>

                    {/* Harga Jual */}
                    <td className="px-4 py-3">
                      <div
                        className={`text-sm font-bold ${
                          (p.effectiveSellPrice ?? 0) > 0
                            ? "text-zinc-900"
                            : "text-zinc-400"
                        }`}
                      >
                        {p.effectiveSellPrice && p.effectiveSellPrice > 0
                          ? formatRupiah(p.effectiveSellPrice)
                          : "Belum diatur"}
                      </div>
                      {(p.effectiveSellPrice ?? 0) > 0 && (
                        <div className="mt-1 space-y-0.5">
                          <div className="text-[10px] text-zinc-400">
                            per {p.baseUnit.code}
                          </div>
                          {p.units.map((pu) => (
                            <div
                              key={pu.id}
                              className="flex items-center gap-1.5 text-[11px] text-zinc-500"
                            >
                              <span className="rounded bg-amber-50 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-[#87482D]">
                                {pu.unit.code}
                              </span>
                              <span className="font-medium text-zinc-700">
                                {formatRupiah(
                                  (p.effectiveSellPrice ?? 0) *
                                    Number(pu.conversionToBase)
                                )}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </td>

                    {/* Stok */}
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold ${stockTone(
                          p
                        )}`}
                      >
                        {formatQty(p.totalStock)} {p.baseUnit.code}
                      </span>
                      <div className="mt-1 text-[10px] text-zinc-400">
                        Min. {formatQty(p.minStock)} {p.baseUnit.code}
                      </div>
                    </td>

                    {/* Status & Quick Toggle */}
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => handleToggleActive(p)}
                        title={
                          p.isActive
                            ? "Klik untuk Menonaktifkan produk"
                            : "Klik untuk Mengaktifkan produk"
                        }
                        className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-semibold transition-all ${
                          p.isActive
                            ? "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                            : "border-zinc-200 bg-zinc-100 text-zinc-500 hover:bg-zinc-200"
                        }`}
                      >
                        {p.isActive ? (
                          <>
                            <ShieldCheck className="size-3 text-emerald-600" />
                            Aktif
                          </>
                        ) : (
                          <>
                            <Ban className="size-3 text-zinc-400" />
                            Nonaktif
                          </>
                        )}
                      </button>
                    </td>

                    {/* Aksi */}
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleOpenHistory(p)}
                          className="grid size-9 place-items-center rounded-xl text-zinc-400 transition-colors hover:bg-sky-50 hover:text-sky-600"
                          title="Riwayat Penjualan"
                        >
                          <History className="size-4" />
                        </button>
                        <button
                          onClick={() => openEditModal(p)}
                          className="grid size-9 place-items-center rounded-xl text-zinc-400 transition-colors hover:bg-[#87482D]/8 hover:text-[#87482D]"
                          title="Edit Produk"
                        >
                          <Pencil className="size-4" />
                        </button>
                        <button
                          onClick={() => handleOpenDelete(p)}
                          className="grid size-9 place-items-center rounded-xl text-zinc-400 transition-colors hover:bg-red-50 hover:text-red-600"
                          title="Hapus Produk"
                        >
                          <Trash2 className="size-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        <div className="flex flex-col items-center justify-between gap-3 border-t border-zinc-100 px-4 py-3.5 sm:flex-row">
          <p className="text-[11px] text-zinc-400">
            Menampilkan{" "}
            <strong className="font-semibold text-zinc-600">
              {filtered.length === 0
                ? 0
                : (currentPage - 1) * PAGE_SIZE + 1}
              –{Math.min(currentPage * PAGE_SIZE, filtered.length)}
            </strong>{" "}
            dari{" "}
            <strong className="font-semibold text-zinc-600">
              {filtered.length}
            </strong>{" "}
            produk
          </p>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              aria-label="Halaman sebelumnya"
              className="grid size-9 place-items-center rounded-lg text-zinc-500 transition-colors hover:bg-zinc-100 disabled:opacity-30"
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
                      onClick={() => setPage(number)}
                      aria-label={`Halaman ${number}`}
                      aria-current={number === currentPage ? "page" : undefined}
                      className={`grid size-9 place-items-center rounded-lg text-[12px] font-semibold transition-colors ${
                        number === currentPage
                          ? "bg-[#87482D] text-white shadow-sm shadow-[#87482D]/20"
                          : "text-zinc-500 hover:bg-zinc-100"
                      }`}
                    >
                      {number}
                    </button>
                  </span>
                );
              })}
            <button
              onClick={() => setPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              aria-label="Halaman berikutnya"
              className="grid size-9 place-items-center rounded-lg text-zinc-500 transition-colors hover:bg-zinc-100 disabled:opacity-30"
            >
              <ChevronRight className="size-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Modal Tambah / Edit */}
      <Dialog
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? "Edit Produk" : "Tambah Produk Baru"}
        description="Harga diisi per satuan dasar. Stok yang belum punya harga akan memakai harga jual ini."
        className="max-w-2xl"
      >
        <form action={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="code">Kode Produk</Label>
              <div className="flex gap-2">
                <Input
                  id="code"
                  name="code"
                  placeholder="Otomatis jika kosong"
                  value={formCode}
                  onChange={(event) =>
                    setFormCode(event.target.value.toUpperCase())
                  }
                  className="font-mono uppercase"
                />
                <button
                  type="button"
                  onClick={() => void handleGenerateCode()}
                  disabled={autoCodeLoading || !formCategoryId}
                  title="Buat kode otomatis dari kategori"
                  className="inline-flex h-11 shrink-0 items-center gap-1.5 rounded-xl border border-[#87482D]/20 bg-[#87482D]/8 px-3 text-[11px] font-semibold text-[#87482D] transition-colors hover:bg-[#87482D]/15 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {autoCodeLoading ? (
                    <Loader2 className="size-3.5 animate-spin" />
                  ) : (
                    <Wand2 className="size-3.5" />
                  )}
                  Auto
                </button>
              </div>
              <p className="text-[10px] text-zinc-400">
                Pilih kategori dulu, lalu klik Auto. Contoh: MKN-001.
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="name">Nama Produk</Label>
              <Input
                id="name"
                name="name"
                placeholder="Whiskas Tuna 400gr"
                defaultValue={editing?.name ?? ""}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="categoryId">Kategori</Label>
              <Select
                id="categoryId"
                name="categoryId"
                value={formCategoryId}
                onChange={(event) => handleCategoryChange(event.target.value)}
                required
              >
                <option value="">Pilih Kategori</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} (Margin: {Number(c.defaultMarginPercent)}%)
                  </option>
                ))}
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="baseUnitId">Satuan Dasar (Terkecil)</Label>
              <Select
                id="baseUnitId"
                name="baseUnitId"
                value={formBaseUnitId}
                onChange={(event) => setFormBaseUnitId(event.target.value)}
                required
              >
                <option value="">Pilih Satuan</option>
                {units.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.code} - {u.name}
                  </option>
                ))}
              </Select>
            </div>
          </div>

          <div className="border-t border-dashed border-zinc-200 pt-4">
            <p className="mb-3 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.1em] text-[#87482D]">
              <Wallet className="size-3.5" />
              Harga &amp; Stok
            </p>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="buyPrice">
                  Harga Beli
                  <span className="ml-1 text-xs font-normal text-zinc-400">
                    per {selectedBaseUnit?.code ?? "satuan dasar"}
                  </span>
                </Label>
                <div className="relative">
                  <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xs font-medium text-zinc-400">
                    Rp
                  </span>
                  <Input
                    id="buyPrice"
                    name="buyPrice"
                    type="number"
                    min="0"
                    step="1"
                    placeholder="0"
                    defaultValue={editing?.buyPrice ?? ""}
                    className="pl-9"
                  />
                </div>
                <p className="text-[10px] text-zinc-400">
                  Modal beli per {selectedBaseUnit?.code ?? "satuan dasar"}.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="sellPrice">
                  Harga Jual
                  <span className="ml-1 text-xs font-normal text-zinc-400">
                    per {selectedBaseUnit?.code ?? "satuan dasar"}
                  </span>
                </Label>
                <div className="relative">
                  <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xs font-medium text-zinc-400">
                    Rp
                  </span>
                  <Input
                    id="sellPrice"
                    name="sellPrice"
                    type="number"
                    min="0"
                    step="1"
                    placeholder="0"
                    defaultValue={editing?.sellPrice ?? ""}
                    className="pl-9"
                  />
                </div>
                <p className="text-[10px] text-zinc-400">
                  Dipakai kasir untuk stok yang belum punya harga batch.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="minStock">
                  Minimal Stok Peringatan
                  <span className="ml-1 text-xs font-normal text-zinc-400">
                    {selectedBaseUnit?.code ?? "satuan dasar"}
                  </span>
                </Label>
                <Input
                  id="minStock"
                  name="minStock"
                  type="number"
                  min="0"
                  step="1"
                  placeholder="5"
                  defaultValue={editing?.minStock ?? 5}
                  required
                />
                <p className="text-[10px] text-zinc-400">
                  Produk ditandai kritis jika stok di bawah angka ini.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="marginPercent">
                  Margin Khusus (%)
                  <span className="ml-1 text-xs font-normal text-zinc-400">
                    opsional
                  </span>
                </Label>
                <Input
                  id="marginPercent"
                  name="marginPercent"
                  type="number"
                  step="0.1"
                  placeholder="Ikut margin kategori"
                  defaultValue={editing?.marginPercent?.toString() ?? ""}
                />
                <p className="text-[10px] text-zinc-400">
                  Dipakai saat harga jual produk masih kosong.
                </p>
              </div>
            </div>
          </div>

          {editing && (
            <div className="space-y-2">
              <Label htmlFor="isActive">Status Produk</Label>
              <Select
                id="isActive"
                name="isActive"
                defaultValue={editing.isActive ? "true" : "false"}
              >
                <option value="true">Aktif (Tampil di Kasir)</option>
                <option value="false">Nonaktif (Disembunyikan)</option>
              </Select>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setModalOpen(false)}
            >
              Batal
            </Button>
            <Button
              type="submit"
              disabled={isPending}
              className="bg-[#87482D] text-white hover:bg-[#6d3a24]"
            >
              {isPending ? "Menyimpan..." : "Simpan"}
            </Button>
          </div>
        </form>
      </Dialog>

      {/* Modal Riwayat Penjualan */}
      <Dialog
        open={!!historyTarget}
        onClose={() => {
          setHistoryTarget(null);
          setHistoryItems(null);
          setHistoryError("");
        }}
        title={`Riwayat Penjualan — ${historyTarget?.name ?? ""}`}
        description={
          historyTarget
            ? `${historyTarget.code} · ${historyTarget.category.name}`
            : undefined
        }
        className="max-w-2xl"
      >
        {historyLoading ? (
          <div className="flex flex-col items-center justify-center py-14 text-zinc-400">
            <Loader2 className="size-6 animate-spin" />
            <p className="mt-3 text-xs">Memuat riwayat penjualan...</p>
          </div>
        ) : historyError ? (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-600">
            {historyError}
          </div>
        ) : !historyItems || historyItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <span className="grid size-14 place-items-center rounded-2xl bg-zinc-100 text-zinc-400">
              <Receipt className="size-6" />
            </span>
            <p className="mt-4 text-sm font-semibold text-zinc-700">
              Belum ada penjualan
            </p>
            <p className="mt-1 max-w-xs text-xs text-zinc-400">
              Produk ini belum pernah tercatat pada faktur penjualan.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-xl border border-zinc-200/70 bg-zinc-50/70 p-3">
                <p className="text-[10px] font-medium text-zinc-400">
                  Transaksi
                </p>
                <p className="mt-1 font-display text-lg font-bold text-zinc-900">
                  {historySummary.count.toLocaleString("id-ID")}
                </p>
              </div>
              <div className="rounded-xl border border-zinc-200/70 bg-zinc-50/70 p-3">
                <p className="text-[10px] font-medium text-zinc-400">
                  Total Terjual
                </p>
                <p className="mt-1 font-display text-lg font-bold text-zinc-900">
                  {formatQty(historySummary.qty)}{" "}
                  <span className="text-[10px] font-semibold text-zinc-400">
                    {historyTarget?.baseUnit.code}
                  </span>
                </p>
              </div>
              <div className="rounded-xl border border-[#87482D]/15 bg-[#87482D]/5 p-3">
                <p className="text-[10px] font-medium text-[#87482D]/70">
                  Total Omzet
                </p>
                <p className="mt-1 font-display text-lg font-bold text-[#87482D]">
                  {formatRupiah(historySummary.revenue)}
                </p>
              </div>
            </div>

            <div className="overflow-hidden rounded-2xl border border-zinc-200">
              <div className="flex items-center gap-1.5 border-b border-zinc-200 bg-zinc-50/80 px-4 py-2.5 text-[10px] font-bold uppercase tracking-[0.1em] text-zinc-400">
                <CalendarDays className="size-3.5" />
                Riwayat terbaru
              </div>
              <div className="max-h-[320px] divide-y divide-zinc-100 overflow-y-auto">
                {historyItems.map((item) => (
                  <div
                    key={item.id}
                    className="flex flex-wrap items-center justify-between gap-3 px-4 py-3"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="rounded-md bg-zinc-100 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-zinc-600">
                          {item.invoiceNo}
                        </span>
                        <span className="text-[11px] font-medium text-zinc-700">
                          {formatDate(item.date)}
                        </span>
                      </div>
                      <p className="mt-1 text-[11px] text-zinc-400">
                        {item.customerName} · {formatQty(item.qty)}{" "}
                        {item.unitCode}
                      </p>
                    </div>
                    <span className="text-sm font-bold text-zinc-900">
                      {formatRupiah(item.subtotal)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {historyItems.length >= 100 && (
              <p className="text-[10px] text-zinc-400">
                Menampilkan 100 transaksi terbaru.
              </p>
            )}
          </div>
        )}
      </Dialog>

      {/* Modal Konfirmasi Hapus / Soft Delete */}
      <Dialog
        open={!!deleteTarget}
        onClose={() => {
          setDeleteTarget(null);
          setDeleteWarning(null);
        }}
        title="Hapus / Nonaktifkan Produk"
      >
        <div className="space-y-4">
          {deleteWarning ? (
            <div className="space-y-2 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
              <div className="flex items-center gap-2 font-semibold text-amber-800">
                <AlertTriangle className="size-5 shrink-0 text-amber-600" />
                Data Transaksi Terdeteksi
              </div>
              <p className="text-xs leading-relaxed text-amber-800">
                Produk <strong>&quot;{deleteTarget?.name}&quot;</strong> memiliki
                riwayat faktur penjualan atau pembelian. Demi keamanan pembukuan
                dan laporan keuangan (FIFO), produk tidak bisa dihapus permanen.
              </p>
              <p className="text-xs font-medium text-amber-700">
                Solusi terbaik: Anda dapat <strong>Menonaktifkan produk</strong>{" "}
                agar tidak muncul di Kasir (POS) maupun Faktur Pembelian,
                sementara laporan pembukuan masa lalu tetap aman.
              </p>
            </div>
          ) : (
            <div className="space-y-2 text-sm text-zinc-600">
              <p>Apakah Anda yakin ingin menghapus produk:</p>
              <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-3">
                <p className="font-bold text-zinc-900">{deleteTarget?.name}</p>
                <p className="text-xs text-zinc-500">
                  Kode: {deleteTarget?.code}
                </p>
              </div>
              <p className="text-xs text-zinc-400">
                Catatan: Jika produk belum ada transaksi penjualan riil, sistem
                akan menghapus bersih. Jika sudah ada transaksi, sistem akan
                menawarkan opsi Nonaktifkan.
              </p>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setDeleteTarget(null);
                setDeleteWarning(null);
              }}
            >
              Batal
            </Button>

            {deleteWarning ? (
              <Button
                type="button"
                onClick={() => handleConfirmDelete(true)}
                disabled={isPending}
                className="bg-[#87482D] text-white hover:bg-[#6d3a24]"
              >
                {isPending ? "Memproses..." : "Nonaktifkan Produk Saja"}
              </Button>
            ) : (
              <Button
                type="button"
                variant="destructive"
                onClick={() => handleConfirmDelete(false)}
                disabled={isPending}
              >
                {isPending ? "Menghapus..." : "Hapus Produk"}
              </Button>
            )}
          </div>
        </div>
      </Dialog>
    </div>
  );
}
