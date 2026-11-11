"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, Pencil, Trash2, Search, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Dialog } from "@/components/ui/dialog";
import { createCustomer, updateCustomer, deleteCustomer } from "@/server/actions/customer.action";

interface Region { id: number; name: string }
interface Customer {
  id: number;
  name: string;
  phone: string | null;
  address: string | null;
  regionId: number | null;
  region: Region | null;
  _count: { sales: number };
}

export function CustomersClient({ customers, regions }: { customers: Customer[]; regions: Region[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Customer | null>(null);
  const [error, setError] = useState("");

  const filtered = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      (c.phone?.includes(search) ?? false)
  );

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      const result = editing
        ? await updateCustomer(editing.id, formData)
        : await createCustomer(formData);
      if (result.error) setError(result.error);
      else { setModalOpen(false); router.refresh(); }
    });
  }

  function handleDelete(id: number, name: string) {
    if (!confirm(`Hapus customer "${name}"?`)) return;
    startTransition(async () => {
      const result = await deleteCustomer(id);
      if (result.error) alert(result.error);
      else router.refresh();
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Master Customer</h1>
          <p className="text-zinc-500 mt-1">Kelola data pelanggan</p>
        </div>
        <Button onClick={() => { setEditing(null); setError(""); setModalOpen(true); }}>
          <Plus className="w-4 h-4" /> Tambah Customer
        </Button>
      </div>

      <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden">
        <div className="p-4 border-b border-zinc-100">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <Input placeholder="Cari customer..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
          </div>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-100 text-left text-zinc-500">
              <th className="px-4 py-3 font-medium">#</th>
              <th className="px-4 py-3 font-medium">Nama</th>
              <th className="px-4 py-3 font-medium">Telepon</th>
              <th className="px-4 py-3 font-medium">Wilayah</th>
              <th className="px-4 py-3 font-medium">Alamat</th>
              <th className="px-4 py-3 font-medium text-center">Transaksi</th>
              <th className="px-4 py-3 font-medium text-right">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={7} className="px-4 py-10 text-center text-zinc-400">
                <Users className="w-8 h-8 mx-auto mb-2 opacity-50" /> Tidak ada data customer
              </td></tr>
            ) : filtered.map((c, i) => (
              <tr key={c.id} className="border-b border-zinc-50 hover:bg-zinc-50 transition-colors">
                <td className="px-4 py-3 text-zinc-400">{i + 1}</td>
                <td className="px-4 py-3 font-medium text-zinc-900">{c.name}</td>
                <td className="px-4 py-3 text-zinc-600">{c.phone ?? "-"}</td>
                <td className="px-4 py-3 text-zinc-600">{c.region?.name ?? "-"}</td>
                <td className="px-4 py-3 text-zinc-600 max-w-[180px] truncate">{c.address ?? "-"}</td>
                <td className="px-4 py-3 text-center text-zinc-600">{c._count.sales}</td>
                <td className="px-4 py-3 text-right space-x-1">
                  <button onClick={() => { setEditing(c); setError(""); setModalOpen(true); }} className="p-1.5 rounded-lg hover:bg-zinc-100 text-zinc-500 hover:text-[#87482D] transition-colors"><Pencil className="w-4 h-4" /></button>
                  <button onClick={() => handleDelete(c.id, c.name)} className="p-1.5 rounded-lg hover:bg-zinc-100 text-zinc-500 hover:text-red-600 transition-colors"><Trash2 className="w-4 h-4" /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Dialog open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? "Edit Customer" : "Tambah Customer"}>
        <form action={handleSubmit} className="space-y-4">
          {error && <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-600 text-sm">{error}</div>}
          <div className="space-y-2">
            <Label htmlFor="name">Nama Customer</Label>
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
          <div className="space-y-2">
            <Label htmlFor="address">Alamat</Label>
            <textarea id="address" name="address" defaultValue={editing?.address ?? ""} rows={3}
              className="flex w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-[#87482D]/50 focus:border-[#87482D]" />
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

