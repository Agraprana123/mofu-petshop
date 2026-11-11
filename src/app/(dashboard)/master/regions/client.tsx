"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, Pencil, Trash2, Search, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog } from "@/components/ui/dialog";
import { createRegion, updateRegion, deleteRegion } from "@/server/actions/region.action";

interface Region { id: number; name: string; _count: { salesmen: number; customers: number } }

export function RegionsClient({ regions }: { regions: Region[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Region | null>(null);
  const [error, setError] = useState("");

  const filtered = regions.filter((r) => r.name.toLowerCase().includes(search.toLowerCase()));

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      const result = editing ? await updateRegion(editing.id, formData) : await createRegion(formData);
      if (result.error) setError(result.error);
      else { setModalOpen(false); router.refresh(); }
    });
  }

  function handleDelete(id: number, name: string) {
    if (!confirm(`Hapus wilayah "${name}"?`)) return;
    startTransition(async () => {
      const result = await deleteRegion(id);
      if (result.error) alert(result.error);
      else router.refresh();
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Master Wilayah</h1>
          <p className="text-zinc-500 mt-1">Kelola wilayah untuk salesman dan customer</p>
        </div>
        <Button onClick={() => { setEditing(null); setError(""); setModalOpen(true); }}>
          <Plus className="w-4 h-4" /> Tambah Wilayah
        </Button>
      </div>

      <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden">
        <div className="p-4 border-b border-zinc-100">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <Input placeholder="Cari wilayah..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
          </div>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-100 text-left text-zinc-500">
              <th className="px-4 py-3 font-medium">#</th>
              <th className="px-4 py-3 font-medium">Nama Wilayah</th>
              <th className="px-4 py-3 font-medium text-center">Salesman</th>
              <th className="px-4 py-3 font-medium text-center">Customer</th>
              <th className="px-4 py-3 font-medium text-right">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={5} className="px-4 py-10 text-center text-zinc-400">
                <MapPin className="w-8 h-8 mx-auto mb-2 opacity-50" /> Tidak ada data wilayah
              </td></tr>
            ) : filtered.map((r, i) => (
              <tr key={r.id} className="border-b border-zinc-50 hover:bg-zinc-50 transition-colors">
                <td className="px-4 py-3 text-zinc-400">{i + 1}</td>
                <td className="px-4 py-3 font-medium text-zinc-900">{r.name}</td>
                <td className="px-4 py-3 text-center text-zinc-600">{r._count.salesmen}</td>
                <td className="px-4 py-3 text-center text-zinc-600">{r._count.customers}</td>
                <td className="px-4 py-3 text-right space-x-1">
                  <button onClick={() => { setEditing(r); setError(""); setModalOpen(true); }} className="p-1.5 rounded-lg hover:bg-zinc-100 text-zinc-500 hover:text-[#87482D] transition-colors"><Pencil className="w-4 h-4" /></button>
                  <button onClick={() => handleDelete(r.id, r.name)} className="p-1.5 rounded-lg hover:bg-zinc-100 text-zinc-500 hover:text-red-600 transition-colors"><Trash2 className="w-4 h-4" /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Dialog open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? "Edit Wilayah" : "Tambah Wilayah"}>
        <form action={handleSubmit} className="space-y-4">
          {error && <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-600 text-sm">{error}</div>}
          <div className="space-y-2">
            <Label htmlFor="name">Nama Wilayah</Label>
            <Input id="name" name="name" defaultValue={editing?.name ?? ""} required />
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

