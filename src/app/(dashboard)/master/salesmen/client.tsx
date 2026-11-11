"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, Pencil, Trash2, Search, UserCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog } from "@/components/ui/dialog";
import { createSalesman, updateSalesman, deleteSalesman } from "@/server/actions/salesman.action";

interface Region { id: number; name: string }
interface Salesman {
  id: number;
  name: string;
  phone: string | null;
  isActive: boolean;
  regionId: number | null;
  region: Region | null;
  _count: { sales: number };
}

export function SalesmenClient({ salesmen, regions }: { salesmen: Salesman[]; regions: Region[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Salesman | null>(null);
  const [error, setError] = useState("");

  const filtered = salesmen.filter(
    (s) =>
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      (s.phone?.includes(search) ?? false)
  );

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      const result = editing
        ? await updateSalesman(editing.id, formData)
        : await createSalesman(formData);
      if (result.error) setError(result.error);
      else { setModalOpen(false); router.refresh(); }
    });
  }

  function handleDelete(id: number, name: string) {
    if (!confirm(`Hapus salesman "${name}"?`)) return;
    startTransition(async () => {
      const result = await deleteSalesman(id);
      if (result.error) alert(result.error);
      else router.refresh();
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Master Salesman</h1>
          <p className="text-zinc-500 mt-1">Kelola data salesman / tenaga penjual</p>
        </div>
        <Button onClick={() => { setEditing(null); setError(""); setModalOpen(true); }}>
          <Plus className="w-4 h-4" /> Tambah Salesman
        </Button>
      </div>

      <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden">
        <div className="p-4 border-b border-zinc-100">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <Input placeholder="Cari salesman..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
          </div>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-100 text-left text-zinc-500">
              <th className="px-4 py-3 font-medium">#</th>
              <th className="px-4 py-3 font-medium">Nama</th>
              <th className="px-4 py-3 font-medium">Telepon</th>
              <th className="px-4 py-3 font-medium">Wilayah</th>
              <th className="px-4 py-3 font-medium text-center">Status</th>
              <th className="px-4 py-3 font-medium text-center">Transaksi</th>
              <th className="px-4 py-3 font-medium text-right">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={7} className="px-4 py-10 text-center text-zinc-400">
                <UserCheck className="w-8 h-8 mx-auto mb-2 opacity-50" /> Tidak ada data salesman
              </td></tr>
            ) : filtered.map((s, i) => (
              <tr key={s.id} className="border-b border-zinc-50 hover:bg-zinc-50 transition-colors">
                <td className="px-4 py-3 text-zinc-400">{i + 1}</td>
                <td className="px-4 py-3 font-medium text-zinc-900">{s.name}</td>
                <td className="px-4 py-3 text-zinc-600">{s.phone ?? "-"}</td>
                <td className="px-4 py-3 text-zinc-600">{s.region?.name ?? "-"}</td>
                <td className="px-4 py-3 text-center">
                  <Badge variant={s.isActive ? "success" : "danger"}>
                    {s.isActive ? "Aktif" : "Nonaktif"}
                  </Badge>
                </td>
                <td className="px-4 py-3 text-center text-zinc-600">{s._count.sales}</td>
                <td className="px-4 py-3 text-right space-x-1">
                  <button onClick={() => { setEditing(s); setError(""); setModalOpen(true); }} className="p-1.5 rounded-lg hover:bg-zinc-100 text-zinc-500 hover:text-[#87482D] transition-colors"><Pencil className="w-4 h-4" /></button>
                  <button onClick={() => handleDelete(s.id, s.name)} className="p-1.5 rounded-lg hover:bg-zinc-100 text-zinc-500 hover:text-red-600 transition-colors"><Trash2 className="w-4 h-4" /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Dialog open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? "Edit Salesman" : "Tambah Salesman"}>
        <form action={handleSubmit} className="space-y-4">
          {error && <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-600 text-sm">{error}</div>}
          <div className="space-y-2">
            <Label htmlFor="name">Nama Salesman</Label>
            <Input id="name" name="name" defaultValue={editing?.name ?? ""} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Telepon</Label>
            <Input id="phone" name="phone" defaultValue={editing?.phone ?? ""} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="regionId">Wilayah</Label>
            <Select id="regionId" name="regionId" defaultValue={editing?.regionId?.toString() ?? ""}>
              <option value="">-- Pilih Wilayah --</option>
              {regions.map((r) => (
                <option key={r.id} value={r.id}>{r.name}</option>
              ))}
            </Select>
          </div>
          {editing && (
            <div className="space-y-2">
              <Label htmlFor="isActive">Status</Label>
              <Select id="isActive" name="isActive" defaultValue={editing.isActive ? "true" : "false"}>
                <option value="true">Aktif</option>
                <option value="false">Nonaktif</option>
              </Select>
            </div>
          )}
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>Batal</Button>
            <Button type="submit" disabled={isPending}>{isPending ? "Menyimpan..." : "Simpan"}</Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
}

