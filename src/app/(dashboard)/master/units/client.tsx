"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, Pencil, Trash2, Search, Ruler } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog } from "@/components/ui/dialog";
import { createUnit, updateUnit, deleteUnit } from "@/server/actions/unit.action";

interface Unit { id: number; code: string; name: string }

export function UnitsClient({ units }: { units: Unit[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Unit | null>(null);
  const [error, setError] = useState("");

  const filtered = units.filter(
    (u) =>
      u.code.toLowerCase().includes(search.toLowerCase()) ||
      u.name.toLowerCase().includes(search.toLowerCase())
  );

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      const result = editing
        ? await updateUnit(editing.id, formData)
        : await createUnit(formData);
      if (result.error) setError(result.error);
      else { setModalOpen(false); router.refresh(); }
    });
  }

  function handleDelete(id: number, code: string) {
    if (!confirm(`Hapus satuan "${code}"?`)) return;
    startTransition(async () => {
      const result = await deleteUnit(id);
      if (result.error) alert(result.error);
      else router.refresh();
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Master Satuan</h1>
          <p className="text-zinc-500 mt-1">Kelola satuan produk (PCS, SAK, KG, dll)</p>
        </div>
        <Button onClick={() => { setEditing(null); setError(""); setModalOpen(true); }}>
          <Plus className="w-4 h-4" /> Tambah Satuan
        </Button>
      </div>

      <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden">
        <div className="p-4 border-b border-zinc-100">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <Input placeholder="Cari satuan..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
          </div>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-100 text-left text-zinc-500">
              <th className="px-4 py-3 font-medium">#</th>
              <th className="px-4 py-3 font-medium">Kode</th>
              <th className="px-4 py-3 font-medium">Nama Satuan</th>
              <th className="px-4 py-3 font-medium text-right">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={4} className="px-4 py-10 text-center text-zinc-400">
                <Ruler className="w-8 h-8 mx-auto mb-2 opacity-50" />Tidak ada data satuan
              </td></tr>
            ) : filtered.map((u, i) => (
              <tr key={u.id} className="border-b border-zinc-50 hover:bg-zinc-50 transition-colors">
                <td className="px-4 py-3 text-zinc-400">{i + 1}</td>
                <td className="px-4 py-3">
                  <span className="inline-flex items-center rounded-md bg-zinc-100 px-2 py-0.5 text-xs font-mono font-medium text-zinc-700">{u.code}</span>
                </td>
                <td className="px-4 py-3 font-medium text-zinc-900">{u.name}</td>
                <td className="px-4 py-3 text-right space-x-1">
                  <button onClick={() => { setEditing(u); setError(""); setModalOpen(true); }} className="p-1.5 rounded-lg hover:bg-zinc-100 text-zinc-500 hover:text-[#87482D] transition-colors"><Pencil className="w-4 h-4" /></button>
                  <button onClick={() => handleDelete(u.id, u.code)} className="p-1.5 rounded-lg hover:bg-zinc-100 text-zinc-500 hover:text-red-600 transition-colors"><Trash2 className="w-4 h-4" /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Dialog open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? "Edit Satuan" : "Tambah Satuan"}>
        <form action={handleSubmit} className="space-y-4">
          {error && <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-600 text-sm">{error}</div>}
          <div className="space-y-2">
            <Label htmlFor="code">Kode Satuan</Label>
            <Input id="code" name="code" placeholder="PCS" defaultValue={editing?.code ?? ""} required className="uppercase" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="name">Nama Satuan</Label>
            <Input id="name" name="name" placeholder="Pieces" defaultValue={editing?.name ?? ""} required />
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

