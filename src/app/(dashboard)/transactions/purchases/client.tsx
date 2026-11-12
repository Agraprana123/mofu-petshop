"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  FileText,
  Plus,
  Search,
  Eye,
  Trash2,
  Calendar,
  Truck,
  Hash,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Dialog } from "@/components/ui/dialog";
import { createPurchaseAction } from "@/server/actions/purchase.action";

interface SupplierOption {
  id: number;
  name: string;
  phone: string | null;
}

interface ProductOption {
  id: number;
  name: string;
  code: string;
  baseUnitId: number;
  baseUnit: { id: number; code: string; name: string };
  units: {
    id: number;
    unitId: number;
    conversionToBase: string;
    unit: { id: number; code: string; name: string };
  }[];
}

interface UnitOption {
  id: number;
  code: string;
  name: string;
}

interface PurchaseItemDetail {
  id: number;
  qty: string;
  unitCost: string;
  qtyBase: string;
  costPerBase: string;
  subtotal: string;
  product: { name: string; code: string; baseUnit: { code: string } };
  unit: { code: string };
  batch: { id: number; qtyRemaining: string } | null;
}

interface PurchaseItem {
  id: number;
  invoiceNo: string;
  supplierRef: string | null;
  date: string;
  total: string;
  supplier: { name: string };
  items: PurchaseItemDetail[];
}

interface DraftItem {
  productId: number;
  unitId: number;
  qty: number;
  unitCost: number;
}

