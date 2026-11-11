"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, Pencil, Trash2, Search, Users, ShieldCheck, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog } from "@/components/ui/dialog";
import {
  createUser,
  updateUser,
  deleteUser,
} from "@/server/actions/user.action";

interface UserItem {
  id: number;
  name: string;
  email: string;
  role: "ADMIN" | "CASHIER" | "SALESMAN";
  isActive: boolean;
  createdAt: string;
}

export function UsersClient({
  users,
  currentUserId,
}: {
  users: UserItem[];
  currentUserId: number;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<UserItem | null>(null);
  const [error, setError] = useState("");

  const filtered = users.filter(
    (u) =>
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase())
  );

  function openAdd() {
    setEditing(null);
    setError("");
    setModalOpen(true);
  }

  function openEdit(user: UserItem) {
    setEditing(user);
    setError("");
    setModalOpen(true);
  }

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      const result = editing
        ? await updateUser(editing.id, formData)
        : await createUser(formData);

      if (result.error) {
        setError(result.error);
      } else {
        setModalOpen(false);
        router.refresh();
      }
    });
  }

  function handleDelete(user: UserItem) {
    if (!confirm(`Hapus pengguna "${user.name}" (${user.email})?`)) return;

    startTransition(async () => {
      const result = await deleteUser(user.id, currentUserId);
      if (result.error) {
        alert(result.error);
      } else {
        router.refresh();
      }
    });
  }

  const roleBadge: Record<string, { label: string; className: string }> = {
    ADMIN: {
      label: "Administrator",
      className: "bg-[#87482D]/10 text-[#87482D] border border-[#87482D]/20",
    },
    CASHIER: {
      label: "Kasir / Staff",
      className: "bg-emerald-50 text-emerald-700 border border-emerald-200",
    },
    SALESMAN: {
      label: "Salesman",
      className: "bg-blue-50 text-blue-700 border border-blue-200",
    },
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 tracking-tight">
            Manajemen User
          </h1>
          <p className="text-zinc-500 mt-1 text-sm">
            Kelola data akun kasir, staff, dan hak akses administrator
          </p>
        </div>
        <Button
          onClick={openAdd}
          className="bg-[#87482D] hover:bg-[#6d3a24] text-white shadow-sm shadow-[#87482D]/20"
        >
          <Plus className="w-4 h-4" />
          Tambah User Baru
        </Button>
      </div>

      {/* Main Table Card */}
      <div className="bg-white rounded-2xl border border-zinc-200/80 shadow-xs overflow-hidden">
        {/* Search header */}
        <div className="p-4 border-b border-zinc-100 flex items-center justify-between gap-4">
          <div className="relative max-w-sm w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <Input
              placeholder="Cari nama atau email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-10 rounded-xl"
            />
          </div>
          <span className="text-xs text-zinc-400 font-medium whitespace-nowrap">
            {filtered.length} user terdaftar
          </span>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-100 text-left text-zinc-400 text-xs uppercase tracking-wider font-semibold">
                <th className="px-5 py-3.5">#</th>
                <th className="px-5 py-3.5">Nama & Email</th>
                <th className="px-5 py-3.5 text-center">Peran (Role)</th>
                <th className="px-5 py-3.5 text-center">Status</th>
                <th className="px-5 py-3.5">Dibuat Pada</th>
                <th className="px-5 py-3.5 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-zinc-400">
                    <Users className="w-8 h-8 mx-auto mb-2 opacity-40" />
                    Tidak ada data pengguna ditemukan
                  </td>
                </tr>
              ) : (
                filtered.map((u, i) => (
                  <tr
                    key={u.id}
                    className="hover:bg-zinc-50/70 transition-colors"
                  >
                    <td className="px-5 py-3.5 text-zinc-400 text-xs">{i + 1}</td>

                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-[#87482D]/10 flex items-center justify-center text-[#87482D] font-bold text-sm shrink-0">
                          {u.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-semibold text-zinc-900 leading-tight">
                            {u.name}
                            {u.id === currentUserId && (
                              <span className="ml-2 text-[10px] bg-zinc-100 text-zinc-600 px-1.5 py-0.5 rounded-md font-normal">
                                Akun Anda
                              </span>
                            )}
                          </p>
                          <p className="text-xs text-zinc-400 mt-0.5">{u.email}</p>
                        </div>
                      </div>
                    </td>

                    <td className="px-5 py-3.5 text-center">
                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${
                          roleBadge[u.role]?.className ?? ""
                        }`}
                      >
                        {roleBadge[u.role]?.label ?? u.role}
                      </span>
                    </td>

                    <td className="px-5 py-3.5 text-center">
                      <Badge variant={u.isActive ? "success" : "danger"}>
                        {u.isActive ? "Aktif" : "Nonaktif"}
                      </Badge>
                    </td>

                    <td className="px-5 py-3.5 text-xs text-zinc-500">
                      {new Date(u.createdAt).toLocaleDateString("id-ID", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>

                    <td className="px-5 py-3.5 text-right space-x-1">
                      <button
                        onClick={() => openEdit(u)}
                        className="p-1.5 rounded-lg hover:bg-zinc-100 text-zinc-400 hover:text-[#87482D] transition-colors"
                        title="Edit User"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>

                      {u.id !== currentUserId && (
                        <button
                          onClick={() => handleDelete(u)}
                          className="p-1.5 rounded-lg hover:bg-zinc-100 text-zinc-400 hover:text-red-600 transition-colors"
                          title="Hapus User"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Dialog Tambah / Edit */}
      <Dialog
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? "Edit Pengguna" : "Tambah Pengguna Baru"}
      >
        <form action={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="name">Nama Lengkap</Label>
            <Input
              id="name"
              name="name"
              placeholder="Contoh: Rina Melati"
              defaultValue={editing?.name ?? ""}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email Login</Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="user@mofu.com"
              defaultValue={editing?.email ?? ""}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="role">Peran (Role)</Label>
              <Select
                id="role"
                name="role"
                defaultValue={editing?.role ?? "CASHIER"}
                required
              >
                <option value="CASHIER">Kasir / Staff</option>
                <option value="ADMIN">Administrator</option>
                <option value="SALESMAN">Salesman</option>
              </Select>
            </div>

            {editing && (
              <div className="space-y-2">
                <Label htmlFor="isActive">Status Akun</Label>
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

          <div className="space-y-2">
            <Label htmlFor="password">
              {editing ? "Ubah Password (Opsional)" : "Password"}
            </Label>
            <Input
              id="password"
              name="password"
              type="password"
              placeholder={
                editing
                  ? "Kosongkan jika tidak ingin mengubah password"
                  : "Minimal 6 karakter"
              }
              required={!editing}
            />
            {editing && (
              <p className="text-xs text-zinc-400">
                Biarkan kosong jika tidak ingin mengganti password akun ini.
              </p>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-zinc-100">
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
              {isPending ? "Menyimpan..." : "Simpan Data"}
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
}

