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
  AlertCircle,
  Wallet,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Dialog } from "@/components/ui/dialog";
import { ProductPicker } from "@/components/product-picker";
import { createPurchaseAction } from "@/server/actions/purchase.action";
import { cn } from "@/lib/utils";

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
  sellPrice: string | null;
  category?: { id: number; name: string } | null;
  units: {
    id: number;
    unitId: number;
    conversionToBase: string;
    unit: { id: number; code: string; name: string };
  }[];
}

interface PurchaseItemDetail {
  id: number;
  qty: string;
  unitCost: string;
  qtyBase: string;
  costPerBase: string;
  marginPercent: string;
  sellPricePerUnit: string;
  sellPricePerBase: string;
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
  sellPrice: number;
}

/** Baris kosong: pengguna diarahkan mencari & memilih barang dulu. */
function emptyDraftItem(): DraftItem {
  return { productId: 0, unitId: 0, qty: 1, unitCost: 0, sellPrice: 0 };
}

/** Konversi satuan terpilih ke satuan dasar produk. */
function getConversion(
  product: ProductOption | undefined,
  unitId: number
): number {
  if (!product) return 1;
  if (unitId === product.baseUnitId) return 1;
  return Number(
    product.units.find((unit) => unit.unitId === unitId)?.conversionToBase ?? 1
  );
}