export function PurchasesClient({
  purchases,
  suppliers,
  products,
  units,
}: {
  purchases: PurchaseItem[];
  suppliers: SupplierOption[];
  products: ProductOption[];
  units: UnitOption[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [search, setSearch] = useState("");
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedPurchase, setSelectedPurchase] = useState<PurchaseItem | null>(null);
  const [error, setError] = useState("");

  // State form pembelian baru
  const [supplierId, setSupplierId] = useState<number>(suppliers[0]?.id ?? 0);
  const [supplierRef, setSupplierRef] = useState("");
  const [purchaseDate, setPurchaseDate] = useState(
    new Date().toISOString().slice(0, 10)
  );
  const [draftItems, setDraftItems] = useState<DraftItem[]>([
    {
      productId: products[0]?.id ?? 0,
      unitId: products[0]?.baseUnitId ?? 0,
      qty: 1,
      unitCost: 0,
    },
  ]);

  const filtered = purchases.filter(
    (p) =>
      p.invoiceNo.toLowerCase().includes(search.toLowerCase()) ||
      p.supplier.name.toLowerCase().includes(search.toLowerCase()) ||
      (p.supplierRef && p.supplierRef.toLowerCase().includes(search.toLowerCase()))
  );

  function openCreateModal() {
    setError("");
    setSupplierId(suppliers[0]?.id ?? 0);
    setSupplierRef("");
    setPurchaseDate(new Date().toISOString().slice(0, 10));
    setDraftItems([
      {
        productId: products[0]?.id ?? 0,
        unitId: products[0]?.baseUnitId ?? 0,
        qty: 1,
        unitCost: 0,
      },
    ]);
    setCreateModalOpen(true);
  }

  function handleProductChange(index: number, newProductId: number) {
    const prod = products.find((p) => p.id === newProductId);
    const updated = [...draftItems];
    updated[index] = {
      ...updated[index],
      productId: newProductId,
      unitId: prod?.baseUnitId ?? updated[index].unitId,
    };
    setDraftItems(updated);
  }

  function handleUnitChange(index: number, newUnitId: number) {
    const updated = [...draftItems];
    updated[index].unitId = newUnitId;
    setDraftItems(updated);
  }

  function handleQtyChange(index: number, qty: number) {
    const updated = [...draftItems];
    updated[index].qty = qty;
    setDraftItems(updated);
  }

  function handleCostChange(index: number, cost: number) {
    const updated = [...draftItems];
    updated[index].unitCost = cost;
    setDraftItems(updated);
  }

  function addRow() {
    setDraftItems([
      ...draftItems,
      {
        productId: products[0]?.id ?? 0,
        unitId: products[0]?.baseUnitId ?? 0,
        qty: 1,
        unitCost: 0,
      },
    ]);
  }

  function removeRow(index: number) {
    if (draftItems.length <= 1) return;
    setDraftItems(draftItems.filter((_, i) => i !== index));
  }

  const grandTotal = draftItems.reduce(
    (sum, item) => sum + (Number(item.qty) || 0) * (Number(item.unitCost) || 0),
    0
  );

  function handleSubmitPurchase() {
    setError("");
    if (!supplierId) {
      setError("Pilih supplier terlebih dahulu.");
      return;
    }
    if (draftItems.some((i) => !i.productId || i.qty <= 0 || i.unitCost < 0)) {
      setError("Pastikan setiap barang memiliki jumlah Qty > 0 dan Harga Beli valid.");
      return;
    }

    startTransition(async () => {
      const res = await createPurchaseAction({
        supplierId,
        supplierRef: supplierRef.trim() || undefined,
        date: new Date(purchaseDate),
        items: draftItems.map((item) => ({
          productId: Number(item.productId),
          unitId: Number(item.unitId),
          qty: Number(item.qty),
          unitCost: Number(item.unitCost),
        })),
      });

      if (res.error) {
        setError(res.error);
      } else {
        setCreateModalOpen(false);
        router.refresh();
      }
    });
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 tracking-tight">
            Faktur Pembelian
          </h1>
          <p className="text-zinc-500 mt-1 text-sm">
            Catat stok masuk dari supplier. Setiap pembelian otomatis membuat Batch FIFO baru.
          </p>
        </div>
        <Button
          onClick={openCreateModal}
          className="bg-[#87482D] hover:bg-[#6d3a24] text-white shadow-sm shadow-[#87482D]/20"
        >
          <Plus className="w-4 h-4" />
          Faktur Pembelian Baru
        </Button>
      </div>

      {/* Main Table Card */}
      <div className="bg-white rounded-2xl border border-zinc-200/80 shadow-xs overflow-hidden">
        {/* Search header */}
        <div className="p-4 border-b border-zinc-100 flex items-center justify-between gap-4">
          <div className="relative max-w-sm w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <Input
              placeholder="Cari no faktur atau supplier..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-10 rounded-xl"
            />
          </div>
          <span className="text-xs text-zinc-400 font-medium whitespace-nowrap">
            {filtered.length} transaksi pembelian
          </span>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-100 text-left text-zinc-400 text-xs uppercase tracking-wider font-semibold">
                <th className="px-5 py-3.5">#</th>
                <th className="px-5 py-3.5">No Faktur</th>
                <th className="px-5 py-3.5">Supplier</th>
                <th className="px-5 py-3.5">Tanggal</th>
                <th className="px-5 py-3.5">Ref. Supplier</th>
                <th className="px-5 py-3.5 text-center">Jumlah Item</th>
                <th className="px-5 py-3.5 text-right">Total Pembelian</th>
                <th className="px-5 py-3.5 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-5 py-12 text-center text-zinc-400">
                    <FileText className="w-8 h-8 mx-auto mb-2 opacity-40" />
                    Belum ada transaksi faktur pembelian
                  </td>
                </tr>
              ) : (
                filtered.map((p, i) => (
                  <tr key={p.id} className="hover:bg-zinc-50/70 transition-colors">
                    <td className="px-5 py-3.5 text-zinc-400 text-xs">{i + 1}</td>
                    <td className="px-5 py-3.5 font-bold text-zinc-900 font-mono text-xs">
                      {p.invoiceNo}
                    </td>
                    <td className="px-5 py-3.5 font-medium text-zinc-800">
                      {p.supplier.name}
                    </td>
                    <td className="px-5 py-3.5 text-zinc-500 text-xs">
                      {new Date(p.date).toLocaleDateString("id-ID", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>
                    <td className="px-5 py-3.5 text-zinc-500 text-xs">
                      {p.supplierRef || "-"}
                    </td>
                    <td className="px-5 py-3.5 text-center text-zinc-600 text-xs font-semibold">
                      {p.items.length} Barang
                    </td>
                    <td className="px-5 py-3.5 text-right font-bold text-zinc-900">
                      Rp {Number(p.total).toLocaleString("id-ID")}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <button
                        onClick={() => {
                          setSelectedPurchase(p);
                          setDetailModalOpen(true);
                        }}
                        className="p-1.5 rounded-lg hover:bg-zinc-100 text-zinc-400 hover:text-[#87482D] transition-colors"
                        title="Lihat Detail"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Buat Pembelian Baru */}
      <Dialog
        open={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title="Buat Faktur Pembelian Baru"
      >
        <div className="space-y-5">
          {error && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Form Header Info */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="supplierId">Pemasok / Supplier</Label>
              <Select
                id="supplierId"
                value={supplierId.toString()}
                onChange={(e) => setSupplierId(Number(e.target.value))}
              >
                {suppliers.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="purchaseDate">Tanggal Pembelian</Label>
              <Input
                id="purchaseDate"
                type="date"
                value={purchaseDate}
                onChange={(e) => setPurchaseDate(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="supplierRef">No. Referensi Supplier (Opsional)</Label>
              <Input
                id="supplierRef"
                placeholder="INV-SUP-12345"
                value={supplierRef}
                onChange={(e) => setSupplierRef(e.target.value)}
              />
            </div>
          </div>

          {/* Items Table */}
          <div className="border border-zinc-200 rounded-xl overflow-hidden">
            <div className="bg-zinc-50 px-4 py-2.5 border-b border-zinc-200 text-xs font-semibold text-zinc-500 uppercase tracking-wider flex items-center justify-between">
              <span>Rincian Barang Masuk</span>
              <span className="text-zinc-400 font-normal">
                Batch stok baru akan dibuat otomatis
              </span>
            </div>

            <div className="p-3 space-y-3 max-h-[340px] overflow-y-auto">
              {draftItems.map((item, index) => {
                const prod = products.find((p) => p.id === Number(item.productId));
                const availableUnits = prod
                  ? [
                      prod.baseUnit,
                      ...prod.units.map((u) => u.unit),
                    ]
                  : units;

                const subtotal = (Number(item.qty) || 0) * (Number(item.unitCost) || 0);

                return (
                  <div
                    key={index}
                    className="flex flex-col sm:flex-row items-center gap-3 p-3 rounded-xl bg-zinc-50/50 border border-zinc-100"
                  >
                    {/* Produk */}
                    <div className="w-full sm:flex-1">
                      <Label className="text-[11px] text-zinc-400 sm:hidden">Produk</Label>
                      <Select
                        value={item.productId.toString()}
                        onChange={(e) => handleProductChange(index, Number(e.target.value))}
                        className="text-xs"
                      >
                        {products.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name} ({p.code})
                          </option>
                        ))}
                      </Select>
                    </div>

                    {/* Satuan */}
                    <div className="w-full sm:w-32">
                      <Label className="text-[11px] text-zinc-400 sm:hidden">Satuan</Label>
                      <Select
                        value={item.unitId.toString()}
                        onChange={(e) => handleUnitChange(index, Number(e.target.value))}
                        className="text-xs"
                      >
                        {availableUnits.map((u) => (
                          <option key={u.id} value={u.id}>
                            {u.code}
                          </option>
                        ))}
                      </Select>
                    </div>

                    {/* Qty */}
                    <div className="w-full sm:w-24">
                      <Label className="text-[11px] text-zinc-400 sm:hidden">Qty</Label>
                      <Input
                        type="number"
                        min="1"
                        step="1"
                        placeholder="Qty"
                        value={item.qty || ""}
                        onChange={(e) => handleQtyChange(index, Number(e.target.value))}
                        className="text-xs"
                      />
                    </div>

                    {/* Harga Beli */}
                    <div className="w-full sm:w-36">
                      <Label className="text-[11px] text-zinc-400 sm:hidden">Harga Beli (@)</Label>
                      <Input
                        type="number"
                        min="0"
                        step="100"
                        placeholder="Harga Beli"
                        value={item.unitCost || ""}
                        onChange={(e) => handleCostChange(index, Number(e.target.value))}
                        className="text-xs"
                      />
                    </div>

                    {/* Subtotal */}
                    <div className="w-full sm:w-32 text-right">
                      <p className="text-xs font-bold text-zinc-800">
                        Rp {subtotal.toLocaleString("id-ID")}
                      </p>
                    </div>

                    {/* Delete */}
                    <button
                      type="button"
                      onClick={() => removeRow(index)}
                      disabled={draftItems.length <= 1}
                      className="p-1.5 text-zinc-400 hover:text-red-600 disabled:opacity-30 disabled:hover:text-zinc-400"
                      title="Hapus baris"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                );
              })}
            </div>

            <div className="p-3 bg-zinc-50 border-t border-zinc-200 flex items-center justify-between">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addRow}
                className="text-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                Tambah Barang Lain
              </Button>

              <div className="text-right">
                <span className="text-xs text-zinc-500 mr-2 font-medium">Total Pembelian:</span>
                <span className="text-base font-bold text-[#87482D]">
                  Rp {grandTotal.toLocaleString("id-ID")}
                </span>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex justify-end gap-3 pt-3 border-t border-zinc-100">
            <Button
              type="button"
              variant="outline"
              onClick={() => setCreateModalOpen(false)}
            >
              Batal
            </Button>
            <Button
              type="button"
              onClick={handleSubmitPurchase}
              disabled={isPending}
              className="bg-[#87482D] hover:bg-[#6d3a24] text-white"
            >
              {isPending ? "Menyimpan Transaksi..." : "Simpan Faktur Pembelian"}
            </Button>
          </div>
        </div>
      </Dialog>

      {/* Modal Detail Faktur */}
      {selectedPurchase && (
        <Dialog
          open={detailModalOpen}
          onClose={() => setDetailModalOpen(false)}
          title={`Detail Faktur: ${selectedPurchase.invoiceNo}`}
        >
          <div className="space-y-4">
            {/* Header info */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-4 bg-zinc-50 rounded-xl text-xs">
              <div>
                <p className="text-zinc-400">Supplier:</p>
                <p className="font-bold text-zinc-800">{selectedPurchase.supplier.name}</p>
              </div>
              <div>
                <p className="text-zinc-400">Tanggal:</p>
                <p className="font-bold text-zinc-800">
                  {new Date(selectedPurchase.date).toLocaleDateString("id-ID", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </p>
              </div>
              <div>
                <p className="text-zinc-400">No. Ref Supplier:</p>
                <p className="font-bold text-zinc-800">{selectedPurchase.supplierRef || "-"}</p>
              </div>
            </div>

            {/* Items Table */}
            <div className="border border-zinc-200 rounded-xl overflow-hidden">
              <table className="w-full text-xs">
                <thead className="bg-zinc-50 border-b border-zinc-200 text-zinc-500">
                  <tr>
                    <th className="px-3 py-2 text-left">Produk</th>
                    <th className="px-3 py-2 text-center">Qty Dibeli</th>
                    <th className="px-3 py-2 text-right">Harga Beli</th>
                    <th className="px-3 py-2 text-center">Batch Terbuat</th>
                    <th className="px-3 py-2 text-right">Subtotal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {selectedPurchase.items.map((item) => (
                    <tr key={item.id}>
                      <td className="px-3 py-2">
                        <p className="font-semibold text-zinc-900">{item.product.name}</p>
                        <p className="text-[10px] text-zinc-400">{item.product.code}</p>
                      </td>
                      <td className="px-3 py-2 text-center font-medium">
                        {Number(item.qty)} {item.unit.code}
                        <div className="text-[10px] text-zinc-400">
                          (= {Number(item.qtyBase)} {item.product.baseUnit.code})
                        </div>
                      </td>
                      <td className="px-3 py-2 text-right">
                        Rp {Number(item.unitCost).toLocaleString("id-ID")}
                        <div className="text-[10px] text-zinc-400">
                          (@Rp {Number(item.costPerBase).toLocaleString("id-ID")}/{item.product.baseUnit.code})
                        </div>
                      </td>
                      <td className="px-3 py-2 text-center">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-[#87482D]/10 text-[#87482D] font-mono text-[11px] font-bold">
                          Batch #{item.batch?.id ?? "-"}
                        </span>
                        {item.batch && (
                          <p className="text-[10px] text-zinc-400">
                            sisa: {Number(item.batch.qtyRemaining)}
                          </p>
                        )}
                      </td>
                      <td className="px-3 py-2 text-right font-bold text-zinc-900">
                        Rp {Number(item.subtotal).toLocaleString("id-ID")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="p-3 bg-zinc-50 border-t border-zinc-200 flex justify-between items-center text-sm">
                <span className="font-semibold text-zinc-600">Total Keseluruhan</span>
                <span className="font-bold text-[#87482D] text-base">
                  Rp {Number(selectedPurchase.total).toLocaleString("id-ID")}
                </span>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <Button variant="outline" onClick={() => setDetailModalOpen(false)}>
                Tutup
              </Button>
            </div>
          </div>
        </Dialog>
      )}
    </div>
  );
}

