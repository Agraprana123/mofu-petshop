"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, Pencil, Trash2, Search, Package } from "lucide-react";
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
} from "@/server/actions/product.action";

interface Category { id: number; name: string; defaultMarginPercent: string }
interface UnitOption { id: number; code: string; name: string }
interface ProductUnit { id: number; unitId: number; conversionToBase: string; unit: { id: number; code: string; name: string } }

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
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [error, setError] = useState("");

  const filtered = products.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.code.toLowerCase().includes(search.toLowerCase())
  );

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      const result = editing
        ? await updateProduct(editing.id, formData)
        : await createProduct(formData);
      if (result.error) setError(result.error);
      else { setModalOpen(false); router.refresh(); }
    });
  }

  function handleDelete(id: number, name: string) {
    if (!confirm(`Hapus produk "${name}"?`)) return;
    startTransition(async () => {
      const result = await deleteProduct(id);
      if (result.error) alert(result.error);
      else router.refresh();
    });
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">
            Master Produk & Kustomisasi Satuan
          </h1>
          <p className="text-zinc-500 mt-1">
            Kelola barang berkarung (Sak) yang dipecah menjadi kemasan Pack / Gram
          </p>
        </div>
        <Button onClick={() => { setEditing(null); setError(""); setModalOpen(true); }}>
          <Plus className="w-4 h-4" /> Tambah Produk Baru
        </Button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden">
        <div className="p-4 border-b border-zinc-100 flex items-center justify-between">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <Input
              placeholder="Cari nama atau kode produk..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <span className="text-sm text-zinc-400">
            {filtered.length} produk terdaftar
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-100 text-left text-zinc-500">
                <th className="px-4 py-3 font-medium">#</th>
                <th className="px-4 py-3 font-medium">Produk</th>
                <th className="px-4 py-3 font-medium">Kategori</th>
                <th className="px-4 py-3 font-medium">Konversi Kemasan & Harga Jual</th>
                <th className="px-4 py-3 font-medium text-center">Total Stok Gudang</th>
                <th className="px-4 py-3 font-medium text-center">Status</th>
                <th className="px-4 py-3 font-medium text-right">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-zinc-400">
                    <Package className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    Tidak ada data produk
                  </td>
                </tr>
              ) : (
                filtered.map((p, i) => (
                  <tr key={p.id} className="border-b border-zinc-50 hover:bg-zinc-50 transition-colors">
                    <td className="px-4 py-3 text-zinc-400">{i + 1}</td>

                    {/* Produk: Name + Code */}
                    <td className="px-4 py-3">
                      <div className="font-medium text-zinc-900">{p.name}</div>
                      <div className="text-xs text-zinc-400">{p.code}</div>
                    </td>

                    {/* Kategori */}
                    <td className="px-4 py-3 text-zinc-600">{p.category.name}</td>

                    {/* Konversi & Harga */}
                    <td className="px-4 py-3">
                      {/* Base unit price */}
                      <div className="flex items-center gap-2 text-zinc-700">
                        <span className="inline-flex items-center rounded-md bg-zinc-100 px-1.5 py-0.5 text-xs font-mono font-medium text-zinc-600">
                          {p.baseUnit.code}
                        </span>
                        <span className="text-sm">
                          {formatRupiah(p.sellPrice)}
                        </span>
                        <span className="text-xs text-zinc-400">Base</span>
                      </div>

                      {/* Conversion units */}
                      {p.units.map((pu) => {
                        const convPrice = p.sellPrice
                          ? Math.round(p.sellPrice * Number(pu.conversionToBase))
                          : null;
                        return (
                          <div
                            key={pu.id}
                            className="flex items-center gap-2 text-zinc-500 mt-1"
                          >
                            <span className="inline-flex items-center rounded-md bg-blue-50 px-1.5 py-0.5 text-xs font-mono font-medium text-blue-600">
                              {pu.unit.code}
                            </span>
                            <span className="text-xs text-zinc-400">
                              ({Number(pu.conversionToBase)} {p.baseUnit.code})
                            </span>
                            <span className="text-sm">
                              {formatRupiah(convPrice)}
                            </span>
                          </div>
                        );
                      })}
                    </td>

                    {/* Stok */}
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          p.totalStock <= 0
                            ? "bg-red-100 text-red-700"
                            : p.totalStock < 10
                            ? "bg-[#87482D]/10 text-[#87482D]"
                            : "bg-green-100 text-green-700"
                        }`}
                      >
                        {Math.floor(p.totalStock)} {p.baseUnit.code}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="px-4 py-3 text-center">
                      <Badge variant={p.isActive ? "success" : "danger"}>
                        {p.isActive ? "Aktif" : "Nonaktif"}
                      </Badge>
                    </td>

                    {/* Aksi */}
                    <td className="px-4 py-3 text-right space-x-1">
                      <button
                        onClick={() => { setEditing(p); setError(""); setModalOpen(true); }}
                        className="p-1.5 rounded-lg hover:bg-zinc-100 text-zinc-500 hover:text-[#87482D] transition-colors"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(p.id, p.name)}
                        className="p-1.5 rounded-lg hover:bg-zinc-100 text-zinc-500 hover:text-red-600 transition-colors"
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
                <option value="">-- Pilih Kategori --</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} (margin {Number(c.defaultMarginPercent)}%)
                  </option>
                ))}
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="baseUnitId">Satuan Dasar</Label>
              <Select
                id="baseUnitId"
                name="baseUnitId"
                defaultValue={editing?.baseUnitId?.toString() ?? ""}
                required
              >
                <option value="">-- Pilih Satuan --</option>
                {units.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.code} — {u.name}
                  </option>
                ))}
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="marginPercent">
                Margin Override (%)
              </Label>
              <Input
                id="marginPercent"
                name="marginPercent"
                type="number"
                step="0.01"
                min="0"
                placeholder="Kosongkan = ikut kategori"
                defaultValue={
                  editing?.marginPercent !== undefined && editing.marginPercent !== null
                    ? Number(editing.marginPercent)
                    : ""
                }
              />
              <p className="text-xs text-zinc-400">
                Kosongkan untuk mengikuti margin default kategori
              </p>
            </div>

            {editing && (
              <div className="space-y-2">
                <Label htmlFor="isActive">Status</Label>
                <Select
                  id="isActive"
                  name="isActive"
                  defaultValue={editing.isActive ? "true" : "false"}
                >
                  <option value="true">Aktif</option>
                  <option value="false">Nonaktif</option>
                </Select>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>
              Batal
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Menyimpan..." : "Simpan"}
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
}

