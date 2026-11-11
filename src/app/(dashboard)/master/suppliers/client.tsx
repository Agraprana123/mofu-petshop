"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, Pencil, Trash2, Search, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog } from "@/components/ui/dialog";
import { createSupplier, updateSupplier, deleteSupplier } from "@/server/actions/supplier.action";

interface Supplier {
  id: number;
  name: string;
  phone: string | null;
  address: string | null;
  _count: { purchases: number };
}

export function SuppliersClient({ suppliers }: { suppliers: Supplier[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Supplier | null>(null);
  const [error, setError] = useState("");

  const filtered = suppliers.filter(
    (s) =>
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      (s.phone?.includes(search) ?? false)
  );

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      const result = editing
        ? await updateSupplier(editing.id, formData)
        : await createSupplier(formData);
      if (result.error) setError(result.error);
      else { setModalOpen(false); router.refresh(); }
    });
  }

  function handleDelete(id: number, name: string) {
    if (!confirm(`Hapus supplier "${name}"?`)) return;
    startTransition(async () => {
      const result = await deleteSupplier(id);
      if (result.error) alert(result.error);
      else router.refresh();
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Master Supplier</h1>
          <p className="text-zinc-500 mt-1">Kelola data supplier / pemasok barang</p>
        </div>
        <Button onClick={() => { setEditing(null); setError(""); setModalOpen(true); }}>
          <Plus className="w-4 h-4" /> Tambah Supplier
        </Button>
      </div>

      <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden">
        <div className="p-4 border-b border-zinc-100">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <Input placeholder="Cari supplier..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
          </div>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-100 text-left text-zinc-500">
              <th className="px-4 py-3 font-medium">#</th>
              <th className="px-4 py-3 font-medium">Nama Supplier</th>
              <th className="px-4 py-3 font-medium">Telepon</th>
              <th className="px-4 py-3 font-medium">Alamat</th>
              <th className="px-4 py-3 font-medium text-center">Transaksi</th>
              <th className="px-4 py-3 font-medium text-right">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={6} className="px-4 py-10 text-center text-zinc-400">
                <Truck className="w-8 h-8 mx-auto mb-2 opacity-50" /> Tidak ada data supplier
              </td></tr>
            ) : filtered.map((s, i) => (
              <tr key={s.id} className="border-b border-zinc-50 hover:bg-zinc-50 transition-colors">
                <td className="px-4 py-3 text-zinc-400">{i + 1}</td>
                <td className="px-4 py-3 font-medium text-zinc-900">{s.name}</td>
                <td className="px-4 py-3 text-zinc-600">{s.phone ?? "-"}</td>
                <td className="px-4 py-3 text-zinc-600 max-w-[200px] truncate">{s.address ?? "-"}</td>
                <td className="px-4 py-3 text-center text-zinc-600">{s._count.purchases}</td>
                <td className="px-4 py-3 text-right space-x-1">
                  <button onClick={() => { setEditing(s); setError(""); setModalOpen(true); }} className="p-1.5 rounded-lg hover:bg-zinc-100 text-zinc-500 hover:text-[#87482D] transition-colors"><Pencil className="w-4 h-4" /></button>
                  <button onClick={() => handleDelete(s.id, s.name)} className="p-1.5 rounded-lg hover:bg-zinc-100 text-zinc-500 hover:text-red-600 transition-colors"><Trash2 className="w-4 h-4" /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Dialog open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? "Edit Supplier" : "Tambah Supplier"}>
        <form action={handleSubmit} className="space-y-4">
          {error && <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-600 text-sm">{error}</div>}
          <div className="space-y-2">
            <Label htmlFor="name">Nama Supplier</Label>
            <Input id="name" name="name" defaultValue={editing?.name ?? ""} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Telepon</Label>
            <Input id="phone" name="phone" defaultValue={editing?.phone ?? ""} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="address">Alamat</Label>
            <textarea
              id="address"
              name="address"
              defaultValue={editing?.address ?? ""}
              rows={3}
              className="flex w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-[#87482D]/50 focus:border-[#87482D]"
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>Batal</Button>
            <Button type="submit" disabled={isPending}>{isPending ? "Menyimpan..." : "Simpan"}</Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
}

