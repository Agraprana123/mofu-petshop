"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  PackagePlus,
  Plus,
  Search,
  Calendar,
  Layers,
  FileText,
  AlertCircle,
  ArrowDownLeft,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Dialog } from "@/components/ui/dialog";
import { createStockAdjustmentAction } from "@/server/actions/stock.action";

interface MovementRecord {
  id: number;
  type: "PURCHASE" | "RETURN_IN" | "ADJUSTMENT";
  qtyBase: string;
  refType: string | null;
  refId: number | null;
  createdAt: string;
  product: {
    id: number;
    name: string;
    code: string;
    baseUnit: { code: string };
  };
  batch: {
    id: number;
    costPerBase: string;
    qtyRemaining: string;
  } | null;
}

interface ProductOption {
  id: number;
  name: string;
  code: string;
  baseUnit: { code: string };
}

export function StockInClient({
  movements,
  products,
}: {
  movements: MovementRecord[];
  products: ProductOption[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [error, setError] = useState("");

  // State adjustment
  const [productId, setProductId] = useState<number>(products[0]?.id ?? 0);
  const [qty, setQty] = useState<number>(1);
  const [costPerBase, setCostPerBase] = useState<number>(0);
  const [notes, setNotes] = useState("");

  const filtered = movements.filter(
    (m) =>
      m.product.name.toLowerCase().includes(search.toLowerCase()) ||
      m.product.code.toLowerCase().includes(search.toLowerCase()) ||
      (m.refType && m.refType.toLowerCase().includes(search.toLowerCase()))
  );

  function openModal() {
    setError("");
    setProductId(products[0]?.id ?? 0);
    setQty(1);
    setCostPerBase(0);
    setNotes("");
    setModalOpen(true);
  }

  function handleSubmitAdjustment() {
    if (!productId || qty <= 0) {
      setError("Pilih produk dan masukkan jumlah qty > 0.");
      return;
    }

    startTransition(async () => {
      const res = await createStockAdjustmentAction({
        productId,
        qty,
        type: "IN",
        costPerBase,
        notes: notes.trim(),
      });

      if (res.error) {
        setError(res.error);
      } else {
        setModalOpen(false);
        router.refresh();
      }
    });
  }

  const typeBadge: Record<string, { label: string; className: string }> = {
    PURCHASE: {
      label: "Faktur Pembelian",
      className: "bg-[#87482D]/10 text-[#87482D] border border-[#87482D]/20",
    },
    RETURN_IN: {
      label: "Retur Penjualan (Customer)",
      className: "bg-blue-50 text-blue-700 border border-blue-200",
    },
    ADJUSTMENT: {
      label: "Penyesuaian / Opname",
      className: "bg-emerald-50 text-emerald-700 border border-emerald-200",
    },
  };

  const selectedProd = products.find((p) => p.id === productId);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 tracking-tight">
            Stock Masuk
          </h1>
          <p className="text-zinc-500 mt-1 text-sm">
            Riwayat penerimaan barang dari pembelian, retur pelanggan, atau penyesuaian stok opname
          </p>
        </div>
        <Button
          onClick={openModal}
          className="bg-[#87482D] hover:bg-[#6d3a24] text-white shadow-sm shadow-[#87482D]/20"
        >
          <Plus className="w-4 h-4" />
          Koreksi Stok Masuk Manual
        </Button>
      </div>

      {/* Main Table Card */}
      <div className="bg-white rounded-2xl border border-zinc-200/80 shadow-xs overflow-hidden">
        {/* Search header */}
        <div className="p-4 border-b border-zinc-100 flex items-center justify-between gap-4">
          <div className="relative max-w-sm w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <Input
              placeholder="Cari produk atau referensi..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-10 rounded-xl"
            />
          </div>
          <span className="text-xs text-zinc-400 font-medium whitespace-nowrap">
            {filtered.length} riwayat stok masuk
          </span>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-100 text-left text-zinc-400 text-xs uppercase tracking-wider font-semibold">
                <th className="px-5 py-3.5">#</th>
                <th className="px-5 py-3.5">Tanggal</th>
                <th className="px-5 py-3.5">Produk</th>
                <th className="px-5 py-3.5 text-center">Tipe Masuk</th>
                <th className="px-5 py-3.5 text-center">Batch Terbuat</th>
                <th className="px-5 py-3.5">Referensi</th>
                <th className="px-5 py-3.5 text-right">Qty Masuk</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-zinc-400">
                    <PackagePlus className="w-8 h-8 mx-auto mb-2 opacity-40" />
                    Belum ada riwayat stok masuk
                  </td>
                </tr>
              ) : (
                filtered.map((m, i) => (
                  <tr key={m.id} className="hover:bg-zinc-50/70 transition-colors">
                    <td className="px-5 py-3.5 text-zinc-400 text-xs">{i + 1}</td>
                    <td className="px-5 py-3.5 text-zinc-500 text-xs whitespace-nowrap">
                      {new Date(m.createdAt).toLocaleDateString("id-ID", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                    <td className="px-5 py-3.5">
                      <p className="font-semibold text-zinc-900">{m.product.name}</p>
                      <p className="text-[11px] text-zinc-400">{m.product.code}</p>
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                          typeBadge[m.type]?.className ?? ""
                        }`}
                      >
                        {typeBadge[m.type]?.label ?? m.type}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      {m.batch ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-[#87482D]/10 text-[#87482D] font-mono text-xs font-bold">
                          Batch #{m.batch.id}
                        </span>
                      ) : (
                        <span className="text-zinc-400 text-xs">-</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-zinc-600 text-xs">
                      {m.refType || "-"}
                    </td>
                    <td className="px-5 py-3.5 text-right font-bold text-emerald-600">
                      +{Number(m.qtyBase)} {m.product.baseUnit.code}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Penyesuaian Stok Masuk Manual */}
      <Dialog
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Penyesuaian Stok Masuk Manual (Opname)"
      >
        <div className="space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="adjProduct">Pilih Produk</Label>
            <Select
              id="adjProduct"
              value={productId.toString()}
              onChange={(e) => setProductId(Number(e.target.value))}
            >
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.code}) — Satuan Dasar: {p.baseUnit.code}
                </option>
              ))}
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="adjQty">
                Jumlah Masuk ({selectedProd?.baseUnit.code ?? "Unit"})
              </Label>
              <Input
                id="adjQty"
                type="number"
                min="1"
                step="1"
                value={qty || ""}
                onChange={(e) => setQty(Number(e.target.value))}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="adjCost">Estimasi Harga Modal (@ Base Unit)</Label>
              <Input
                id="adjCost"
                type="number"
                min="0"
                step="100"
                placeholder="Rp 0"
                value={costPerBase || ""}
                onChange={(e) => setCostPerBase(Number(e.target.value))}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="adjNotes">Keterangan / Catatan Alasan</Label>
            <Input
              id="adjNotes"
              placeholder="Contoh: Koreksi hasil stock opname bulan ini"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
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
              type="button"
              onClick={handleSubmitAdjustment}
              disabled={isPending}
              className="bg-[#87482D] hover:bg-[#6d3a24] text-white"
            >
              {isPending ? "Menyimpan..." : "Simpan Stok Masuk"}
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}

