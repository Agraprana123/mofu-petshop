"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  ShoppingCart,
  Plus,
  Search,
  Eye,
  Trash2,
  Calendar,
  User,
  CheckCircle2,
  AlertCircle,
  Receipt,
  Layers,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Dialog } from "@/components/ui/dialog";
import { createSaleAction } from "@/server/actions/sales.action";

interface CustomerOption {
  id: number;
  name: string;
  phone: string | null;
}

interface SalesmanOption {
  id: number;
  name: string;
}

interface ProductOption {
  id: number;
  name: string;
  code: string;
  baseUnitId: number;
  marginPercent: string | null;
  category: { id: number; name: string; defaultMarginPercent: string };
  baseUnit: { id: number; code: string; name: string };
  units: {
    id: number;
    unitId: number;
    conversionToBase: string;
    unit: { id: number; code: string; name: string };
  }[];
  batches: {
    id: number;
    qtyRemaining: string;
    costPerBase: string;
  }[];
}

interface UnitOption {
  id: number;
  code: string;
  name: string;
}

interface AllocationDetail {
  id: number;
  batchId: number;
  qtyBase: string;
  costPerBase: string;
  pricePerBase: string;
  batch: { id: number; receivedAt: string };
}

interface SaleItemDetail {
  id: number;
  qty: string;
  qtyBase: string;
  subtotal: string;
  product: { name: string; code: string; baseUnit: { code: string } };
  unit: { code: string };
  allocations: AllocationDetail[];
}

interface SaleRecord {
  id: number;
  invoiceNo: string;
  date: string;
  total: string;
  paymentStatus: string;
  customer: { name: string; phone: string | null } | null;
  salesman: { name: string } | null;
  items: SaleItemDetail[];
}

interface CartItem {
  productId: number;
  unitId: number;
  qty: number;
  unitPrice: number; // estimated or manual price
}

