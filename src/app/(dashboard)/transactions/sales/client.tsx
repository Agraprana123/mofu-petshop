"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  ArrowUpRight,
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Eye,
  Layers,
  Minus,
  Plus,
  Receipt,
  Search,
  ShoppingCart,
  Trash2,
  UserRound,
  Wallet,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Dialog } from "@/components/ui/dialog";
import { createSaleAction } from "@/server/actions/sales.action";
import { cn } from "@/lib/utils";

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
    sellPricePerBase: string;
  }[];
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
  unitPrice: number;
}

type RangeFilter = "ALL" | "TODAY" | "WEEK";

const PAGE_SIZE = 7;

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word.charAt(0))
    .join("")
    .toUpperCase();
}

function isSameDay(date: Date, reference: Date) {
  return (
    date.getFullYear() === reference.getFullYear() &&
    date.getMonth() === reference.getMonth() &&
    date.getDate() === reference.getDate()
  );
}

export function SalesClient({
  sales,
  customers,
  salesmen,
  products,
}: {
  sales: SaleRecord[];
  customers: CustomerOption[];
  salesmen: SalesmanOption[];
  products: ProductOption[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [search, setSearch] = useState("");
  const [range, setRange] = useState<RangeFilter>("ALL");
  const [page, setPage] = useState(1);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedSale, setSelectedSale] = useState<SaleRecord | null>(null);
  const [error, setError] = useState("");

  const [customerId, setCustomerId] = useState<string>("");
  const [salesmanId, setSalesmanId] = useState<string>("");
  const [saleDate, setSaleDate] = useState(
    new Date().toISOString().slice(0, 10)
  );
  const [cart, setCart] = useState<CartItem[]>([]);

  const now = useMemo(() => new Date(), []);
  const weekStart = useMemo(() => {
    const start = new Date(now);
    start.setDate(start.getDate() - 6);
    start.setHours(0, 0, 0, 0);
    return start;
  }, [now]);

  const counts = useMemo(
    () => ({
      ALL: sales.length,
      TODAY: sales.filter((sale) => isSameDay(new Date(sale.date), now)).length,
      WEEK: sales.filter((sale) => new Date(sale.date) >= weekStart).length,
    }),
    [sales, now, weekStart]
  );

  const filtered = useMemo(() => {
    const query = search.toLowerCase();
    return sales.filter((sale) => {
      const matchesSearch =
        sale.invoiceNo.toLowerCase().includes(query) ||
        (sale.customer?.name.toLowerCase().includes(query) ?? false) ||
        (sale.salesman?.name.toLowerCase().includes(query) ?? false);

      const saleDateValue = new Date(sale.date);
      const matchesRange =
        range === "ALL" ||
        (range === "TODAY" && isSameDay(saleDateValue, now)) ||
        (range === "WEEK" && saleDateValue >= weekStart);

      return matchesSearch && matchesRange;
    });
  }, [sales, search, range, now, weekStart]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const paginated = filtered.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  function getUnitPrice(prod: ProductOption, unitId: number): number {
    const activeBatch = prod.batches.find(
      (batch) => Number(batch.qtyRemaining) > 0
    );
    if (!activeBatch) return 0;

    const pricePerBase = Number(activeBatch.sellPricePerBase);
    if (pricePerBase <= 0) return 0;

    const conversion =
      unitId === prod.baseUnitId
        ? 1
        : Number(
            prod.units.find((unit) => unit.unitId === unitId)
              ?.conversionToBase ?? 1
          );

    return Math.round(pricePerBase * conversion);
  }

  function openCreateModal() {
    setError("");
    setCustomerId("");
    setSalesmanId("");
    setSaleDate(new Date().toISOString().slice(0, 10));

    const firstProduct = products[0];
    if (firstProduct) {
      setCart([
        {
          productId: firstProduct.id,
          unitId: firstProduct.baseUnitId,
          qty: 1,
          unitPrice: getUnitPrice(firstProduct, firstProduct.baseUnitId),
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

    const updated = [...cart];
    updated[index] = {
      ...updated[index],
      productId: newProductId,
      unitId: prod.baseUnitId,
      unitPrice: getUnitPrice(prod, prod.baseUnitId),
    };
    setCart(updated);
  }

  function handleUnitChange(index: number, newUnitId: number) {
    const prod = products.find((p) => p.id === cart[index].productId);
    if (!prod) return;

    const updated = [...cart];
    updated[index] = {
      ...updated[index],
      unitId: newUnitId,
      unitPrice: getUnitPrice(prod, newUnitId),
    };
    setCart(updated);
  }

  function handleQtyChange(index: number, qty: number) {
    const updated = [...cart];
    updated[index].qty = Math.max(1, qty);
    setCart(updated);
  }

  function addRow() {
    const firstProduct = products[0];
    if (!firstProduct) return;
    setCart([
      ...cart,
      {
        productId: firstProduct.id,
        unitId: firstProduct.baseUnitId,
        qty: 1,
        unitPrice: getUnitPrice(firstProduct, firstProduct.baseUnitId),
      },
    ]);
  }

  function removeRow(index: number) {
    if (cart.length <= 1) return;
    setCart(cart.filter((_, i) => i !== index));
  }

  const grandTotal = cart.reduce(
    (sum, item) =>
      sum + (Number(item.qty) || 0) * (Number(item.unitPrice) || 0),
    0
  );
  const hasMissingPrice = cart.some((item) => {
    const product = products.find(
      (entry) => entry.id === Number(item.productId)
    );
    if (!product) return true;
    return product.batches.some(
      (batch) =>
        Number(batch.qtyRemaining) > 0 && Number(batch.sellPricePerBase) <= 0
    );
  });

  function handleSubmitSale() {
    setError("");
    if (cart.length === 0) {
      setError("Keranjang belanja kosong.");
      return;
    }
    if (cart.some((item) => !item.productId || item.qty <= 0)) {
      setError("Pastikan semua barang memiliki qty lebih dari 0.");
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

  const rangeTabs: { id: RangeFilter; label: string; count: number }[] = [
    { id: "ALL", label: "Semua", count: counts.ALL },
    { id: "TODAY", label: "Hari Ini", count: counts.TODAY },
    { id: "WEEK", label: "7 Hari Terakhir", count: counts.WEEK },
  ];

  return (
    <div className="page-enter space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3.5">
          <div className="hidden size-12 shrink-0 place-items-center rounded-2xl bg-[#87482D]/10 text-[#87482D] sm:grid">
            <ShoppingCart className="size-6" />
          </div>
          <div>
            <h1 className="font-display text-2xl font-bold tracking-tight text-zinc-900">
              Faktur Penjualan
            </h1>
            <p className="mt-1 text-sm text-zinc-500">
              Kasir, POS, dan riwayat alokasi stok FIFO.
            </p>
          </div>
        </div>
        <Button onClick={openCreateModal} className="h-11 sm:self-center">
          <ShoppingCart className="size-4" />
          Transaksi Baru
        </Button>
      </div>

      {/* Summary strip */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          {
            label: "Total Faktur",
            value: sales.length.toLocaleString("id-ID"),
            icon: Receipt,
            tone: "bg-[#87482D]/10 text-[#87482D]",
          },
          {
            label: "Hari Ini",
            value: counts.TODAY.toLocaleString("id-ID"),
            icon: CalendarDays,
            tone: "bg-sky-50 text-sky-600",
          },
          {
            label: "7 Hari Terakhir",
            value: counts.WEEK.toLocaleString("id-ID"),
            icon: Clock3,
            tone: "bg-amber-50 text-amber-600",
          },
          {
            label: "Omzet Hari Ini",
            value: `Rp ${sales
              .filter((sale) => isSameDay(new Date(sale.date), now))
              .reduce((sum, sale) => sum + Number(sale.total), 0)
              .toLocaleString("id-ID")}`,
            icon: Wallet,
            tone: "bg-emerald-50 text-emerald-600",
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
                  className={cn(
                    "grid size-8 place-items-center rounded-lg",
                    item.tone
                  )}
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

      {/* Main table card */}
      <div className="overflow-hidden rounded-2xl border border-zinc-200/70 bg-white shadow-[0_1px_2px_rgba(24,25,26,0.04),0_16px_40px_-32px_rgba(24,25,26,0.25)]">
        {/* Tabs + search */}
        <div className="border-b border-zinc-100">
          <div className="flex gap-1 overflow-x-auto px-4 pt-3">
            {rangeTabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  setRange(tab.id);
                  setPage(1);
                }}
                className={cn(
                  "relative flex shrink-0 items-center gap-1.5 rounded-t-xl px-3 pb-3 pt-1 text-[13px] font-semibold transition-colors",
                  range === tab.id
                    ? "text-[#87482D]"
                    : "text-zinc-400 hover:text-zinc-600"
                )}
              >
                {tab.label}
                <span
                  className={cn(
                    "rounded-full px-1.5 py-0.5 text-[10px]",
                    range === tab.id
                      ? "bg-[#87482D]/10 text-[#87482D]"
                      : "bg-zinc-100 text-zinc-400"
                  )}
                >
                  {tab.count}
                </span>
                {range === tab.id && (
                  <span className="absolute inset-x-2 bottom-0 h-0.5 rounded-full bg-[#87482D]" />
                )}
              </button>
            ))}
          </div>

          <div className="flex flex-col gap-3 px-4 pb-4 pt-1 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative w-full max-w-sm">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-zinc-400" />
              <Input
                placeholder="Cari no faktur, pelanggan, atau salesman..."
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value);
                  setPage(1);
                }}
                className="pl-9"
              />
            </div>
            <span className="text-[11px] font-medium text-zinc-400">
              {filtered.length} transaksi ditemukan
            </span>
          </div>
        </div>

        {/* Table */}
        {paginated.length === 0 ? (
          <div className="flex flex-col items-center px-5 py-16 text-center">
            <span className="grid size-14 place-items-center rounded-2xl bg-zinc-100 text-zinc-400">
              <Receipt className="size-6" />
            </span>
            <p className="mt-4 text-sm font-semibold text-zinc-700">
              Tidak ada transaksi
            </p>
            <p className="mt-1 text-xs text-zinc-400">
              Coba ubah filter atau buat faktur penjualan baru.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-sm">
              <thead>
                <tr className="border-b border-zinc-100 bg-zinc-50/60 text-left text-[10px] font-bold uppercase tracking-[0.12em] text-zinc-400">
                  <th className="px-5 py-3">No Faktur</th>
                  <th className="px-5 py-3">Pelanggan</th>
                  <th className="px-5 py-3">Tanggal</th>
                  <th className="px-5 py-3">Salesman</th>
                  <th className="px-5 py-3 text-center">Status</th>
                  <th className="px-5 py-3 text-right">Total</th>
                  <th className="px-5 py-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {paginated.map((sale) => {
                  const isSelected = selectedSale?.id === sale.id;
                  return (
                    <tr
                      key={sale.id}
                      onClick={() => {
                        setSelectedSale(sale);
                        setDetailModalOpen(true);
                      }}
                      className={cn(
                        "cursor-pointer transition-colors",
                        isSelected
                          ? "bg-[#87482D]/[0.045]"
                          : "hover:bg-zinc-50/80"
                      )}
                    >
                      <td className="px-5 py-3.5">
                        <span className="inline-flex items-center gap-2">
                          <span className="grid size-8 place-items-center rounded-lg bg-[#87482D]/8 text-[#87482D]">
                            <Receipt className="size-3.5" />
                          </span>
                          <span className="font-mono text-[11px] font-bold text-zinc-900">
                            {sale.invoiceNo}
                          </span>
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2.5">
                          <span className="grid size-8 shrink-0 place-items-center rounded-full bg-zinc-100 text-[10px] font-bold text-zinc-600">
                            {initials(sale.customer?.name ?? "Pelanggan Umum")}
                          </span>
                          <div className="min-w-0">
                            <p className="max-w-[12rem] truncate text-[13px] font-semibold text-zinc-800">
                              {sale.customer?.name ?? "Pelanggan Umum"}
                            </p>
                            {sale.customer?.phone && (
                              <p className="text-[10px] text-zinc-400">
                                {sale.customer.phone}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-[12px] text-zinc-500">
                        {new Date(sale.date).toLocaleDateString("id-ID", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </td>
                      <td className="px-5 py-3.5 text-[12px] text-zinc-500">
                        {sale.salesman?.name ?? "-"}
                      </td>
                      <td className="px-5 py-3.5 text-center">
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-semibold text-emerald-700">
                          <span className="size-1.5 rounded-full bg-emerald-500" />
                          Selesai
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-right text-[13px] font-bold tabular-nums text-zinc-900">
                        Rp {Number(sale.total).toLocaleString("id-ID")}
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <button
                          onClick={(event) => {
                            event.stopPropagation();
                            setSelectedSale(sale);
                            setDetailModalOpen(true);
                          }}
                          aria-label={`Lihat detail ${sale.invoiceNo}`}
                          className="grid size-9 place-items-center rounded-xl text-zinc-400 transition-colors hover:bg-[#87482D]/8 hover:text-[#87482D]"
                        >
                          <Eye className="size-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        <div className="flex flex-col items-center justify-between gap-3 border-t border-zinc-100 px-5 py-3.5 sm:flex-row">
          <p className="text-[11px] text-zinc-400">
            Menampilkan{" "}
            <strong className="font-semibold text-zinc-600">
              {filtered.length === 0
                ? 0
                : (currentPage - 1) * PAGE_SIZE + 1}
              –{Math.min(currentPage * PAGE_SIZE, filtered.length)}
            </strong>{" "}
            dari <strong className="font-semibold text-zinc-600">{filtered.length}</strong>{" "}
            transaksi
          </p>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              aria-label="Halaman sebelumnya"
              className="grid size-9 place-items-center rounded-lg text-zinc-500 transition-colors hover:bg-zinc-100 disabled:opacity-30"
            >
              <ChevronLeft className="size-4" />
            </button>
            {Array.from({ length: totalPages }, (_, index) => index + 1)
              .filter(
                (number) =>
                  number === 1 ||
                  number === totalPages ||
                  Math.abs(number - currentPage) <= 1
              )
              .map((number, index, list) => {
                const previous = list[index - 1];
                return (
                  <span key={number} className="flex items-center">
                    {previous && number - previous > 1 && (
                      <span className="px-1 text-[11px] text-zinc-300">
                        …
                      </span>
                    )}
                    <button
                      onClick={() => setPage(number)}
                      aria-label={`Halaman ${number}`}
                      aria-current={number === currentPage ? "page" : undefined}
                      className={cn(
                        "grid size-9 place-items-center rounded-lg text-[12px] font-semibold transition-colors",
                        number === currentPage
                          ? "bg-[#87482D] text-white shadow-sm shadow-[#87482D]/20"
                          : "text-zinc-500 hover:bg-zinc-100"
                      )}
                    >
                      {number}
                    </button>
                  </span>
                );
              })}
            <button
              onClick={() =>
                setPage(Math.min(totalPages, currentPage + 1))
              }
              disabled={currentPage === totalPages}
              aria-label="Halaman berikutnya"
              className="grid size-9 place-items-center rounded-lg text-zinc-500 transition-colors hover:bg-zinc-100 disabled:opacity-30"
            >
              <ChevronRight className="size-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Create modal */}
      <Dialog
        open={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title="Kasir / Faktur Penjualan Baru"
        description="Harga jual mengikuti batch FIFO yang tersimpan saat pembelian."
        className="max-w-3xl"
      >
        <div className="space-y-5">
          {error && (
            <div className="flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 p-3 text-[13px] text-red-700">
              <AlertCircle className="mt-0.5 size-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="customerId">Pelanggan</Label>
              <Select
                id="customerId"
                value={customerId}
                onChange={(event) => setCustomerId(event.target.value)}
              >
                <option value="">Umum / Non-Member</option>
                {customers.map((customer) => (
                  <option key={customer.id} value={customer.id}>
                    {customer.name}
                    {customer.phone ? ` (${customer.phone})` : ""}
                  </option>
                ))}
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="salesmanId">Salesman (opsional)</Label>
              <Select
                id="salesmanId"
                value={salesmanId}
                onChange={(event) => setSalesmanId(event.target.value)}
              >
                <option value="">Tidak ada</option>
                {salesmen.map((salesman) => (
                  <option key={salesman.id} value={salesman.id}>
                    {salesman.name}
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
                onChange={(event) => setSaleDate(event.target.value)}
              />
            </div>
          </div>

          {hasMissingPrice && (
            <div className="flex items-start gap-2.5 rounded-xl border border-amber-200 bg-amber-50 p-3 text-[12px] text-amber-800">
              <AlertCircle className="mt-0.5 size-4 shrink-0" />
              <span>
                Sebagian batch belum memiliki harga jual. Isi harga melalui
                Faktur Pembelian terlebih dahulu agar stok tersebut bisa dijual.
              </span>
            </div>
          )}

          <div className="overflow-hidden rounded-2xl border border-zinc-200">
            <div className="flex items-center justify-between gap-3 border-b border-zinc-200 bg-zinc-50/80 px-4 py-3">
              <span className="text-[11px] font-bold uppercase tracking-[0.1em] text-zinc-500">
                Keranjang Belanja
              </span>
              <span className="flex items-center gap-1.5 text-[10px] text-zinc-400">
                <Layers className="size-3.5" />
                Harga otomatis per batch FIFO
              </span>
            </div>

            <div className="max-h-[360px] space-y-2.5 overflow-y-auto p-3">
              {cart.map((item, index) => {
                const product = products.find(
                  (entry) => entry.id === Number(item.productId)
                );
                const availableUnits = product
                  ? [product.baseUnit, ...product.units.map((unit) => unit.unit)]
                  : [];
                const totalStock = product
                  ? product.batches.reduce(
                      (sum, batch) => sum + Number(batch.qtyRemaining),
                      0
                    )
                  : 0;
                const subtotal =
                  (Number(item.qty) || 0) * (Number(item.unitPrice) || 0);
                const unitLabel =
                  availableUnits.find((unit) => unit.id === item.unitId)?.code ??
                  product?.baseUnit.code ??
                  "";

                return (
                  <div
                    key={index}
                    className="rounded-xl border border-zinc-200/80 bg-white p-3"
                  >
                    <div className="flex flex-wrap items-end gap-2.5 sm:grid sm:grid-cols-[minmax(0,1fr)_84px_126px_120px_110px_36px] sm:items-end">
                      <div className="min-w-[180px] flex-1 sm:min-w-0">
                        <Label className="mb-1.5 block text-[10px] text-zinc-400 sm:hidden">
                          Produk
                        </Label>
                        <Select
                          value={item.productId.toString()}
                          onChange={(event) =>
                            handleProductChange(
                              index,
                              Number(event.target.value)
                            )
                          }
                          className="h-10 text-xs"
                        >
                          {products.map((entry) => {
                            const stock = entry.batches.reduce(
                              (sum, batch) => sum + Number(batch.qtyRemaining),
                              0
                            );
                            return (
                              <option key={entry.id} value={entry.id}>
                                {entry.name} · sisa {stock} {entry.baseUnit.code}
                              </option>
                            );
                          })}
                        </Select>
                        <p className="mt-1 text-[10px] text-zinc-400">
                          Stok gudang:{" "}
                          <strong
                            className={cn(
                              "font-semibold",
                              totalStock > 0
                                ? "text-emerald-600"
                                : "text-red-500"
                            )}
                          >
                            {totalStock} {product?.baseUnit.code}
                          </strong>
                        </p>
                      </div>

                      <div className="w-[84px]">
                        <Label className="mb-1.5 block text-[10px] text-zinc-400 sm:hidden">
                          Satuan
                        </Label>
                        <Select
                          value={item.unitId.toString()}
                          onChange={(event) =>
                            handleUnitChange(index, Number(event.target.value))
                          }
                          className="h-10 text-xs"
                        >
                          {availableUnits.map((unit) => (
                            <option key={unit.id} value={unit.id}>
                              {unit.code}
                            </option>
                          ))}
                        </Select>
                      </div>

                      <div className="w-[126px]">
                        <Label className="mb-1.5 block text-[10px] text-zinc-400 sm:hidden">
                          Qty
                        </Label>
                        <div className="flex h-10 items-center rounded-xl border border-zinc-200 bg-white shadow-xs">
                          <button
                            type="button"
                            onClick={() =>
                              handleQtyChange(index, item.qty - 1)
                            }
                            aria-label="Kurangi qty"
                            className="grid h-9 w-9 place-items-center rounded-l-xl text-zinc-400 transition-colors hover:bg-zinc-50 hover:text-zinc-700"
                          >
                            <Minus className="size-3.5" />
                          </button>
                          <input
                            type="number"
                            min={1}
                            value={item.qty || ""}
                            onChange={(event) =>
                              handleQtyChange(index, Number(event.target.value))
                            }
                            className="h-full w-10 border-0 bg-transparent text-center text-xs font-semibold text-zinc-900 outline-none"
                          />
                          <button
                            type="button"
                            onClick={() =>
                              handleQtyChange(index, item.qty + 1)
                            }
                            aria-label="Tambah qty"
                            className="grid h-9 w-9 place-items-center rounded-r-xl text-zinc-400 transition-colors hover:bg-zinc-50 hover:text-zinc-700"
                          >
                            <Plus className="size-3.5" />
                          </button>
                        </div>
                      </div>

                      <div className="w-[120px] text-right">
                        <p className="text-[10px] text-zinc-400">
                          Harga / {unitLabel}
                        </p>
                        <p
                          className={cn(
                            "text-[12px] font-semibold",
                            item.unitPrice > 0
                              ? "text-zinc-800"
                              : "text-red-500"
                          )}
                        >
                          {item.unitPrice > 0
                            ? `Rp ${Number(item.unitPrice).toLocaleString("id-ID")}`
                            : "Belum diatur"}
                        </p>
                      </div>

                      <div className="w-[110px] text-right">
                        <p className="text-[10px] text-zinc-400">Subtotal</p>
                        <p className="text-[12px] font-bold tabular-nums text-zinc-900">
                          Rp {subtotal.toLocaleString("id-ID")}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => removeRow(index)}
                        disabled={cart.length <= 1}
                        aria-label="Hapus baris"
                        className="grid size-9 place-items-center justify-self-end rounded-lg text-zinc-300 transition-colors hover:bg-red-50 hover:text-red-600 disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-zinc-300"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex flex-col gap-3 border-t border-zinc-200 bg-zinc-50/80 p-3 sm:flex-row sm:items-center sm:justify-between">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addRow}
              >
                <Plus className="size-3.5" />
                Tambah Barang
              </Button>
              <div className="flex items-baseline justify-between gap-2 sm:justify-end">
                <span className="text-[11px] font-medium text-zinc-500">
                  Total Tagihan
                </span>
                <span className="font-display text-xl font-bold text-[#87482D]">
                  Rp {grandTotal.toLocaleString("id-ID")}
                </span>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2.5 border-t border-zinc-100 pt-4">
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
              disabled={isPending || hasMissingPrice}
              title={
                hasMissingPrice
                  ? "Lengkapi harga batch terlebih dahulu"
                  : undefined
              }
            >
              {isPending ? "Memproses..." : "Proses & Simpan"}
            </Button>
          </div>
        </div>
      </Dialog>

      {/* Detail modal */}
      {selectedSale && (
        <Dialog
          open={detailModalOpen}
          onClose={() => setDetailModalOpen(false)}
          title={`Detail Faktur ${selectedSale.invoiceNo}`}
          description={new Date(selectedSale.date).toLocaleDateString("id-ID", {
            weekday: "long",
            day: "numeric",
            month: "long",
            year: "numeric",
          })}
          className="max-w-3xl"
        >
          <div className="space-y-4">
            <div className="grid gap-3 rounded-2xl border border-zinc-200/70 bg-zinc-50/70 p-4 sm:grid-cols-3">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-zinc-400">
                  Pelanggan
                </p>
                <p className="mt-1 flex items-center gap-1.5 text-[13px] font-semibold text-zinc-800">
                  <UserRound className="size-3.5 text-zinc-400" />
                  {selectedSale.customer?.name ?? "Pelanggan Umum"}
                </p>
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-zinc-400">
                  Salesman
                </p>
                <p className="mt-1 text-[13px] font-semibold text-zinc-800">
                  {selectedSale.salesman?.name ?? "-"}
                </p>
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-zinc-400">
                  Status
                </p>
                <p className="mt-1 inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-semibold text-emerald-700">
                  <CheckCircle2 className="size-3" />
                  Selesai
                </p>
              </div>
            </div>

            <div className="space-y-3">
              {selectedSale.items.map((item) => (
                <div
                  key={item.id}
                  className="overflow-hidden rounded-2xl border border-zinc-200/70"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 bg-zinc-50/70 px-4 py-3">
                    <div>
                      <p className="text-[13px] font-semibold text-zinc-900">
                        {item.product.name}
                      </p>
                      <p className="text-[10px] text-zinc-400">
                        {item.product.code}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-[12px] font-semibold text-zinc-700">
                        {Number(item.qty)} {item.unit.code}
                      </p>
                      <p className="text-[10px] text-zinc-400">
                        Rp {Number(item.subtotal).toLocaleString("id-ID")}
                      </p>
                    </div>
                  </div>
                  <div className="space-y-1.5 p-3">
                    {item.allocations.map((allocation) => (
                      <div
                        key={allocation.id}
                        className="flex flex-wrap items-center gap-2 rounded-xl bg-zinc-50 px-3 py-2 text-[11px]"
                      >
                        <span className="font-mono font-bold text-[#87482D]">
                          Batch #{allocation.batchId}
                        </span>
                        <span className="text-zinc-500">
                          {Number(allocation.qtyBase)}{" "}
                          {item.product.baseUnit.code}
                        </span>
                        <span className="text-[10px] text-zinc-400">
                          Modal @Rp{" "}
                          {Number(allocation.costPerBase).toLocaleString(
                            "id-ID"
                          )}
                        </span>
                        <span className="ml-auto font-semibold text-emerald-700">
                          Jual @Rp{" "}
                          {Number(allocation.pricePerBase).toLocaleString(
                            "id-ID"
                          )}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between rounded-2xl bg-[#87482D] px-4 py-3.5 text-white">
              <span className="text-[13px] font-medium text-white/70">
                Total Pembayaran
              </span>
              <span className="font-display text-lg font-bold">
                Rp {Number(selectedSale.total).toLocaleString("id-ID")}
              </span>
            </div>

            <div className="flex justify-between">
              <Button
                variant="ghost"
                onClick={() => setDetailModalOpen(false)}
              >
                Tutup
              </Button>
              <Button
                variant="outline"
                onClick={() => router.push("/transactions/sales")}
              >
                Buka Halaman Kasir
                <ArrowUpRight className="size-4" />
              </Button>
            </div>
          </div>
        </Dialog>
      )}
    </div>
  );
}
