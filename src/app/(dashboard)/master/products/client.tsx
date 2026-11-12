"use client";

import { useState, useTransition } from "react";
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
  costPerBase: number | null;
  sellPrice: number | null;
}

function formatRupiah(val: number | null): string {
  if (val === null || val <= 0) return "—";
  return `Rp ${val.toLocaleString("id-ID")}`;
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
  const [page, setPage] = useState(1);

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [error, setError] = useState("");

  // Delete dialog state
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);
  const [deleteWarning, setDeleteWarning] = useState<string | null>(null);

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

    return matchSearch && matchCategory && matchStatus;
  });

  const activeCount = products.filter((p) => p.isActive).length;
  const lowStockCount = products.filter((p) => p.totalStock < 5).length;
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const paginated = filtered.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

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
              Kelola katalog, satuan kemasan, dan estimasi harga jual.
            </p>
          </div>
        </div>
        <Button
          onClick={() => {
            setEditing(null);
            setError("");
            setModalOpen(true);
          }}
          className="h-11 sm:self-center"
        >
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
            label: "Nonaktif",
            value: products.length - activeCount,
            icon: Ban,
            tone: "bg-zinc-100 text-zinc-500",
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
        <div className="flex flex-col gap-3 border-b border-zinc-100 p-4 md:flex-row md:items-center md:justify-between">
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
            <table className="w-full min-w-[880px] text-sm">
              <thead>
                <tr className="border-b border-zinc-100 bg-zinc-50/60 text-left text-[10px] font-bold uppercase tracking-[0.12em] text-zinc-400">
                  <th className="px-4 py-3">#</th>
                  <th className="px-4 py-3">Produk</th>
                  <th className="px-4 py-3">Kategori</th>
                  <th className="px-4 py-3">Konversi &amp; Estimasi Harga</th>
                  <th className="px-4 py-3 text-center">Stok Gudang</th>
                  <th className="px-4 py-3 text-center">Status</th>
                  <th className="px-4 py-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {paginated.map((p, i) => (                  <tr
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
                      <div className="text-[11px] text-zinc-400">{p.code}</div>
                    </td>

                    {/* Kategori */}
                    <td className="px-4 py-3 text-xs text-zinc-600 font-medium">
                      {p.category.name}
                    </td>

                    {/* Konversi & Harga */}
                    <td className="px-4 py-3">
                      {/* Base unit price */}
                      <div className="flex items-center gap-2 text-zinc-700">
                        <span className="inline-flex items-center rounded-md bg-zinc-100 px-1.5 py-0.5 text-xs font-mono font-medium text-zinc-600">
                          {p.baseUnit.code}
                        </span>
                        {p.sellPrice && p.sellPrice > 0 ? (
                          <>
                            <span className="text-sm font-semibold text-zinc-900">
                              {formatRupiah(p.sellPrice)}
                            </span>
                            <span className="text-[10px] font-bold uppercase text-zinc-400">
                              Base
                            </span>
                          </>
                        ) : (
                          <span className="text-[11px] font-medium text-zinc-400">
                            Harga belum diatur
                          </span>
                        )}
                      </div>

                      {/* Conversion units */}
                      {p.units.map((pu) => {
                        const convPrice = p.sellPrice
                          ? Math.round(p.sellPrice * Number(pu.conversionToBase))
                          : null;
                        return (
                          <div
                            key={pu.id}
                            className="flex items-center gap-2 text-zinc-500 mt-1 text-xs"
                          >
                            <span className="inline-flex items-center rounded-md bg-amber-50 px-1.5 py-0.5 text-xs font-mono font-medium text-[#87482D]">
                              {pu.unit.code}
                            </span>
                            <span className="text-[11px] text-zinc-400">
                              ({Number(pu.conversionToBase)} {p.baseUnit.code})
                            </span>
                            <span className="font-medium text-zinc-800">
                              {formatRupiah(convPrice)}
                            </span>
                          </div>
                        );
                      })}
                    </td>

                    {/* Stok */}
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold ${
                          p.totalStock <= 0
                            ? "bg-red-100 text-red-700"
                            : p.totalStock < 5
                            ? "bg-[#87482D]/10 text-[#87482D]"
                            : "bg-emerald-100 text-emerald-800"
                        }`}
                      >
                        {Math.floor(p.totalStock)} {p.baseUnit.code}
                      </span>
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
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold transition-all ${
                          p.isActive
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100"
                            : "bg-zinc-100 text-zinc-500 border border-zinc-200 hover:bg-zinc-200"
                        }`}
                      >
                        {p.isActive ? (
                          <>
                            <ShieldCheck className="w-3 h-3 text-emerald-600" />
                            Aktif
                          </>
                        ) : (
                          <>
                            <Ban className="w-3 h-3 text-zinc-400" />
                            Nonaktif
                          </>
                        )}
                      </button>
                    </td>

                    {/* Aksi */}
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => {
                            setEditing(p);
                            setError("");
                            setModalOpen(true);
                          }}
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
      >
        <form action={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-600 text-sm">
              {error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="code">Kode Produk</Label>
              <Input
                id="code"
                name="code"
                placeholder="MKN-001"
                defaultValue={editing?.code ?? ""}
                required
                className="uppercase"
              />
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

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="categoryId">Kategori</Label>
              <Select
                id="categoryId"
                name="categoryId"
                defaultValue={editing?.categoryId?.toString() ?? ""}
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
                defaultValue={editing?.baseUnitId?.toString() ?? ""}
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

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="marginPercent">
                Margin Khusus (%)
                <span className="text-xs text-zinc-400 font-normal ml-1">
                  (Kosong = ikut margin kategori)
                </span>
              </Label>
              <Input
                id="marginPercent"
                name="marginPercent"
                type="number"
                step="0.1"
                placeholder="Contoh: 15"
                defaultValue={editing?.marginPercent?.toString() ?? ""}
              />
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
          </div>

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
              className="bg-[#87482D] hover:bg-[#6d3a24] text-white"
            >
              {isPending ? "Menyimpan..." : "Simpan"}
            </Button>
          </div>
        </form>
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
            <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-sm space-y-2">
              <div className="flex items-center gap-2 font-semibold text-amber-800">
                <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
                Data Transaksi Terdeteksi
              </div>
              <p className="text-xs leading-relaxed text-amber-800">
                Produk <strong>&quot;{deleteTarget?.name}&quot;</strong> memiliki riwayat
                faktur penjualan atau pembelian. Demi keamanan pembukuan dan
                laporan keuangan (FIFO), produk tidak bisa dihapus permanen.
              </p>
              <p className="text-xs text-amber-700 font-medium">
                Solusi terbaik: Anda dapat <strong>Menonaktifkan produk</strong> agar
                tidak muncul di Kasir (POS) maupun Faktur Pembelian, sementara
                laporan pembukuan masa lalu tetap aman.
              </p>
            </div>
          ) : (
            <div className="text-sm text-zinc-600 space-y-2">
              <p>
                Apakah Anda yakin ingin menghapus produk:
              </p>
              <div className="p-3 bg-zinc-50 rounded-xl border border-zinc-200">
                <p className="font-bold text-zinc-900">{deleteTarget?.name}</p>
                <p className="text-xs text-zinc-500">Kode: {deleteTarget?.code}</p>
              </div>
              <p className="text-xs text-zinc-400">
                Catatan: Jika produk belum ada transaksi penjualan riil, sistem akan
                menghapus bersih. Jika sudah ada transaksi, sistem akan menawarkan
                opsi Nonaktifkan.
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
                className="bg-[#87482D] hover:bg-[#6d3a24] text-white"
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
