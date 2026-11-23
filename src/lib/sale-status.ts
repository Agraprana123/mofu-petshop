/** Metadata tampilan status faktur penjualan. */
export interface SaleStatusMeta {
  label: string;
  badgeClass: string;
  dotClass: string;
  textClass: string;
}

const SALE_STATUS_META: Record<string, SaleStatusMeta> = {
  PAID: {
    label: "Selesai",
    badgeClass: "border border-emerald-200 bg-emerald-50 text-emerald-700",
    dotClass: "bg-emerald-500",
    textClass: "text-emerald-600",
  },
  UNPAID: {
    label: "Belum Dibayar",
    badgeClass: "border border-amber-200 bg-amber-50 text-amber-700",
    dotClass: "bg-amber-500",
    textClass: "text-amber-600",
  },
  PARTIAL: {
    label: "Dibayar Sebagian",
    badgeClass: "border border-sky-200 bg-sky-50 text-sky-700",
    dotClass: "bg-sky-500",
    textClass: "text-sky-600",
  },
  CANCELLED: {
    label: "Dibatalkan",
    badgeClass: "border border-red-200 bg-red-50 text-red-700",
    dotClass: "bg-red-500",
    textClass: "text-red-600",
  },
};

export function getSaleStatusMeta(status: string): SaleStatusMeta {
  return (
    SALE_STATUS_META[status] ?? {
      label: status,
      badgeClass: "border border-zinc-200 bg-zinc-50 text-zinc-600",
      dotClass: "bg-zinc-400",
      textClass: "text-zinc-500",
    }
  );
}