export function SalesClient({
  sales,
  customers,
  salesmen,
  products,
  units,
}: {
  sales: SaleRecord[];
  customers: CustomerOption[];
  salesmen: SalesmanOption[];
  products: ProductOption[];
  units: UnitOption[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [search, setSearch] = useState("");
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedSale, setSelectedSale] = useState<SaleRecord | null>(null);
  const [error, setError] = useState("");

  // State Form Kasir / Penjualan Baru
  const [customerId, setCustomerId] = useState<string>(""); // "" = Umum
  const [salesmanId, setSalesmanId] = useState<string>("");
  const [saleDate, setSaleDate] = useState(
    new Date().toISOString().slice(0, 10)
  );

  const [cart, setCart] = useState<CartItem[]>([]);

  const filtered = sales.filter(
    (s) =>
      s.invoiceNo.toLowerCase().includes(search.toLowerCase()) ||
      (s.customer && s.customer.name.toLowerCase().includes(search.toLowerCase())) ||
      (s.salesman && s.salesman.name.toLowerCase().includes(search.toLowerCase()))
  );

  function getCalculatedUnitPrice(prod: ProductOption, unitId: number): number {
    const activeBatch = prod.batches[0];
    if (!activeBatch) return 0;

    const cost = Number(activeBatch.costPerBase);
    const margin = prod.marginPercent
      ? Number(prod.marginPercent)
      : Number(prod.category.defaultMarginPercent);

    const pricePerBase = Math.round(cost * (1 + margin / 100));

    if (unitId === prod.baseUnitId) {
      return pricePerBase;
    }

    const pu = prod.units.find((u) => u.unitId === unitId);
    const conv = pu ? Number(pu.conversionToBase) : 1;
    return Math.round(pricePerBase * conv);
  }

  function openCreateModal() {
    setError("");
    setCustomerId("");
    setSalesmanId("");
    setSaleDate(new Date().toISOString().slice(0, 10));

    // Default item
    const firstProduct = products[0];
    if (firstProduct) {
      const defaultPrice = getCalculatedUnitPrice(firstProduct, firstProduct.baseUnitId);
      setCart([
        {
          productId: firstProduct.id,
          unitId: firstProduct.baseUnitId,
          qty: 1,
          unitPrice: defaultPrice,
        },
      ]);
    } else {
      setCart([]);
    }
    setCreateModalOpen(true);
  }

  function handleProductChange(index: number, newProductId: number) {
    const prod = products.find((p) => p.id === newProductId);
    if (!prod) return;

    const defaultUnitId = prod.baseUnitId;
    const price = getCalculatedUnitPrice(prod, defaultUnitId);

    const updated = [...cart];
    updated[index] = {
      ...updated[index],
      productId: newProductId,
      unitId: defaultUnitId,
      unitPrice: price,
    };
    setCart(updated);
  }

  function handleUnitChange(index: number, newUnitId: number) {
    const prod = products.find((p) => p.id === cart[index].productId);
    if (!prod) return;

    const price = getCalculatedUnitPrice(prod, newUnitId);
    const updated = [...cart];
    updated[index] = {
      ...updated[index],
      unitId: newUnitId,
      unitPrice: price,
    };
    setCart(updated);
  }

  function handleQtyChange(index: number, qty: number) {
    const updated = [...cart];
    updated[index].qty = qty;
    setCart(updated);
  }

  function addRow() {
    const firstProduct = products[0];
    if (!firstProduct) return;

    const price = getCalculatedUnitPrice(firstProduct, firstProduct.baseUnitId);
    setCart([
      ...cart,
      {
        productId: firstProduct.id,
        unitId: firstProduct.baseUnitId,
        qty: 1,
        unitPrice: price,
      },
    ]);
  }

  function removeRow(index: number) {
    if (cart.length <= 1) return;
    setCart(cart.filter((_, i) => i !== index));
  }

  const grandTotal = cart.reduce(
    (sum, item) => sum + (Number(item.qty) || 0) * (Number(item.unitPrice) || 0),
    0
  );

  function handleSubmitSale() {
    setError("");
    if (cart.length === 0) {
      setError("Keranjang belanja kosong.");
      return;
    }

    if (cart.some((i) => !i.productId || i.qty <= 0)) {
      setError("Pastikan semua barang memiliki qty > 0.");
      return;
    }

    startTransition(async () => {
      const res = await createSaleAction({
        customerId: customerId ? Number(customerId) : undefined,
        salesmanId: salesmanId ? Number(salesmanId) : undefined,
        date: new Date(saleDate),
        items: cart.map((item) => ({
          productId: Number(item.productId),
          unitId: Number(item.unitId),
          qty: Number(item.qty),
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
            Faktur Penjualan (Kasir / POS)
          </h1>
          <p className="text-zinc-500 mt-1 text-sm">
            Harga jual dihitung otomatis dari modal batch FIFO aktif + persentase margin
          </p>
        </div>
        <Button
          onClick={openCreateModal}
          className="bg-[#87482D] hover:bg-[#6d3a24] text-white shadow-sm shadow-[#87482D]/20"
        >
          <ShoppingCart className="w-4 h-4" />
          Transaksi Penjualan Baru
        </Button>
      </div>

      {/* Main Table Card */}
      <div className="bg-white rounded-2xl border border-zinc-200/80 shadow-xs overflow-hidden">
        {/* Search header */}
        <div className="p-4 border-b border-zinc-100 flex items-center justify-between gap-4">
          <div className="relative max-w-sm w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <Input
              placeholder="Cari no faktur atau pelanggan..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-10 rounded-xl"
            />
          </div>
          <span className="text-xs text-zinc-400 font-medium whitespace-nowrap">
            {filtered.length} transaksi penjualan
          </span>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-100 text-left text-zinc-400 text-xs uppercase tracking-wider font-semibold">
                <th className="px-5 py-3.5">#</th>
                <th className="px-5 py-3.5">No Faktur</th>
                <th className="px-5 py-3.5">Pelanggan</th>
                <th className="px-5 py-3.5">Tanggal</th>
                <th className="px-5 py-3.5">Salesman</th>
                <th className="px-5 py-3.5 text-center">Status</th>
                <th className="px-5 py-3.5 text-right">Total Transaksi</th>
                <th className="px-5 py-3.5 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-5 py-12 text-center text-zinc-400">
                    <Receipt className="w-8 h-8 mx-auto mb-2 opacity-40" />
                    Belum ada riwayat transaksi penjualan
                  </td>
                </tr>
              ) : (
                filtered.map((s, i) => (
                  <tr key={s.id} className="hover:bg-zinc-50/70 transition-colors">
                    <td className="px-5 py-3.5 text-zinc-400 text-xs">{i + 1}</td>
                    <td className="px-5 py-3.5 font-bold text-zinc-900 font-mono text-xs">
                      {s.invoiceNo}
                    </td>
                    <td className="px-5 py-3.5">
                      <p className="font-medium text-zinc-800">
                        {s.customer?.name ?? "Pelanggan Umum"}
                      </p>
                      {s.customer?.phone && (
                        <p className="text-[11px] text-zinc-400">{s.customer.phone}</p>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-zinc-500 text-xs">
                      {new Date(s.date).toLocaleDateString("id-ID", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>
                    <td className="px-5 py-3.5 text-zinc-500 text-xs">
                      {s.salesman?.name ?? "-"}
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700">
                        Selesai
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-right font-bold text-zinc-900">
                      Rp {Number(s.total).toLocaleString("id-ID")}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <button
                        onClick={() => {
                          setSelectedSale(s);
                          setDetailModalOpen(true);
                        }}
                        className="p-1.5 rounded-lg hover:bg-zinc-100 text-zinc-400 hover:text-[#87482D] transition-colors"
                        title="Lihat Detail Transaksi & Alokasi FIFO"
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

      {/* Modal Transaksi Penjualan Baru */}
      <Dialog
        open={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title="Kasir / Buat Faktur Penjualan Baru"
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
              <Label htmlFor="customerId">Pelanggan</Label>
              <Select
                id="customerId"
                value={customerId}
                onChange={(e) => setCustomerId(e.target.value)}
              >
                <option value="">-- Umum / Non-Member --</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} {c.phone ? `(${c.phone})` : ""}
                  </option>
                ))}
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="salesmanId">Salesman (Opsional)</Label>
              <Select
                id="salesmanId"
                value={salesmanId}
                onChange={(e) => setSalesmanId(e.target.value)}
              >
                <option value="">-- Tidak ada --</option>
                {salesmen.map((sm) => (
                  <option key={sm.id} value={sm.id}>
                    {sm.name}
                  </option>
                ))}
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="saleDate">Tanggal Penjualan</Label>
              <Input
                id="saleDate"
                type="date"
                value={saleDate}
                onChange={(e) => setSaleDate(e.target.value)}
              />
            </div>
          </div>

          {/* Cart Items */}
          <div className="border border-zinc-200 rounded-xl overflow-hidden">
            <div className="bg-zinc-50 px-4 py-2.5 border-b border-zinc-200 text-xs font-semibold text-zinc-500 uppercase tracking-wider flex items-center justify-between">
              <span>Item Keranjang Belanja</span>
              <span className="text-zinc-400 font-normal">
                Harga jual = modal batch aktif × (1 + margin)
              </span>
            </div>

            <div className="p-3 space-y-3 max-h-[340px] overflow-y-auto">
              {cart.map((item, index) => {
                const prod = products.find((p) => p.id === Number(item.productId));
                const availableUnits = prod
                  ? [
                      prod.baseUnit,
                      ...prod.units.map((u) => u.unit),
                    ]
                  : units;

                const totalStock = prod
                  ? prod.batches.reduce((sum, b) => sum + Number(b.qtyRemaining), 0)
                  : 0;

                const subtotal = (Number(item.qty) || 0) * (Number(item.unitPrice) || 0);

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
                        {products.map((p) => {
                          const stock = p.batches.reduce(
                            (s, b) => s + Number(b.qtyRemaining),
                            0
                          );
                          return (
                            <option key={p.id} value={p.id}>
                              {p.name} (Sisa: {stock} {p.baseUnit.code})
                            </option>
                          );
                        })}
                      </Select>
                      <p className="text-[10px] text-zinc-400 mt-1">
                        Stok Gudang:{" "}
                        <strong className={totalStock > 0 ? "text-emerald-600" : "text-red-500"}>
                          {totalStock} {prod?.baseUnit.code}
                        </strong>
                      </p>
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

                    {/* Harga Jual FIFO */}
                    <div className="w-full sm:w-36 text-right">
                      <Label className="text-[11px] text-zinc-400 sm:hidden">Harga (@)</Label>
                      <p className="text-xs font-semibold text-zinc-800">
                        Rp {Number(item.unitPrice).toLocaleString("id-ID")}
                      </p>
                      <p className="text-[10px] text-[#87482D]">FIFO Aktif</p>
                    </div>

                    {/* Subtotal */}
                    <div className="w-full sm:w-32 text-right">
                      <p className="text-xs font-bold text-zinc-900">
                        Rp {subtotal.toLocaleString("id-ID")}
                      </p>
                    </div>

                    {/* Delete */}
                    <button
                      type="button"
                      onClick={() => removeRow(index)}
                      disabled={cart.length <= 1}
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
                <span className="text-xs text-zinc-500 mr-2 font-medium">Total Tagihan:</span>
                <span className="text-lg font-bold text-[#87482D]">
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
              onClick={handleSubmitSale}
              disabled={isPending}
              className="bg-[#87482D] hover:bg-[#6d3a24] text-white"
            >
              {isPending ? "Memproses Transaksi..." : "Proses & Simpan Penjualan"}
            </Button>
          </div>
        </div>
      </Dialog>

      {/* Modal Detail Faktur Penjualan & Alokasi FIFO */}
      {selectedSale && (
        <Dialog
          open={detailModalOpen}
          onClose={() => setDetailModalOpen(false)}
          title={`Detail Faktur: ${selectedSale.invoiceNo}`}
        >
          <div className="space-y-4">
            {/* Header info */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-4 bg-zinc-50 rounded-xl text-xs">
              <div>
                <p className="text-zinc-400">Pelanggan:</p>
                <p className="font-bold text-zinc-800">
                  {selectedSale.customer?.name ?? "Pelanggan Umum"}
                </p>
              </div>
              <div>
                <p className="text-zinc-400">Tanggal:</p>
                <p className="font-bold text-zinc-800">
                  {new Date(selectedSale.date).toLocaleDateString("id-ID", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </p>
              </div>
              <div>
                <p className="text-zinc-400">Salesman:</p>
                <p className="font-bold text-zinc-800">
                  {selectedSale.salesman?.name ?? "-"}
                </p>
              </div>
            </div>

            {/* Items Table */}
            <div className="border border-zinc-200 rounded-xl overflow-hidden">
              <table className="w-full text-xs">
                <thead className="bg-zinc-50 border-b border-zinc-200 text-zinc-500">
                  <tr>
                    <th className="px-3 py-2 text-left">Produk</th>
                    <th className="px-3 py-2 text-center">Qty Jual</th>
                    <th className="px-3 py-2 text-left">Alokasi Batch FIFO (Layer Stok)</th>
                    <th className="px-3 py-2 text-right">Subtotal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {selectedSale.items.map((item) => (
                    <tr key={item.id}>
                      <td className="px-3 py-2">
                        <p className="font-semibold text-zinc-900">{item.product.name}</p>
                        <p className="text-[10px] text-zinc-400">{item.product.code}</p>
                      </td>
                      <td className="px-3 py-2 text-center font-medium">
                        {Number(item.qty)} {item.unit.code}
                      </td>
                      <td className="px-3 py-2">
                        <div className="space-y-1">
                          {item.allocations.map((alloc) => (
                            <div
                              key={alloc.id}
                              className="flex items-center gap-2 p-1.5 rounded-lg bg-zinc-50 text-[11px]"
                            >
                              <span className="font-mono font-bold text-[#87482D]">
                                Batch #{alloc.batchId}
                              </span>
                              <span className="text-zinc-500">
                                ({Number(alloc.qtyBase)} {item.product.baseUnit.code})
                              </span>
                              <span className="text-zinc-400 text-[10px]">
                                [Modal @Rp {Number(alloc.costPerBase).toLocaleString("id-ID")}]
                              </span>
                              <span className="font-semibold text-emerald-700 ml-auto">
                                Jual @Rp {Number(alloc.pricePerBase).toLocaleString("id-ID")}
                              </span>
                            </div>
                          ))}
                        </div>
                      </td>
                      <td className="px-3 py-2 text-right font-bold text-zinc-900">
                        Rp {Number(item.subtotal).toLocaleString("id-ID")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="p-3 bg-zinc-50 border-t border-zinc-200 flex justify-between items-center text-sm">
                <span className="font-semibold text-zinc-600">Total Pembayaran</span>
                <span className="font-bold text-[#87482D] text-base">
                  Rp {Number(selectedSale.total).toLocaleString("id-ID")}
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

