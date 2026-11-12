"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, Pencil, Trash2, Search, Tags, AlertTriangle, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Dialog } from "@/components/ui/dialog";
import {
  createCategory,
  updateCategory,
  deleteCategory,
} from "@/server/actions/category.action";

interface Category {
  id: number;
  name: string;
  defaultMarginPercent: string;
  _count: { products: number };
}

export function CategoriesClient({ categories }: { categories: Category[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [error, setError] = useState("");

  // Reassign & Delete state
  const [deleteCat, setDeleteCat] = useState<Category | null>(null);
  const [moveToCatId, setMoveToCatId] = useState<string>("");
  const [deleteError, setDeleteError] = useState("");

  const filtered = categories.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  function openAdd() {
    setEditing(null);
    setError("");
    setModalOpen(true);
  }

  function openEdit(cat: Category) {
    setEditing(cat);
    setError("");
    setModalOpen(true);
  }

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      const result = editing
        ? await updateCategory(editing.id, formData)
        : await createCategory(formData);
      if (result.error) {
        setError(result.error);
      } else {
        setModalOpen(false);
        router.refresh();
      }
    });
  }

  function handleOpenDelete(cat: Category) {
    setDeleteCat(cat);
    setDeleteError("");
    // Default moveToCatId to the first other category
    const other = categories.find((c) => c.id !== cat.id);
    setMoveToCatId(other ? other.id.toString() : "");
  }

  function handleConfirmDelete() {
    if (!deleteCat) return;

    startTransition(async () => {
      const targetId = deleteCat._count.products > 0 ? parseInt(moveToCatId) : undefined;
      const res = await deleteCategory(deleteCat.id, targetId);
      if (res.error && res.error !== "HAS_PRODUCTS") {
        setDeleteError(res.message || res.error || "Gagal menghapus kategori");
      } else if (res.error === "HAS_PRODUCTS") {
        setDeleteError(res.message || "Kategori masih memiliki produk");
      } else {
        setDeleteCat(null);
        router.refresh();
      }
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Master Kategori</h1>
          <p className="text-zinc-500 mt-1">
            Kelola kategori produk dan margin keuntungan default
          </p>
        </div>
        <Button
          onClick={openAdd}
          className="bg-[#87482D] hover:bg-[#6d3a24] text-white shadow-sm shadow-[#87482D]/20 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4 mr-1.5" />
          Tambah Kategori
        </Button>
      </div>

      <div className="bg-white rounded-2xl border border-zinc-200/80 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-zinc-100 flex items-center justify-between">
          <div className="relative max-w-sm w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <Input
              placeholder="Cari kategori..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-10 rounded-xl"
            />
          </div>
          <span className="text-xs text-zinc-400 font-medium">
            {filtered.length} kategori terdaftar
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-100 text-left text-zinc-400 text-xs uppercase tracking-wider font-semibold bg-white">
                <th className="px-5 py-3.5">#</th>
                <th className="px-5 py-3.5">Nama Kategori</th>
                <th className="px-5 py-3.5 text-center">Margin Default</th>
                <th className="px-5 py-3.5 text-center">Jumlah Produk</th>
                <th className="px-5 py-3.5 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-10 text-center text-zinc-400">
                    <Tags className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    Tidak ada data kategori
                  </td>
                </tr>
              ) : (
                filtered.map((cat, i) => (
                  <tr
                    key={cat.id}
                    className="hover:bg-zinc-50/70 transition-colors"
                  >
                    <td className="px-5 py-3.5 text-zinc-400 text-xs">{i + 1}</td>
                    <td className="px-5 py-3.5 font-semibold text-zinc-900">
                      {cat.name}
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      <span className="inline-flex items-center rounded-full bg-[#87482D]/10 px-2.5 py-0.5 text-xs font-semibold text-[#87482D]">
                        {Number(cat.defaultMarginPercent)}%
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-center text-zinc-600 font-medium text-xs">
                      <span className="px-2 py-0.5 bg-zinc-100 rounded-md">
                        {cat._count.products} Produk
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-right space-x-1">
                      <button
                        onClick={() => openEdit(cat)}
                        className="p-1.5 rounded-lg hover:bg-zinc-100 text-zinc-500 hover:text-[#87482D] transition-colors"
                        title="Edit Kategori"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleOpenDelete(cat)}
                        className="p-1.5 rounded-lg hover:bg-zinc-100 text-zinc-500 hover:text-red-600 transition-colors"
                        title="Hapus Kategori"
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
        title={editing ? "Edit Kategori" : "Tambah Kategori"}
      >
        <form action={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-600 text-sm">
              {error}
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="name">Nama Kategori</Label>
            <Input
              id="name"
              name="name"
              defaultValue={editing?.name ?? ""}
              placeholder="Contoh: OBAT & KOSMETIK"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="defaultMarginPercent">Margin Keuntungan Default (%)</Label>
            <Input
              id="defaultMarginPercent"
              name="defaultMarginPercent"
              type="number"
              step="0.01"
              min="0"
              defaultValue={editing ? Number(editing.defaultMarginPercent) : 10}
              required
            />
            <p className="text-xs text-zinc-400">
              Margin ini otomatis digunakan produk dalam kategori ini saat menghitung harga jual FIFO.
            </p>
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

      {/* Modal Hapus Kategori & Reassign Produk */}
      <Dialog
        open={!!deleteCat}
        onClose={() => setDeleteCat(null)}
        title="Hapus Kategori"
      >
        <div className="space-y-4">
          {deleteError && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm">
              {deleteError}
            </div>
          )}

          {deleteCat && deleteCat._count.products > 0 ? (
            <div className="space-y-3">
              <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-sm">
                <div className="flex items-center gap-2 font-semibold text-amber-800 mb-1">
                  <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
                  Kategori Masih Memuat {deleteCat._count.products} Produk
                </div>
                <p className="text-xs leading-relaxed text-amber-800">
                  Kategori <strong>&quot;{deleteCat.name}&quot;</strong> saat ini masih digunakan oleh{" "}
                  <strong>{deleteCat._count.products} produk</strong>. Agar data produk tidak rusak, pilih kategori tujuan untuk memindahkan produk-produk tersebut sebelum kategori ini dihapus.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="moveToCat">
                  Pindahkan Semua Produk ke Kategori:
                </Label>
                <Select
                  id="moveToCat"
                  value={moveToCatId}
                  onChange={(e) => setMoveToCatId(e.target.value)}
                >
                  {categories
                    .filter((c) => c.id !== deleteCat.id)
                    .map((c) => (
                      <option key={c.id} value={c.id.toString()}>
                        {c.name}
                      </option>
                    ))}
                </Select>
              </div>
            </div>
          ) : (
            <div className="text-sm text-zinc-600">
              Apakah Anda yakin ingin menghapus kategori{" "}
              <strong>&quot;{deleteCat?.name}&quot;</strong>? Kategori ini tidak memiliki produk terdaftar.
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setDeleteCat(null)}
            >
              Batal
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleConfirmDelete}
              disabled={isPending || (deleteCat?._count.products ?? 0) > 0 && !moveToCatId}
            >
              {isPending
                ? "Memproses..."
                : deleteCat && deleteCat._count.products > 0
                ? "Pindahkan Produk & Hapus"
                : "Hapus Kategori"}
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}
