"use client";

import { useMemo, useState } from "react";
import { CalendarDays, Receipt } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

interface SaleReportRecord {
  id: number;
  invoiceNo: string;
  date: string;
  discountAmount: number;
  total: number;
  customerName: string;
  grossProfit: number;
}

/** Kunci tanggal lokal (YYYY-MM-DD), sama seperti yang dipakai di server. */
function dateKey(iso: string) {
  const date = new Date(iso);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
    2,
    "0"
  )}-${String(date.getDate()).padStart(2, "0")}`;
}

function formatRupiah(value: number) {
  return `Rp ${value.toLocaleString("id-ID")}`;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function SalesReportClient({
  records,
  defaultFrom,
  defaultTo,
}: {
  records: SaleReportRecord[];
  defaultFrom: string;
  defaultTo: string;
}) {
  // Nilai yang sedang diisi di filter vs nilai yang sudah diterapkan.
  const [draftFrom, setDraftFrom] = useState(defaultFrom);
  const [draftTo, setDraftTo] = useState(defaultTo);
  const [from, setFrom] = useState(defaultFrom);
  const [to, setTo] = useState(defaultTo);

  const filtered = useMemo(
    () =>
      records.filter((record) => {
        const key = dateKey(record.date);
        if (from && key < from) return false;
        if (to && key > to) return false;
        return true;
      }),
    [records, from, to]
  );

  const totalInvoices = filtered.length;
  const totalSales = filtered.reduce((sum, record) => sum + record.total, 0);
  const totalDiscount = filtered.reduce(
    (sum, record) => sum + record.discountAmount,
    0
  );
  const totalProfit = filtered.reduce(
    (sum, record) => sum + record.grossProfit,
    0
  );

  function applyRange() {
    // Kalau urutan tanggal terbalik, tukar otomatis.
    if (draftFrom && draftTo && draftFrom > draftTo) {
      setDraftFrom(draftTo);
      setDraftTo(draftFrom);
      setFrom(draftTo);
      setTo(draftFrom);
      return;
    }
    setFrom(draftFrom);
    setTo(draftTo);
  }

  return (
    <div className="page-enter mx-auto max-w-7xl space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight text-zinc-900">
          Laporan Penjualan
        </h1>
        <p className="mt-1 text-sm text-zinc-500">
          Ringkasan transaksi penjualan per periode
        </p>
      </div>

      {/* Filter periode */}
      <div className="rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-xs">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
          <div className="w-full space-y-1.5 sm:w-56">
            <Label
              htmlFor="reportFrom"
              className="text-xs font-semibold text-zinc-600"
            >
              Dari Tanggal
            </Label>
            <Input
              id="reportFrom"
              type="date"
              value={draftFrom}
              onChange={(event) => setDraftFrom(event.target.value)}
              className="h-11 rounded-xl"
            />
          </div>

          <div className="w-full space-y-1.5 sm:w-56">
            <Label
              htmlFor="reportTo"
              className="text-xs font-semibold text-zinc-600"
            >
              Sampai Tanggal
            </Label>
            <Input
              id="reportTo"
              type="date"
              value={draftTo}
              onChange={(event) => setDraftTo(event.target.value)}
              className="h-11 rounded-xl"
            />
          </div>

          <Button onClick={applyRange} className="h-11 shrink-0 px-6">
            Tampilkan
          </Button>
        </div>
      </div>

      {/* Ringkasan */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-xs">
          <p className="text-xs font-medium text-zinc-500">Total Faktur</p>
          <p className="mt-1 text-2xl font-bold text-zinc-900">
            {totalInvoices.toLocaleString("id-ID")}
          </p>
        </div>

        <div className="rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-xs">
          <p className="text-xs font-medium text-zinc-500">Total Penjualan</p>
          <p className="mt-1 text-2xl font-bold text-zinc-900">
            {formatRupiah(totalSales)}
          </p>
        </div>

        <div className="rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-xs">
          <p className="text-xs font-medium text-zinc-500">Total Diskon</p>
          <p className="mt-1 text-2xl font-bold text-red-600">
            {formatRupiah(totalDiscount)}
          </p>
        </div>

        <div className="rounded-2xl border border-amber-200/80 bg-gradient-to-br from-amber-50 to-[#fdf6e6] p-5 shadow-xs">
          <p className="text-xs font-medium text-amber-700/80">Profit Kotor</p>
          <p className="mt-1 text-2xl font-bold text-[#a2681b]">
            {formatRupiah(totalProfit)}
          </p>
        </div>
      </div>

      {/* Detail transaksi */}
      <div className="overflow-hidden rounded-2xl border border-zinc-200/80 bg-white shadow-xs">
        <div className="flex flex-col gap-1 border-b border-zinc-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-sm font-bold text-zinc-900">
            Detail Transaksi ({totalInvoices.toLocaleString("id-ID")})
          </h2>
          <p className="flex items-center gap-1.5 text-[11px] text-zinc-400">
            <CalendarDays className="size-3.5" />
            {from ? formatDate(`${from}T00:00:00`) : "Awal"} &ndash;{" "}
            {to ? formatDate(`${to}T00:00:00`) : "Sekarang"}
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-100 text-left text-xs font-semibold uppercase tracking-wider text-zinc-400">
                <th className="px-5 py-3.5">No. Faktur</th>
                <th className="px-5 py-3.5">Tanggal</th>
                <th className="px-5 py-3.5">Customer</th>
                <th className="px-5 py-3.5 text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {filtered.length === 0 ? (
                <tr>
                  <td
                    colSpan={4}
                    className="px-5 py-12 text-center text-zinc-400"
                  >
                    <Receipt className="mx-auto mb-2 size-8 opacity-40" />
                    Belum ada transaksi pada periode ini
                  </td>
                </tr>
              ) : (
                filtered.map((record) => (
                  <tr
                    key={record.id}
                    className="transition-colors hover:bg-zinc-50/70"
                  >
                    <td className="px-5 py-3.5 font-mono text-xs font-bold text-zinc-900">
                      {record.invoiceNo}
                    </td>
                    <td className="whitespace-nowrap px-5 py-3.5 text-xs text-zinc-500">
                      {formatDate(record.date)}
                    </td>
                    <td className="px-5 py-3.5 text-sm text-zinc-700">
                      {record.customerName}
                    </td>
                    <td
                      className="px-5 py-3.5 text-right font-bold tabular-nums text-zinc-900"
                    >
                      {formatRupiah(record.total)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
