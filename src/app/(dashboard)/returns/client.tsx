"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  RotateCcw,
  Plus,
  Search,
  Calendar,
  AlertCircle,
  FileText,
  ArrowUpRight,
  ArrowDownLeft,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Dialog } from "@/components/ui/dialog";
import { createReturnAction } from "@/server/actions/stock.action";

interface ReturnMovement {
  id: number;
  type: "RETURN_IN" | "RETURN_OUT";
  qtyBase: string;
  refType: string | null;
  createdAt: string;
  product: {
    id: number;
    name: string;
    code: string;
    baseUnit: { code: string };
  };
  batch: {
    id: number;
  } | null;
}

interface ProductOption {
  id: number;
  name: string;
  code: string;
  baseUnit: { code: string };
  batches: { qtyRemaining: string }[];
}

export function ReturnsClient({
  returns,
  products,
}: {
  returns: ReturnMovement[];
  products: ProductOption[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<"ALL" | "RETURN_IN" | "RETURN_OUT">("ALL");
  const [modalOpen, setModalOpen] = useState(false);
  const [error, setError] = useState("");

  // Form State
  const [returnType, setReturnType] = useState<"RETURN_IN" | "RETURN_OUT">("RETURN_IN");
  const [productId, setProductId] = useState<number>(products[0]?.id ?? 0);
  const [qty, setQty] = useState<number>(1);
  const [invoiceNo, setInvoiceNo] = useState("");
  const [notes, setNotes] = useState("");

  const filtered = returns.filter((r) => {
    const matchSearch =
      r.product.name.toLowerCase().includes(search.toLowerCase()) ||
      r.product.code.toLowerCase().includes(search.toLowerCase()) ||
      (r.refType && r.refType.toLowerCase().includes(search.toLowerCase()));

    if (!matchSearch) return false;
    if (activeTab === "ALL") return true;
    return r.type === activeTab;
  });

  function openModal() {
    setError("");
    setReturnType("RETURN_IN");
    setProductId(products[0]?.id ?? 0);
    setQty(1);
    setInvoiceNo("");
    setNotes("");
    setModalOpen(true);
  }

  function handleSubmitReturn() {
    if (!productId || qty <= 0) {
      setError("Pilih produk dan masukkan jumlah qty > 0.");
      return;
    }

    startTransition(async () => {
      const res = await createReturnAction({
        type: returnType,
        productId,
        qty,
        invoiceNo: invoiceNo.trim() || undefined,
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

  const selectedProd = products.find((p) => p.id === productId);
  const totalStock = selectedProd
    ? selectedProd.batches.reduce((sum, b) => sum + Number(b.qtyRemaining), 0)
    : 0;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 tracking-tight">
            Transaksi Retur
          </h1>
          <p className="text-zinc-500 mt-1 text-sm">
            Kelola pengembalian barang dari pelanggan (Retur Masuk) dan pengembalian barang cacat ke supplier (Retur Keluar)
          </p>
        </div>
        <Button
          onClick={openModal}
          className="bg-[#87482D] hover:bg-[#6d3a24] text-white shadow-sm shadow-[#87482D]/20"
        >
          <RotateCcw className="w-4 h-4" />
          Proses Transaksi Retur
        </Button>
      </div>

      {/* Main Table Card */}
      <div className="bg-white rounded-2xl border border-zinc-200/80 shadow-xs overflow-hidden">
        {/* Tabs & Search */}
        <div className="p-4 border-b border-zinc-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          {/* Tabs */}
          <div className="flex items-center gap-1 bg-zinc-100/80 p-1 rounded-xl">
            <button
              onClick={() => setActiveTab("ALL")}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === "ALL"
                  ? "bg-white text-zinc-900 shadow-xs"
                  : "text-zinc-500 hover:text-zinc-900"
              }`}
            >
              Semua Retur
            </button>
            <button
              onClick={() => setActiveTab("RETURN_IN")}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === "RETURN_IN"
                  ? "bg-white text-emerald-700 shadow-xs"
                  : "text-zinc-500 hover:text-zinc-900"
              }`}
            >
              Retur Pelanggan (Masuk)
            </button>
            <button
              onClick={() => setActiveTab("RETURN_OUT")}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === "RETURN_OUT"
                  ? "bg-white text-[#87482D] shadow-xs"
                  : "text-zinc-500 hover:text-zinc-900"
              }`}
            >
              Retur ke Supplier (Keluar)
            </button>
          </div>

          <div className="relative max-w-xs w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <Input
              placeholder="Cari barang atau referensi..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-9 rounded-xl text-xs"
            />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-100 text-left text-zinc-400 text-xs uppercase tracking-wider font-semibold">
                <th className="px-5 py-3.5">#</th>
                <th className="px-5 py-3.5">Tanggal</th>
                <th className="px-5 py-3.5">Produk</th>
                <th className="px-5 py-3.5 text-center">Jenis Retur</th>
                <th className="px-5 py-3.5">Referensi / Catatan</th>
                <th className="px-5 py-3.5 text-right">Perubahan Stok</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-zinc-400">
                    <RotateCcw className="w-8 h-8 mx-auto mb-2 opacity-40" />
                    Belum ada riwayat transaksi retur
                  </td>
                </tr>
              ) : (
                filtered.map((r, i) => {
                  const isReturnIn = r.type === "RETURN_IN";
                  return (
                    <tr key={r.id} className="hover:bg-zinc-50/70 transition-colors">
                      <td className="px-5 py-3.5 text-zinc-400 text-xs">{i + 1}</td>
                      <td className="px-5 py-3.5 text-zinc-500 text-xs whitespace-nowrap">
                        {new Date(r.createdAt).toLocaleDateString("id-ID", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </td>
                      <td className="px-5 py-3.5">
                        <p className="font-semibold text-zinc-900">{r.product.name}</p>
                        <p className="text-[11px] text-zinc-400">{r.product.code}</p>
                      </td>
                      <td className="px-5 py-3.5 text-center">
                        {isReturnIn ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <ArrowDownLeft className="w-3 h-3" />
                            Retur Pelanggan (Masuk)
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#87482D]/10 text-[#87482D] border border-[#87482D]/20">
                            <ArrowUpRight className="w-3 h-3" />
                            Retur Supplier (Keluar)
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-3.5 text-zinc-600 text-xs">
                        {r.refType || "-"}
                      </td>
                      <td className="px-5 py-3.5 text-right font-bold text-xs">
                        {isReturnIn ? (
                          <span className="text-emerald-600">
                            +{Number(r.qtyBase)} {r.product.baseUnit.code}
                          </span>
                        ) : (
                          <span className="text-red-600">
                            {Number(r.qtyBase)} {r.product.baseUnit.code}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Buat Retur Baru */}
      <Dialog
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Proses Transaksi Retur Barang"
      >
        <div className="space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="retType">Jenis Retur</Label>
            <Select
              id="retType"
              value={returnType}
              onChange={(e) => setReturnType(e.target.value as "RETURN_IN" | "RETURN_OUT")}
            >
              <option value="RETURN_IN">
                Retur Penjualan (Dari Pelanggan &rarr; Menambah Stok Toko)
              </option>
              <option value="RETURN_OUT">
                Retur Pembelian (Ke Supplier &rarr; Mengurangi Stok FIFO Toko)
              </option>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="retProduct">Pilih Produk</Label>
            <Select
              id="retProduct"
              value={productId.toString()}
              onChange={(e) => setProductId(Number(e.target.value))}
            >
              {products.map((p) => {
                const stock = p.batches.reduce(
                  (s, b) => s + Number(b.qtyRemaining),
                  0
                );
                return (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.code}) — Stok: {stock} {p.baseUnit.code}
                  </option>
                );
              })}
            </Select>
            {returnType === "RETURN_OUT" && (
              <p className="text-xs text-zinc-400">
                Stok saat ini di gudang: <strong>{totalStock} {selectedProd?.baseUnit.code}</strong>
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="retQty">
                Jumlah Retur ({selectedProd?.baseUnit.code ?? "Unit"})
              </Label>
              <Input
                id="retQty"
                type="number"
                min="1"
                max={returnType === "RETURN_OUT" ? totalStock : undefined}
                step="1"
                value={qty || ""}
                onChange={(e) => setQty(Number(e.target.value))}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="retRef">No. Referensi Faktur</Label>
              <Input
                id="retRef"
                placeholder="Contoh: SAL-202611-0001"
                value={invoiceNo}
                onChange={(e) => setInvoiceNo(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="retNotes">Alasan Retur</Label>
            <Input
              id="retNotes"
              placeholder="Contoh: Barang salah varian / kemasan bocor / rusak"
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
              onClick={handleSubmitReturn}
              disabled={isPending || (returnType === "RETURN_OUT" && totalStock <= 0)}
              className="bg-[#87482D] hover:bg-[#6d3a24] text-white"
            >
              {isPending ? "Memproses Retur..." : "Simpan Retur"}
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}