export function PurchasesClient({
  purchases,
  suppliers,
  products,
}: {
  purchases: PurchaseItem[];
  suppliers: SupplierOption[];
  products: ProductOption[];
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
  const [draftItems, setDraftItems] = useState<DraftItem[]>([emptyDraftItem()]);

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
    setDraftItems([emptyDraftItem()]);
    setCreateModalOpen(true);
  }

  function handleProductChange(index: number, newProductId: number) {
    const prod = products.find((p) => p.id === newProductId);
    const updated = [...draftItems];
    updated[index] = {
      ...updated[index],
      productId: newProductId,
      unitId: prod?.baseUnitId ?? 0,
      // Harga dari barang sebelumnya tidak boleh terbawa ke barang baru.
      unitCost: 0,
      // Saran awal dari harga jual master (per satuan dasar).
      sellPrice: Number(prod?.sellPrice ?? 0),
    };
    setDraftItems(updated);
  }

  function handleUnitChange(index: number, newUnitId: number) {
    const updated = [...draftItems];
    const prod = products.find((p) => p.id === Number(updated[index].productId));
    const oldConversion = getConversion(prod, updated[index].unitId);
    const newConversion = getConversion(prod, newUnitId);
    updated[index].unitId = newUnitId;
    // Harga jual ikut menyesuaikan satuan yang dipilih.
    if (updated[index].sellPrice > 0) {
      updated[index].sellPrice = Math.round(
        (updated[index].sellPrice / oldConversion) * newConversion
      );
    }
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

  function handleSellPriceChange(index: number, sellPrice: number) {
    const updated = [...draftItems];
    updated[index].sellPrice = sellPrice;
    setDraftItems(updated);
  }

  function addRow() {
    setDraftItems([...draftItems, emptyDraftItem()]);
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
          // Kosong = biarkan sistem menghitung dari margin/master produk.
          sellPrice:
            Number(item.sellPrice) > 0 ? Number(item.sellPrice) : undefined,
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

  const totalSpend = purchases.reduce(
    (sum, purchase) => sum + Number(purchase.total),
    0
  );
  const now = new Date();
  const monthSpend = purchases
    .filter((purchase) => {
      const date = new Date(purchase.date);
      return (
        date.getMonth() === now.getMonth() &&
        date.getFullYear() === now.getFullYear()
      );
    })
    .reduce((sum, purchase) => sum + Number(purchase.total), 0);

  return (
    <div className="page-enter space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3.5">
          <div className="hidden size-12 shrink-0 place-items-center rounded-2xl bg-[#87482D]/10 text-[#87482D] sm:grid">
            <FileText className="size-6" />
          </div>
          <div>
            <h1 className="font-display text-2xl font-bold tracking-tight text-zinc-900">
              Faktur Pembelian
            </h1>
            <p className="mt-1 text-sm text-zinc-500">
              Catat stok masuk dari supplier dan buat batch FIFO baru.
            </p>
          </div>
        </div>
        <Button onClick={openCreateModal} className="h-11 sm:self-center">
          <Plus className="size-4" />
          Faktur Pembelian Baru
        </Button>
      </div>

      {/* Summary strip */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          {
            label: "Total Faktur",
            value: purchases.length.toLocaleString("id-ID"),
            icon: FileText,
            tone: "bg-[#87482D]/10 text-[#87482D]",
          },
          {
            label: "Total Belanja",
            value: `Rp ${totalSpend.toLocaleString("id-ID")}`,
            icon: Wallet,
            tone: "bg-emerald-50 text-emerald-600",
          },
          {
            label: "Bulan Ini",
            value: `Rp ${monthSpend.toLocaleString("id-ID")}`,
            icon: Calendar,
            tone: "bg-sky-50 text-sky-600",
          },
          {
            label: "Supplier",
            value: suppliers.length.toLocaleString("id-ID"),
            icon: Truck,
            tone: "bg-amber-50 text-amber-600",
          },
        ].map((item) => {
          const Icon = item.icon;
          return (
            <div
              key={item.label}
              className="rounded-2xl border border-zinc-200/70 bg-white p-4 shadow-xs"
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-medium text-zinc-400">
                  {item.label}
                </span>
                <span
                  className={`grid size-8 place-items-center rounded-lg ${item.tone}`}
                >
                  <Icon className="size-4" />
                </span>
              </div>
              <p className="mt-2 font-display text-lg font-bold tracking-tight text-zinc-900">
                {item.value}
              </p>
            </div>
          );
        })}
      </div>

      {/* Main Table Card */}
      <div className="overflow-hidden rounded-2xl border border-zinc-200/70 bg-white shadow-[0_1px_2px_rgba(24,25,26,0.04),0_16px_40px_-32px_rgba(24,25,26,0.25)]">
        {/* Search header */}
        <div className="flex flex-col gap-3 border-b border-zinc-100 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-zinc-400" />
            <Input
              placeholder="Cari no faktur atau supplier..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <span className="whitespace-nowrap text-[11px] font-medium text-zinc-400">
            {filtered.length} transaksi pembelian
          </span>
        </div>

        {/* Table */}
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center px-5 py-16 text-center">
            <span className="grid size-14 place-items-center rounded-2xl bg-zinc-100 text-zinc-400">
              <FileText className="size-6" />
            </span>
            <p className="mt-4 text-sm font-semibold text-zinc-700">
              Belum ada faktur pembelian
            </p>
            <p className="mt-1 max-w-xs text-xs text-zinc-400">
              Catat pembelian pertama untuk menambah stok dan harga jual batch.
            </p>
            <button
              onClick={openCreateModal}
              className="mt-4 inline-flex h-9 items-center gap-2 rounded-xl bg-[#87482D] px-3.5 text-xs font-semibold text-white transition-colors hover:bg-[#6d3a24]"
            >
              <Plus className="size-3.5" />
              Buat Faktur
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px] text-sm">
              <thead>
                <tr className="border-b border-zinc-100 bg-zinc-50/60 text-left text-[10px] font-bold uppercase tracking-[0.12em] text-zinc-400">
                  <th className="px-5 py-3">#</th>
                  <th className="px-5 py-3">No Faktur</th>
                  <th className="px-5 py-3">Supplier</th>
                  <th className="px-5 py-3">Tanggal</th>
                  <th className="px-5 py-3">Ref. Supplier</th>
                  <th className="px-5 py-3 text-center">Jumlah Item</th>
                  <th className="px-5 py-3 text-right">Total Pembelian</th>
                  <th className="px-5 py-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {filtered.map((p, i) => (                  <tr
                    key={p.id}
                    onClick={() => {
                      setSelectedPurchase(p);
                      setDetailModalOpen(true);
                    }}
                    className="cursor-pointer transition-colors hover:bg-zinc-50/80"
                  >
                    <td className="px-5 py-3.5 text-xs text-zinc-400">
                      {i + 1}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="inline-flex items-center gap-2">
                        <span className="grid size-8 place-items-center rounded-lg bg-[#87482D]/8 text-[#87482D]">
                          <FileText className="size-3.5" />
                        </span>
                        <span className="font-mono text-[11px] font-bold text-zinc-900">
                          {p.invoiceNo}
                        </span>
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-[13px] font-medium text-zinc-800">
                      {p.supplier.name}
                    </td>
                    <td className="px-5 py-3.5 text-[12px] text-zinc-500">
                      {new Date(p.date).toLocaleDateString("id-ID", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>
                    <td className="px-5 py-3.5 text-[12px] text-zinc-500">
                      {p.supplierRef || "-"}
                    </td>
                    <td className="px-5 py-3.5 text-center text-[12px] font-semibold text-zinc-600">
                      {p.items.length} Barang
                    </td>
                    <td className="px-5 py-3.5 text-right text-[13px] font-bold tabular-nums text-zinc-900">
                      Rp {Number(p.total).toLocaleString("id-ID")}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <button
                        onClick={(event) => {
                          event.stopPropagation();
                          setSelectedPurchase(p);
                          setDetailModalOpen(true);
                        }}
                        aria-label={`Lihat detail ${p.invoiceNo}`}
                        className="grid size-9 place-items-center justify-self-end rounded-xl text-zinc-400 transition-colors hover:bg-[#87482D]/8 hover:text-[#87482D]"
                        title="Lihat Detail"
                      >
                        <Eye className="size-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Buat Pembelian Baru */}
      <Dialog
        open={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title="Buat Faktur Pembelian Baru"
        description="Cari barang, isi harga modal dan harga jual. Sistem menghitung margin dan menyimpan harga jual per batch untuk FIFO."
        className="max-w-5xl"
      >
        <div className="space-y-5">
          {error && (
            <div className="flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 p-3 text-[13px] text-red-700">
              <AlertCircle className="mt-0.5 size-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Info faktur */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="supplierId">
                Pemasok / Supplier <span className="text-red-500">*</span>
              </Label>
              <Select
                id="supplierId"
                value={supplierId.toString()}
                onChange={(e) => setSupplierId(Number(e.target.value))}
                className="h-11"
              >
                {suppliers.length === 0 && (
                  <option value="0">Belum ada supplier</option>
                )}
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
                className="h-11"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="supplierRef">No. Referensi Supplier</Label>
              <Input
                id="supplierRef"
                placeholder="INV-SUP-12345 (opsional)"
                value={supplierRef}
                onChange={(e) => setSupplierRef(e.target.value)}
                className="h-11"
              />
            </div>
          </div>

          {/* Barang masuk */}
          <div className="overflow-hidden rounded-2xl border border-zinc-200">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-200 bg-zinc-50/80 px-4 py-3">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-zinc-500">
                  Rincian Barang Masuk
                </p>
                <p className="mt-0.5 text-[10px] text-zinc-400">
                  Harga jual kosong = otomatis dari harga master / margin produk.
                </p>
              </div>
              <span className="rounded-full bg-white px-2.5 py-1 text-[10px] font-semibold text-zinc-500 ring-1 ring-zinc-200">
                {draftItems.length} barang
              </span>
            </div>

            <div className="hidden gap-3 border-b border-zinc-100 bg-white px-4 py-2 text-[10px] font-bold uppercase tracking-[0.08em] text-zinc-400 sm:grid sm:grid-cols-[minmax(0,1fr)_84px_76px_124px_124px_76px_112px_36px]">
              <span>Barang</span>
              <span>Satuan</span>
              <span>Qty</span>
              <span>Harga Beli</span>
              <span>Harga Jual</span>
              <span className="text-right">Margin</span>
              <span className="text-right">Subtotal</span>
              <span />
            </div>

            <div className="divide-y divide-zinc-100">
              {draftItems.map((item, index) => {
                const prod = products.find((p) => p.id === Number(item.productId));
                const availableUnits = prod
                  ? [prod.baseUnit, ...prod.units.map((u) => u.unit)]
                  : [];
                const subtotal =
                  (Number(item.qty) || 0) * (Number(item.unitCost) || 0);
                const unitCost = Number(item.unitCost) || 0;
                const sellPrice = Number(item.sellPrice) || 0;
                const margin =
                  unitCost > 0 && sellPrice > 0
                    ? ((sellPrice - unitCost) / unitCost) * 100
                    : null;

                return (
                  <div
                    key={index}
                    className="px-4 py-3.5 transition-colors hover:bg-zinc-50/40"
                  >
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-[minmax(0,1fr)_84px_76px_124px_124px_76px_112px_36px] sm:items-end">
                      <div className="min-w-0 space-y-1.5">
                        <Label className="text-[10px] text-zinc-400 sm:hidden">
                          Barang
                        </Label>
                        <ProductPicker
                          products={products.map((p) => ({
                            id: p.id,
                            name: p.name,
                            code: p.code,
                            category: p.category,
                            baseUnit: p.baseUnit,
                          }))}
                          value={item.productId}
                          onChange={(productId) =>
                            handleProductChange(index, productId)
                          }
                        />
                      </div>

                      <div className="space-y-1.5">
                        <Label className="text-[10px] text-zinc-400 sm:hidden">
                          Satuan
                        </Label>
                        <Select
                          value={item.unitId ? item.unitId.toString() : ""}
                          onChange={(e) =>
                            handleUnitChange(index, Number(e.target.value))
                          }
                          disabled={!prod}
                          className="h-11 text-xs"
                        >
                          {!prod && <option value="">-</option>}
                          {availableUnits.map((u) => (
                            <option key={u.id} value={u.id}>
                              {u.code}
                            </option>
                          ))}
                        </Select>
                      </div>

                      <div className="space-y-1.5">
                        <Label className="text-[10px] text-zinc-400 sm:hidden">
                          Qty
                        </Label>
                        <Input
                          type="number"
                          min="1"
                          step="1"
                          placeholder="Qty"
                          value={item.qty || ""}
                          onChange={(e) =>
                            handleQtyChange(index, Number(e.target.value))
                          }
                          className="h-11 text-xs"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <Label className="text-[10px] text-zinc-400 sm:hidden">
                          Harga Beli
                        </Label>
                        <Input
                          type="number"
                          min="0"
                          step="100"
                          placeholder="Rp 0"
                          value={item.unitCost || ""}
                          onChange={(e) =>
                            handleCostChange(index, Number(e.target.value))
                          }
                          className="h-11 text-xs"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <Label className="text-[10px] text-zinc-400 sm:hidden">
                          Harga Jual
                        </Label>
                        <Input
                          type="number"
                          min="0"
                          step="100"
                          placeholder="Otomatis"
                          value={item.sellPrice || ""}
                          onChange={(e) =>
                            handleSellPriceChange(index, Number(e.target.value))
                          }
                          className="h-11 text-xs"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <Label className="text-[10px] text-zinc-400 sm:hidden">
                          Margin
                        </Label>
                        <div
                          className={cn(
                            "flex h-11 items-center justify-end rounded-xl px-2 text-xs font-bold tabular-nums sm:bg-transparent sm:px-0",
                            margin === null
                              ? "bg-zinc-50/80 text-zinc-400"
                              : margin >= 0
                                ? "bg-emerald-50/80 text-emerald-600 sm:bg-transparent"
                                : "bg-red-50/80 text-red-600 sm:bg-transparent"
                          )}
                        >
                          {margin === null
                            ? "—"
                            : `${margin >= 0 ? "+" : ""}${margin.toLocaleString(
                                "id-ID",
                                { maximumFractionDigits: 1 }
                              )}%`}
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <Label className="text-[10px] text-zinc-400 sm:hidden">
                          Subtotal
                        </Label>
                        <div className="flex h-11 items-center justify-end rounded-xl bg-zinc-50/80 px-2 text-sm font-bold tabular-nums text-zinc-800 sm:bg-transparent sm:px-0">
                          Rp {subtotal.toLocaleString("id-ID")}
                        </div>
                      </div>

                      <div className="flex h-11 items-center justify-center">
                        <button
                          type="button"
                          onClick={() => removeRow(index)}
                          disabled={draftItems.length <= 1}
                          className="grid size-9 place-items-center rounded-xl text-zinc-400 transition-colors hover:bg-red-50 hover:text-red-600 disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-zinc-400"
                          title="Hapus baris"
                          aria-label="Hapus baris"
                        >
                          <Trash2 className="size-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex flex-col gap-3 border-t border-zinc-200 bg-zinc-50/70 p-3 sm:flex-row sm:items-center sm:justify-between">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addRow}
                className="h-10 self-start sm:self-auto"
              >
                <Plus className="size-3.5" />
                Tambah Barang Lain
              </Button>

              <div className="flex items-baseline justify-between gap-3 sm:justify-end">
                <span className="text-[10px] font-bold uppercase tracking-[0.08em] text-zinc-400">
                  Total Pembelian
                </span>
                <span className="font-display text-lg font-bold tabular-nums text-[#87482D]">
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
          className="max-w-3xl"
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
            <div className="overflow-x-auto rounded-xl border border-zinc-200">
              <table className="w-full min-w-[640px] text-xs">
                <thead className="bg-zinc-50 border-b border-zinc-200 text-zinc-500">
                  <tr>
                    <th className="px-3 py-2 text-left">Produk</th>
                    <th className="px-3 py-2 text-center">Qty Dibeli</th>
                    <th className="px-3 py-2 text-right">Harga Beli</th>
                    <th className="px-3 py-2 text-right">Harga Jual</th>
                    <th className="px-3 py-2 text-center">Margin</th>
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
                      <td className="px-3 py-2 text-right">
                        Rp {Number(item.sellPricePerUnit).toLocaleString("id-ID")}
                        <div className="text-[10px] text-zinc-400">
                          (@Rp {Number(item.sellPricePerBase).toLocaleString("id-ID")}/{item.product.baseUnit.code})
                        </div>
                      </td>
                      <td className="px-3 py-2 text-center">
                        <span
                          className={cn(
                            "inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold tabular-nums",
                            Number(item.marginPercent) >= 0
                              ? "bg-emerald-50 text-emerald-700"
                              : "bg-red-50 text-red-600"
                          )}
                        >
                          {Number(item.marginPercent) >= 0 ? "+" : ""}
                          {Number(item.marginPercent).toLocaleString("id-ID", {
                            maximumFractionDigits: 1,
                          })}
                          %
                        </span>
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

