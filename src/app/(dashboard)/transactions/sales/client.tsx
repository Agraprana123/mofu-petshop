"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  Ban,
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Eye,
  Layers,
  Loader2,
  Minus,
  Plus,
  Receipt,
  RotateCcw,
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
import { ProductPicker } from "@/components/product-picker";
import {
  cancelSaleAction,
  completeSaleAction,
  createSaleAction,
} from "@/server/actions/sales.action";
import { getSaleStatusMeta } from "@/lib/sale-status";
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
  sellPrice: string | null;
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
  subtotal: string;
  discountAmount: string;
  taxAmount: string;
  total: string;
  paymentStatus: string;
  customer: { name: string; phone: string | null } | null;
  salesman: { name: string } | null;
  items: SaleItemDetail[];
}

type AdjustmentType = "NOMINAL" | "PERCENT";

interface CartItem {
  productId: number;
  unitId: number;
  qty: number;
  unitPrice: number;
}

/** Baris kosong: kasir diarahkan mencari & memilih barang terlebih dahulu. */
function emptyCartItem(): CartItem {
  return { productId: 0, unitId: 0, qty: 1, unitPrice: 0 };
}

type RangeFilter = "ALL" | "TODAY" | "WEEK";

type StatusFilter = "ALL" | "PAID" | "UNPAID" | "PARTIAL" | "CANCELLED";

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

/** Input rupiah: hanya angka, tampil dengan pemisah ribuan. */
function MoneyInput({
  value,
  onChange,
  ariaLabel,
  placeholder = "0",
  className,
  disabled = false,
}: {
  value: number;
  onChange: (value: number) => void;
  ariaLabel: string;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}) {
  return (
    <input
      type="text"
      inputMode="numeric"
      autoComplete="off"
      aria-label={ariaLabel}
      disabled={disabled}
      value={value > 0 ? Math.round(value).toLocaleString("id-ID") : ""}
      placeholder={placeholder}
      onFocus={(event) => event.currentTarget.select()}
      onChange={(event) => {
        const digits = event.target.value.replace(/\D/g, "").slice(0, 12);
        onChange(digits ? Number(digits) : 0);
      }}
      className={cn(
        "h-9 w-full rounded-lg border border-zinc-200 bg-white px-2.5 text-xs font-semibold tabular-nums text-zinc-900 outline-none transition-all placeholder:text-zinc-300 focus:border-[#87482D] focus:bg-white focus:ring-4 focus:ring-[#87482D]/12 disabled:cursor-not-allowed disabled:bg-zinc-50 disabled:text-zinc-400",
        className
      )}
    />
  );
}

/** Input persen (0–100) untuk diskon/pajak. */
function PercentInput({
  value,
  onChange,
  ariaLabel,
  className,
}: {
  value: number;
  onChange: (value: number) => void;
  ariaLabel: string;
  className?: string;
}) {
  const [focused, setFocused] = useState(false);
  const [draft, setDraft] = useState("");

  return (
    <div className={cn("relative", className)}>
      <input
        type="text"
        inputMode="decimal"
        aria-label={ariaLabel}
        value={focused ? draft : value > 0 ? String(value) : ""}
        placeholder="0"
        onFocus={() => {
          setFocused(true);
          setDraft(value > 0 ? String(value) : "");
        }}
        onChange={(event) => {
          const raw = event.target.value.replace(/[^0-9.,]/g, "").replace(",", ".");
          setDraft(raw);
          const next = parseFloat(raw);
          onChange(Number.isFinite(next) ? Math.min(100, Math.max(0, next)) : 0);
        }}
        onBlur={() => {
          setFocused(false);
        }}
        className="h-9 w-full rounded-lg border border-zinc-200 bg-white pl-2.5 pr-6 text-right text-xs font-semibold tabular-nums text-zinc-900 outline-none transition-all placeholder:text-zinc-300 focus:border-[#87482D] focus:bg-white focus:ring-4 focus:ring-[#87482D]/12"
      />
      <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-semibold text-zinc-400">
        %
      </span>
    </div>
  );
}

