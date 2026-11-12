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
  Power,
  ShieldCheck,
  Ban,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
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
  if (val === null) return "-";
  return `Rp ${val.toLocaleString("id-ID")}`;
}

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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">
            Master Produk & Kustomisasi Satuan
          </h1>
          <p className="text-zinc-500 mt-1">
            Kelola katalog produk, harga jual FIFO, serta satuan kemasan
          </p>
        </div>
        <Button
          onClick={() => {
            setEditing(null);
            setError("");
            setModalOpen(true);
          }}
          className="bg-[#87482D] hover:bg-[#6d3a24] text-white shadow-sm shadow-[#87482D]/20"
        >
          <Plus className="w-4 h-4 mr-1.5" /> Tambah Produk Baru
        </Button>
      </div>

      {/* Filter and Table Card */}
      <div className="bg-white rounded-2xl border border-zinc-200/80 shadow-xs overflow-hidden">
        {/* Filters */}
        <div className="p-4 border-b border-zinc-100 flex flex-col md:flex-row md:items-center justify-between gap-3 bg-zinc-50/50">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 flex-1">
            <div className="relative max-w-xs w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
              <Input
                placeholder="Cari nama atau kode produk..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 h-10 rounded-xl bg-white"
              />
            </div>

            <Select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
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
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-10 rounded-xl max-w-xs bg-white"
            >
              <option value="ALL">Semua Status</option>
              <option value="ACTIVE">Hanya Aktif</option>
              <option value="INACTIVE">Hanya Nonaktif</option>
            </Select>
          </div>

          <span className="text-xs text-zinc-400 font-medium whitespace-nowrap self-end md:self-center">
            {filtered.length} dari {products.length} produk
          </span>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-100 text-left text-zinc-400 text-xs uppercase tracking-wider font-semibold bg-white">
                <th className="px-4 py-3.5">#</th>
                <th className="px-4 py-3.5">Produk</th>
                <th className="px-4 py-3.5">Kategori</th>
                <th className="px-4 py-3.5">Konversi & Estimasi Harga Jual</th>
                <th className="px-4 py-3.5 text-center">Stok Gudang</th>
                <th className="px-4 py-3.5 text-center">Status</th>
                <th className="px-4 py-3.5 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-zinc-400">
                    <Package className="w-8 h-8 mx-auto mb-2 opacity-40" />
                    Tidak ada produk yang cocok dengan pencarian
                  </td>
                </tr>
              ) : (
                filtered.map((p, i) => (
                  <tr
                    key={p.id}
                    className={`hover:bg-zinc-50/70 transition-colors ${
                      !p.isActive ? "bg-zinc-50/40 opacity-75" : ""
                    }`}
                  >
                    <td className="px-4 py-3 text-zinc-400 text-xs">{i + 1}</td>

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
                        <span className="text-sm font-semibold text-zinc-900">
                          {formatRupiah(p.sellPrice)}
                        </span>
                        <span className="text-[10px] text-zinc-400 uppercase font-bold">
                          Base
                        </span>
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
                            : p.totalStock < 10
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
                    <td className="px-4 py-3 text-right space-x-1">
                      <button
                        onClick={() => {
                          setEditing(p);
                          setError("");
                          setModalOpen(true);
                        }}
                        className="p-1.5 rounded-lg hover:bg-zinc-100 text-zinc-500 hover:text-[#87482D] transition-colors"
                        title="Edit Produk"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleOpenDelete(p)}
                        className="p-1.5 rounded-lg hover:bg-zinc-100 text-zinc-500 hover:text-red-600 transition-colors"
                        title="Hapus Produk"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
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