function AdjustmentTypeToggle({
  value,
  onChange,
}: {
  value: AdjustmentType;
  onChange: (value: AdjustmentType) => void;
}) {
  const options: { id: AdjustmentType; label: string }[] = [
    { id: "NOMINAL", label: "Rp" },
    { id: "PERCENT", label: "%" },
  ];

  return (
    <div className="inline-flex overflow-hidden rounded-lg border border-zinc-200 bg-white p-0.5">
      {options.map((option) => (
        <button
          key={option.id}
          type="button"
          onClick={() => onChange(option.id)}
          aria-pressed={value === option.id}
          className={cn(
            "rounded-md px-2 py-0.5 text-[10px] font-bold transition-colors",
            value === option.id
              ? "bg-[#87482D] text-white"
              : "text-zinc-400 hover:text-[#87482D]"
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
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
  const [status, setStatus] = useState<StatusFilter>("ALL");
  const [page, setPage] = useState(1);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedSale, setSelectedSale] = useState<SaleRecord | null>(null);
  const [detailAction, setDetailAction] = useState<"COMPLETE" | "CANCEL" | null>(
    null
  );
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [confirmComplete, setConfirmComplete] = useState(false);
  const [detailError, setDetailError] = useState("");
  const [error, setError] = useState("");

  const [customerId, setCustomerId] = useState<string>("");
  const [salesmanId, setSalesmanId] = useState<string>("");
  const [saleDate, setSaleDate] = useState(
    new Date().toISOString().slice(0, 10)
  );
  const [cart, setCart] = useState<CartItem[]>([]);
  const [discountType, setDiscountType] = useState<AdjustmentType>("NOMINAL");
  const [discountValue, setDiscountValue] = useState(0);
  const [taxType, setTaxType] = useState<AdjustmentType>("PERCENT");
  const [taxValue, setTaxValue] = useState(0);

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

  const rangeScoped = useMemo(() => {
    return sales.filter((sale) => {
      const saleDateValue = new Date(sale.date);
      return (
        range === "ALL" ||
        (range === "TODAY" && isSameDay(saleDateValue, now)) ||
        (range === "WEEK" && saleDateValue >= weekStart)
      );
    });
  }, [sales, range, now, weekStart]);

  const statusCounts = useMemo(() => {
    const counts: Record<StatusFilter, number> = {
      ALL: rangeScoped.length,
      PAID: 0,
      UNPAID: 0,
      PARTIAL: 0,
      CANCELLED: 0,
    };

    for (const sale of rangeScoped) {
      if (sale.paymentStatus in counts) {
        counts[sale.paymentStatus as StatusFilter] += 1;
      }
    }

    return counts;
  }, [rangeScoped]);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();

    return rangeScoped.filter((sale) => {
      if (status !== "ALL" && sale.paymentStatus !== status) return false;
      if (!query) return true;

      return (
        sale.invoiceNo.toLowerCase().includes(query) ||
        (sale.customer?.name.toLowerCase().includes(query) ?? false) ||
        (sale.salesman?.name.toLowerCase().includes(query) ?? false)
      );
    });
  }, [rangeScoped, search, status]);

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

    const pricePerBase = activeBatch
      ? Number(activeBatch.sellPricePerBase) > 0
        ? Number(activeBatch.sellPricePerBase)
        : Number(prod.sellPrice ?? 0)
      : Number(prod.sellPrice ?? 0);
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
    setDiscountType("NOMINAL");
    setDiscountValue(0);
    setTaxType("PERCENT");
    setTaxValue(0);

    setCart(products.length > 0 ? [emptyCartItem()] : []);
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
    updated[index].qty = Math.max(0, qty);
    setCart(updated);
  }

  function handlePriceChange(index: number, unitPrice: number) {
    const updated = [...cart];
    updated[index].unitPrice = Math.max(0, unitPrice);
    setCart(updated);
  }

  function resetPrice(index: number) {
    const item = cart[index];
    const prod = products.find((p) => p.id === item.productId);
    if (!prod) return;

    const updated = [...cart];
    updated[index].unitPrice = getUnitPrice(prod, item.unitId);
    setCart(updated);
  }

  function addRow() {
    setCart([...cart, emptyCartItem()]);
  }

  function removeRow(index: number) {
    if (cart.length <= 1) return;
    setCart(cart.filter((_, i) => i !== index));
  }

  const subtotal = cart.reduce(
    (sum, item) =>
      sum + (Number(item.qty) || 0) * (Number(item.unitPrice) || 0),
    0
  );
  const discountAmount =
    discountType === "PERCENT"
      ? Math.round((subtotal * Math.min(100, Math.max(0, discountValue))) / 100)
      : Math.min(subtotal, Math.max(0, Math.round(discountValue)));
  const taxableBase = Math.max(0, subtotal - discountAmount);
  const taxAmount =
    taxType === "PERCENT"
      ? Math.round((taxableBase * Math.min(100, Math.max(0, taxValue))) / 100)
      : Math.max(0, Math.round(taxValue));
  const grandTotal = taxableBase + taxAmount;

  const totalQty = cart.reduce((sum, item) => sum + (Number(item.qty) || 0), 0);
  const hasUnselectedItems = cart.some((item) => !item.productId);
  const hasMissingPrice = cart.some(
    (item) => item.productId > 0 && Number(item.unitPrice) <= 0
  );

  function handleSubmitSale() {
    setError("");
    if (cart.length === 0) {
      setError("Keranjang belanja kosong.");
      return;
    }
    if (cart.some((item) => !item.productId || item.qty <= 0)) {
      setError("Pilih barang dan pastikan qty lebih dari 0 pada setiap baris.");
      return;
    }
    if (hasMissingPrice) {
      setError(
        "Masih ada barang dengan harga Rp 0. Isi harga jualnya terlebih dahulu."
      );
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
          unitPrice: Number(item.unitPrice),
        })),
        discount: { type: discountType, value: discountValue },
        tax: { type: taxType, value: taxValue },
      });

      if (res.error) {
        setError(res.error);
      } else {
        setCreateModalOpen(false);
        router.refresh();
      }
    });
  }

  function openDetail(sale: SaleRecord) {
    setSelectedSale(sale);
    setDetailError("");
    setConfirmCancel(false);
    setConfirmComplete(false);
    setDetailModalOpen(true);
  }

  function closeDetail() {
    setDetailModalOpen(false);
    setConfirmCancel(false);
    setConfirmComplete(false);
    setDetailError("");
  }

  function handleCompleteSale() {
    if (!selectedSale) return;
    const saleId = selectedSale.id;

    setDetailError("");
    setDetailAction("COMPLETE");
    startTransition(async () => {
      const res = await completeSaleAction(saleId);
      setDetailAction(null);

      if (res.error) {
        setDetailError(res.error);
        return;
      }

      setConfirmComplete(false);
      setDetailModalOpen(false);
      router.refresh();
    });
  }

  function requestCompleteSale() {
    if (!selectedSale) return;

    // Faktur batal perlu konfirmasi karena stok akan dipotong kembali.
    if (selectedSale.paymentStatus === "CANCELLED") {
      setDetailError("");
      setConfirmCancel(false);
      setConfirmComplete(true);
      return;
    }

    handleCompleteSale();
  }

  function handleCancelSale() {
    if (!selectedSale) return;
    const saleId = selectedSale.id;

    setDetailError("");
    setDetailAction("CANCEL");
    startTransition(async () => {
      const res = await cancelSaleAction(saleId);
      setDetailAction(null);

      if (res.error) {
        setDetailError(res.error);
        return;
      }

      setConfirmCancel(false);
      setDetailModalOpen(false);
      router.refresh();
    });
  }

  const rangeTabs: { id: RangeFilter; label: string; count: number }[] = [
    { id: "ALL", label: "Semua", count: counts.ALL },
    { id: "TODAY", label: "Hari Ini", count: counts.TODAY },
    { id: "WEEK", label: "7 Hari Terakhir", count: counts.WEEK },
  ];

  const statusTabs: { id: StatusFilter; label: string; count: number }[] = [
    { id: "ALL", label: "Semua Status", count: statusCounts.ALL },
    { id: "PAID", label: "Selesai", count: statusCounts.PAID },
    { id: "CANCELLED", label: "Dibatalkan", count: statusCounts.CANCELLED },
  ];

  const detailStatus = selectedSale
    ? getSaleStatusMeta(selectedSale.paymentStatus)
    : null;
  const detailIsCancelled = selectedSale?.paymentStatus === "CANCELLED";
  const detailIsPaid = selectedSale?.paymentStatus === "PAID";
  const detailQty =
    selectedSale?.items.reduce((sum, item) => sum + Number(item.qty), 0) ?? 0;

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
              .filter(
                (sale) =>
                  sale.paymentStatus !== "CANCELLED" &&
                  isSameDay(new Date(sale.date), now)
              )
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

          {/* Filter status faktur */}
          <div className="flex flex-wrap items-center gap-1.5 px-4 pb-3 pt-1">
            <span className="mr-1 text-[10px] font-bold uppercase tracking-[0.12em] text-zinc-400">
              Status
            </span>
            {statusTabs.map((tab) => {
              const meta = tab.id === "ALL" ? null : getSaleStatusMeta(tab.id);
              const isActive = status === tab.id;

              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => {
                    setStatus(tab.id);
                    setPage(1);
                  }}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold transition-colors",
                    isActive
                      ? "border-[#87482D]/30 bg-[#87482D]/10 text-[#87482D]"
                      : "border-zinc-200 bg-white text-zinc-500 hover:border-zinc-300 hover:bg-zinc-50"
                  )}
                >
                  {meta && (
                    <span
                      className={cn("size-1.5 rounded-full", meta.dotClass)}
                    />
                  )}
                  {tab.label}
                  <span
                    className={cn(
                      "rounded-full px-1.5 py-0.5 text-[10px] tabular-nums",
                      isActive
                        ? "bg-[#87482D]/12 text-[#87482D]"
                        : "bg-zinc-100 text-zinc-400"
                    )}
                  >
                    {tab.count}
                  </span>
                </button>
              );
            })}
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
              {status === "ALL"
                ? "Coba ubah filter atau buat faktur penjualan baru."
                : `Tidak ada faktur dengan status ${
                    statusTabs.find((tab) => tab.id === status)?.label ??
                    status
                  } pada periode ini.`}
            </p>
            {(status !== "ALL" || search.trim() !== "") && (
              <Button
                variant="outline"
                size="sm"
                className="mt-4"
                onClick={() => {
                  setStatus("ALL");
                  setSearch("");
                  setPage(1);
                }}
              >
                <RotateCcw className="size-3.5" />
                Reset filter
              </Button>
            )}
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
                  const status = getSaleStatusMeta(sale.paymentStatus);
                  const isCancelled = sale.paymentStatus === "CANCELLED";

                  return (
                    <tr
                      key={sale.id}
                      onClick={() => openDetail(sale)}
                      className={cn(
                        "cursor-pointer transition-colors",
                        isSelected
                          ? "bg-[#87482D]/[0.045]"
                          : "hover:bg-zinc-50/80",
                        isCancelled && "bg-red-50/25 hover:bg-red-50/40"
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
                        <span
                          className={cn(
                            "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-semibold",
                            status.badgeClass
                          )}
                        >
                          <span
                            className={cn(
                              "size-1.5 rounded-full",
                              status.dotClass
                            )}
                          />
                          {status.label}
                        </span>
                      </td>
                      <td
                        className={cn(
                          "px-5 py-3.5 text-right text-[13px] font-bold tabular-nums",
                          isCancelled
                            ? "text-zinc-400 line-through decoration-zinc-300"
                            : "text-zinc-900"
                        )}
                      >
                        Rp {Number(sale.total).toLocaleString("id-ID")}
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <button
                          onClick={(event) => {
                            event.stopPropagation();
                            openDetail(sale);
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
        description="Harga otomatis dari batch FIFO dan bisa diubah. Diskon serta pajak dihitung otomatis."
        className="max-w-4xl"
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
                Sebagian produk belum memiliki harga jual. Isi harga secara
                manual pada kolom <strong>Harga</strong>, atau atur harga jual
                di Master Produk / Faktur Pembelian.
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
                const lineTotal =
                  (Number(item.qty) || 0) * (Number(item.unitPrice) || 0);
                const unitLabel =
                  availableUnits.find((unit) => unit.id === item.unitId)?.code ??
                  product?.baseUnit.code ??
                  "";
                const autoPrice = product
                  ? getUnitPrice(product, item.unitId)
                  : 0;
                const isManualPrice = item.unitPrice !== autoPrice;

                return (
                  <div
                    key={index}
                    className="rounded-xl border border-zinc-200/80 bg-white p-3"
                  >
                    <div className="mb-2.5 flex items-center justify-between gap-2">
                      <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.08em] text-zinc-400">
                        <span className="grid size-5 place-items-center rounded-md bg-[#87482D]/10 text-[10px] tabular-nums text-[#87482D]">
                          {index + 1}
                        </span>
                        Barang
                      </span>
                      <button
                        type="button"
                        onClick={() => removeRow(index)}
                        disabled={cart.length <= 1}
                        aria-label="Hapus baris"
                        className="grid size-8 place-items-center rounded-lg text-zinc-300 transition-colors hover:bg-red-50 hover:text-red-600 disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-zinc-300"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </div>

                    <div className="min-w-0">
                      <Label className="mb-1.5 block text-[10px] text-zinc-400">
                        Produk <span className="text-red-500">*</span>
                      </Label>
                      <ProductPicker
                        products={products.map((entry) => ({
                          id: entry.id,
                          name: entry.name,
                          code: entry.code,
                          category: entry.category,
                          baseUnit: entry.baseUnit,
                          stock: entry.batches.reduce(
                            (sum, batch) =>
                              sum + Number(batch.qtyRemaining),
                            0
                          ),
                        }))}
                        value={item.productId}
                        onChange={(productId) =>
                          handleProductChange(index, productId)
                        }
                        allowOutOfStock={false}
                      />
                      <p className="mt-1.5 flex items-center gap-1.5 text-[10px] text-zinc-400">
                        <Layers className="size-3" />
                        {product ? (
                          <>
                            Stok gudang:
                            <strong
                              className={cn(
                                "font-semibold",
                                totalStock > 0
                                  ? "text-emerald-600"
                                  : "text-red-500"
                              )}
                            >
                              {totalStock} {product.baseUnit.code}
                            </strong>
                          </>
                        ) : (
                          "Cari dan pilih barang untuk melihat stok."
                        )}
                      </p>
                    </div>

                    <div className="mt-3 grid grid-cols-2 gap-2.5 sm:grid-cols-[88px_132px_minmax(0,1fr)_120px] sm:items-end">
                      <div>
                        <Label className="mb-1.5 block text-[10px] text-zinc-400">
                          Satuan
                        </Label>
                        <Select
                          value={item.unitId ? item.unitId.toString() : ""}
                          onChange={(event) =>
                            handleUnitChange(index, Number(event.target.value))
                          }
                          disabled={!product}
                          className="h-10 text-xs"
                        >
                          {!product && <option value="">Pilih barang</option>}
                          {availableUnits.map((unit) => (
                            <option key={unit.id} value={unit.id}>
                              {unit.code}
                            </option>
                          ))}
                        </Select>
                      </div>

                      <div>
                        <Label className="mb-1.5 block text-[10px] text-zinc-400">
                          Qty
                        </Label>
                        <div className="flex h-10 items-center rounded-xl border border-zinc-200 bg-white shadow-xs">
                          <button
                            type="button"
                            onClick={() =>
                              handleQtyChange(index, Math.max(1, (item.qty || 1) - 1))
                            }
                            aria-label="Kurangi qty"
                            className="grid h-9 w-9 place-items-center rounded-l-xl text-zinc-400 transition-colors hover:bg-zinc-50 hover:text-zinc-700"
                          >
                            <Minus className="size-3.5" />
                          </button>
                          <input
                            type="number"
                            min={1}
                            value={item.qty === 0 ? "" : item.qty}
                            onChange={(event) =>
                              handleQtyChange(index, Number(event.target.value))
                            }
                            onBlur={() => {
                              if (!item.qty || item.qty < 1) {
                                handleQtyChange(index, 1);
                              }
                            }}
                            className="h-full min-w-0 flex-1 border-0 bg-transparent text-center text-xs font-semibold text-zinc-900 outline-none"
                          />
                          <button
                            type="button"
                            onClick={() =>
                              handleQtyChange(index, (item.qty || 0) + 1)
                            }
                            aria-label="Tambah qty"
                            className="grid h-9 w-9 place-items-center rounded-r-xl text-zinc-400 transition-colors hover:bg-zinc-50 hover:text-zinc-700"
                          >
                            <Plus className="size-3.5" />
                          </button>
                        </div>
                      </div>

                      <div>
                        <div className="mb-1.5 flex items-center justify-between gap-1">
                          <Label className="text-[10px] text-zinc-400">
                            Harga / {unitLabel}
                          </Label>
                          {isManualPrice && (
                            <button
                              type="button"
                              onClick={() => resetPrice(index)}
                              title="Kembalikan ke harga otomatis FIFO"
                              className="flex shrink-0 items-center gap-0.5 rounded bg-amber-50 px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wide text-amber-700 transition-colors hover:bg-amber-100"
                            >
                              <RotateCcw className="size-2.5" />
                              Manual
                            </button>
                          )}
                        </div>
                        <div className="relative">
                          <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-[10px] font-semibold text-zinc-400">
                            Rp
                          </span>
                          <MoneyInput
                            ariaLabel={`Harga satuan ${product?.name ?? ""}`}
                            value={item.unitPrice}
                            onChange={(value) =>
                              handlePriceChange(index, value)
                            }
                            disabled={!product}
                            className={cn(
                              "h-10 pl-8 text-left text-xs",
                              item.unitPrice <= 0 &&
                                "border-red-200 bg-red-50/40 text-red-600"
                            )}
                          />
                        </div>
                      </div>

                      <div className="text-right">
                        <p className="mb-1.5 text-[10px] text-zinc-400">
                          Subtotal
                        </p>
                        <p className="flex h-10 items-center justify-end text-sm font-bold tabular-nums text-zinc-900">
                          Rp {lineTotal.toLocaleString("id-ID")}
                        </p>
                      </div>
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
              <span className="text-[10px] text-zinc-400">
                {cart.length} barang · {totalQty} qty
              </span>
            </div>
          </div>

          {/* Ringkasan pembayaran: subtotal, diskon, pajak, total */}
          <div className="overflow-hidden rounded-2xl border border-zinc-200">
            <div className="flex items-center justify-between border-b border-zinc-200 bg-zinc-50/80 px-4 py-3">
              <span className="text-[11px] font-bold uppercase tracking-[0.1em] text-zinc-500">
                Ringkasan Pembayaran
              </span>
              <span className="flex items-center gap-1.5 text-[10px] text-zinc-400">
                <Wallet className="size-3.5" />
                Pajak dihitung setelah diskon
              </span>
            </div>

            <div className="space-y-2.5 p-4">
              <div className="flex items-center justify-between text-xs">
                <span className="text-zinc-500">Subtotal barang</span>
                <span className="font-semibold tabular-nums text-zinc-800">
                  Rp {subtotal.toLocaleString("id-ID")}
                </span>
              </div>

              <div className="flex flex-col gap-2 border-t border-dashed border-zinc-200 pt-2.5 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-zinc-500">Diskon</span>
                  <AdjustmentTypeToggle
                    value={discountType}
                    onChange={(value) => {
                      setDiscountType(value);
                      setDiscountValue(0);
                    }}
                  />
                  {discountType === "PERCENT" && discountValue > 0 && (
                    <span className="text-[10px] text-zinc-400">
                      {discountValue}% dari subtotal
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 sm:justify-end">
                  <div className="w-32">
                    {discountType === "PERCENT" ? (
                      <PercentInput
                        ariaLabel="Diskon dalam persen"
                        value={discountValue}
                        onChange={setDiscountValue}
                      />
                    ) : (
                      <MoneyInput
                        ariaLabel="Diskon dalam rupiah"
                        value={discountValue}
                        onChange={setDiscountValue}
                        className="h-9 text-right"
                      />
                    )}
                  </div>
                  <span className="w-28 text-right text-xs font-semibold tabular-nums text-red-600">
                    −Rp {discountAmount.toLocaleString("id-ID")}
                  </span>
                </div>
              </div>

              <div className="flex flex-col gap-2 border-t border-dashed border-zinc-200 pt-2.5 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-zinc-500">Pajak / PPN</span>
                  <AdjustmentTypeToggle
                    value={taxType}
                    onChange={(value) => {
                      setTaxType(value);
                      setTaxValue(0);
                    }}
                  />
                  {taxType === "PERCENT" && taxValue > 0 && (
                    <span className="text-[10px] text-zinc-400">
                      {taxValue}% dari DPP
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 sm:justify-end">
                  <div className="w-32">
                    {taxType === "PERCENT" ? (
                      <PercentInput
                        ariaLabel="Pajak dalam persen"
                        value={taxValue}
                        onChange={setTaxValue}
                      />
                    ) : (
                      <MoneyInput
                        ariaLabel="Pajak dalam rupiah"
                        value={taxValue}
                        onChange={setTaxValue}
                        className="h-9 text-right"
                      />
                    )}
                  </div>
                  <span className="w-28 text-right text-xs font-semibold tabular-nums text-emerald-700">
                    +Rp {taxAmount.toLocaleString("id-ID")}
                  </span>
                </div>
              </div>

              <div className="flex items-end justify-between gap-3 border-t border-zinc-200 pt-3">
                <div>
                  <span className="text-[13px] font-semibold text-zinc-700">
                    Total Tagihan
                  </span>
                  <p className="text-[10px] text-zinc-400">
                    {discountAmount > 0 || taxAmount > 0
                      ? `DPP Rp ${taxableBase.toLocaleString("id-ID")}`
                      : "Belum termasuk penyesuaian"}
                  </p>
                </div>
                <span className="font-display text-2xl font-bold tabular-nums text-[#87482D]">
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
              disabled={isPending || hasMissingPrice || hasUnselectedItems}
              title={
                hasUnselectedItems
                  ? "Pilih barang pada setiap baris terlebih dahulu"
                  : hasMissingPrice
                    ? "Isi harga jual barang terlebih dahulu"
                    : undefined
              }
            >
              {isPending ? "Memproses..." : "Proses & Simpan"}
            </Button>
          </div>
        </div>
      </Dialog>

      {/* Detail modal */}
      {selectedSale && detailStatus && (
        <Dialog
          open={detailModalOpen}
          onClose={closeDetail}
          title={`Faktur ${selectedSale.invoiceNo}`}
          description="Detail transaksi penjualan"
          className="max-w-4xl"
        >
          <div className="space-y-5">
            {detailIsCancelled && (
              <div className="flex items-start gap-2.5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3">
                <Ban className="mt-0.5 size-4 shrink-0 text-red-600" />
                <div>
                  <p className="text-[13px] font-semibold text-red-700">
                    Faktur ini telah dibatalkan
                  </p>
                  <p className="mt-0.5 text-[11px] leading-relaxed text-red-600/80">
                    Stok barang sudah dikembalikan ke batch asal dan transaksi
                    ini tidak dihitung pada laporan penjualan maupun profit.
                    Tekan <strong className="font-semibold">Selesaikan</strong>{" "}
                    untuk mengaktifkan kembali faktur ini.
                  </p>
                </div>
              </div>
            )}

            {/* Header metadata */}
            <div className="overflow-hidden rounded-2xl border border-zinc-200/70">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-100 bg-zinc-50/70 px-4 py-3.5">
                <div className="flex items-center gap-3">
                  <span className="grid size-10 place-items-center rounded-xl bg-white text-[#87482D] shadow-xs">
                    <Receipt className="size-4" />
                  </span>
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-zinc-400">
                      Nomor Faktur
                    </p>
                    <p className="font-mono text-[13px] font-bold text-zinc-900">
                      {selectedSale.invoiceNo}
                    </p>
                  </div>
                </div>
                <span
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-semibold",
                    detailStatus.badgeClass
                  )}
                >
                  <span
                    className={cn("size-1.5 rounded-full", detailStatus.dotClass)}
                  />
                  {detailStatus.label}
                </span>
              </div>

              <dl className="grid gap-4 px-4 py-4 sm:grid-cols-3">
                <div>
                  <dt className="text-[10px] font-semibold uppercase tracking-[0.12em] text-zinc-400">
                    Pelanggan
                  </dt>
                  <dd className="mt-1 flex items-center gap-1.5 text-[13px] font-semibold text-zinc-800">
                    <UserRound className="size-3.5 text-zinc-400" />
                    {selectedSale.customer?.name ?? "Pelanggan Umum"}
                  </dd>
                  <dd className="mt-0.5 text-[11px] text-zinc-400">
                    {selectedSale.customer?.phone ?? "Tanpa nomor telepon"}
                  </dd>
                </div>
                <div>
                  <dt className="text-[10px] font-semibold uppercase tracking-[0.12em] text-zinc-400">
                    Salesman
                  </dt>
                  <dd className="mt-1 text-[13px] font-semibold text-zinc-800">
                    {selectedSale.salesman?.name ?? "-"}
                  </dd>
                  <dd className="mt-0.5 text-[11px] text-zinc-400">
                    {selectedSale.items.length} jenis barang ·{" "}
                    {detailQty.toLocaleString("id-ID")} unit
                  </dd>
                </div>
                <div>
                  <dt className="text-[10px] font-semibold uppercase tracking-[0.12em] text-zinc-400">
                    Tanggal Transaksi
                  </dt>
                  <dd className="mt-1 flex items-center gap-1.5 text-[13px] font-semibold text-zinc-800">
                    <CalendarDays className="size-3.5 text-zinc-400" />
                    {new Date(selectedSale.date).toLocaleDateString("id-ID", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </dd>
                </div>
              </dl>
            </div>

            {/* Rincian barang */}
            <div className="overflow-hidden rounded-2xl border border-zinc-200/70">
              <div className="flex items-center justify-between gap-3 border-b border-zinc-100 bg-zinc-50/70 px-4 py-3">
                <h3 className="flex items-center gap-2 text-[13px] font-semibold text-zinc-900">
                  <Layers className="size-3.5 text-[#87482D]" />
                  Rincian Barang
                </h3>
                <span className="text-[11px] text-zinc-400">
                  {selectedSale.items.length} baris
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[560px] text-sm">
                  <thead>
                    <tr className="border-b border-zinc-100 text-left text-[10px] font-bold uppercase tracking-[0.1em] text-zinc-400">
                      <th className="px-4 py-2.5">Produk</th>
                      <th className="px-4 py-2.5 text-center">Qty</th>
                      <th className="px-4 py-2.5 text-right">Harga</th>
                      <th className="px-4 py-2.5 text-right">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100">
                    {selectedSale.items.map((item) => {
                      const qty = Number(item.qty);
                      const unitPrice =
                        qty > 0 ? Number(item.subtotal) / qty : 0;

                      return (
                        <tr key={item.id} className="align-top">
                          <td className="px-4 py-3">
                            <p className="text-[13px] font-semibold text-zinc-900">
                              {item.product.name}
                            </p>
                            <p className="text-[10px] text-zinc-400">
                              {item.product.code}
                            </p>
                            {item.allocations.length > 0 && (
                              <div className="mt-1.5 flex flex-wrap gap-1">
                                {item.allocations.map((allocation) => (
                                  <span
                                    key={allocation.id}
                                    className="inline-flex items-center gap-1 rounded-md bg-zinc-50 px-1.5 py-0.5 text-[9px] font-medium text-zinc-500 ring-1 ring-inset ring-zinc-200/70"
                                  >
                                    Batch #{allocation.batchId} ·{" "}
                                    {Number(allocation.qtyBase)}{" "}
                                    {item.product.baseUnit.code}
                                  </span>
                                ))}
                              </div>
                            )}
                          </td>
                          <td className="whitespace-nowrap px-4 py-3 text-center text-[12px] font-semibold tabular-nums text-zinc-700">
                            {qty.toLocaleString("id-ID")} {item.unit.code}
                          </td>
                          <td className="whitespace-nowrap px-4 py-3 text-right text-[12px] tabular-nums text-zinc-500">
                            Rp {unitPrice.toLocaleString("id-ID")}
                          </td>
                          <td className="whitespace-nowrap px-4 py-3 text-right text-[13px] font-bold tabular-nums text-zinc-900">
                            Rp{" "}
                            {Number(item.subtotal).toLocaleString("id-ID")}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Ringkasan pembayaran */}
            <div className="overflow-hidden rounded-2xl border border-zinc-200/70">
              <div className="flex items-center gap-2 border-b border-zinc-100 bg-zinc-50/70 px-4 py-3">
                <Wallet className="size-3.5 text-[#87482D]" />
                <h3 className="text-[13px] font-semibold text-zinc-900">
                  Ringkasan Pembayaran
                </h3>
              </div>
              <div className="grid gap-3 px-4 py-4 sm:grid-cols-3">
                <div className="rounded-xl border border-zinc-200/70 bg-white px-3 py-2.5">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-zinc-400">
                    Subtotal
                  </p>
                  <p className="mt-1 text-[14px] font-bold tabular-nums text-zinc-900">
                    Rp {Number(selectedSale.subtotal).toLocaleString("id-ID")}
                  </p>
                </div>
                <div className="rounded-xl border border-red-200/70 bg-red-50/50 px-3 py-2.5">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-red-400">
                    Diskon
                  </p>
                  <p className="mt-1 text-[14px] font-bold tabular-nums text-red-600">
                    −Rp{" "}
                    {Number(selectedSale.discountAmount).toLocaleString(
                      "id-ID"
                    )}
                  </p>
                </div>
                <div className="rounded-xl border border-emerald-200/70 bg-emerald-50/50 px-3 py-2.5">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-emerald-500">
                    Pajak / PPN
                  </p>
                  <p className="mt-1 text-[14px] font-bold tabular-nums text-emerald-700">
                    +Rp{" "}
                    {Number(selectedSale.taxAmount).toLocaleString("id-ID")}
                  </p>
                </div>
              </div>
              <div className="flex items-center justify-between gap-3 border-t border-[#6D3A24]/20 bg-[#87482D] px-4 py-3.5 text-white">
                <span className="text-[13px] font-medium text-white/75">
                  Total Pembayaran
                </span>
                <span className="font-display text-xl font-bold">
                  Rp {Number(selectedSale.total).toLocaleString("id-ID")}
                </span>
              </div>
            </div>

            {detailError && (
              <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-[12px] font-medium text-red-700">
                <AlertCircle className="mt-0.5 size-4 shrink-0" />
                {detailError}
              </div>
            )}

            {confirmCancel && !detailIsCancelled && (
              <div className="rounded-2xl border border-red-200 bg-red-50 p-4">
                <p className="flex items-center gap-2 text-[13px] font-semibold text-red-700">
                  <AlertCircle className="size-4" />
                  Batalkan faktur {selectedSale.invoiceNo}?
                </p>
                <p className="mt-1 text-[11px] leading-relaxed text-red-600/80">
                  Stok dikembalikan ke batch asal, lalu faktur tidak lagi
                  dihitung pada laporan penjualan dan profit. Tindakan ini
                  tidak bisa dibatalkan.
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={handleCancelSale}
                    disabled={detailAction !== null}
                  >
                    {detailAction === "CANCEL" ? (
                      <Loader2 className="size-3.5 animate-spin" />
                    ) : (
                      <Ban className="size-3.5" />
                    )}
                    {detailAction === "CANCEL"
                      ? "Membatalkan..."
                      : "Ya, batalkan faktur"}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setConfirmCancel(false)}
                    disabled={detailAction !== null}
                  >
                    Kembali
                  </Button>
                </div>
              </div>
            )}

            {confirmComplete && detailIsCancelled && (
              <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
                <p className="flex items-center gap-2 text-[13px] font-semibold text-amber-800">
                  <AlertCircle className="size-4" />
                  Aktifkan kembali faktur {selectedSale.invoiceNo}?
                </p>
                <p className="mt-1 text-[11px] leading-relaxed text-amber-700/80">
                  Stok akan dipotong kembali mengikuti alokasi batch FIFO
                  semula, lalu faktur ditandai selesai dan kembali masuk ke
                  laporan penjualan.
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    onClick={handleCompleteSale}
                    disabled={detailAction !== null}
                  >
                    {detailAction === "COMPLETE" ? (
                      <Loader2 className="size-3.5 animate-spin" />
                    ) : (
                      <CheckCircle2 className="size-3.5" />
                    )}
                    {detailAction === "COMPLETE"
                      ? "Menyelesaikan..."
                      : "Ya, selesaikan faktur"}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setConfirmComplete(false)}
                    disabled={detailAction !== null}
                  >
                    Batal
                  </Button>
                </div>
              </div>
            )}

            {/* Aksi */}
            <div className="flex flex-col-reverse gap-2 border-t border-zinc-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
              <Button variant="ghost" onClick={closeDetail}>
                Tutup
              </Button>
              <div className="flex flex-col gap-2 sm:flex-row">
                <Button
                  variant="outline"
                  onClick={() => {
                    setDetailError("");
                    setConfirmComplete(false);
                    setConfirmCancel(true);
                  }}
                  disabled={detailIsCancelled || detailAction !== null}
                  title={
                    detailIsCancelled ? "Faktur sudah dibatalkan" : undefined
                  }
                  className="border-red-200 text-red-600 hover:border-red-300 hover:bg-red-50"
                >
                  <Ban className="size-4" />
                  Batalkan
                </Button>
                <Button
                  onClick={requestCompleteSale}
                  disabled={detailIsPaid || detailAction !== null}
                  title={
                    detailIsPaid
                      ? "Faktur sudah selesai"
                      : detailIsCancelled
                        ? "Aktifkan kembali faktur dan potong stok sesuai batch FIFO"
                        : undefined
                  }
                >
                  {detailAction === "COMPLETE" ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <CheckCircle2 className="size-4" />
                  )}
                  {detailIsPaid
                    ? "Sudah Selesai"
                    : detailAction === "COMPLETE"
                      ? "Menyelesaikan..."
                      : "Selesaikan"}
                </Button>
              </div>
            </div>
          </div>
        </Dialog>
      )}
    </div>
  );
}
