"use client";

import { useState } from "react";
import {
  Database,
  Download,
  Terminal,
  AlertTriangle,
  Copy,
  Check,
  Server,
  FileSpreadsheet,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface BackupClientProps {
  stats: {
    totalProducts: number;
    totalSales: number;
    totalPurchases: number;
    totalCustomers: number;
    totalSuppliers: number;
    totalBatches: number;
    totalMovements: number;
    totalUsers: number;
  };
}

export function BackupClient({ stats }: BackupClientProps) {
  const [copiedBackup, setCopiedBackup] = useState(false);
  const [copiedRestore, setCopiedRestore] = useState(false);

  const backupCommand =
    "pg_dump -U postgres -d mofu_petshop > backup_$(date +%Y%m%d).sql";
  const restoreCommand =
    "psql -U postgres -d mofu_petshop < backup.sql";

  function handleCopy(text: string, type: "backup" | "restore") {
    navigator.clipboard.writeText(text);
    if (type === "backup") {
      setCopiedBackup(true);
      setTimeout(() => setCopiedBackup(false), 2000);
    } else {
      setCopiedRestore(true);
      setTimeout(() => setCopiedRestore(false), 2000);
    }
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-zinc-900 tracking-tight">
          Backup & Restore
        </h1>
        <p className="text-zinc-500 mt-1 text-sm">
          Kelola pencadangan dan pemulihan data database sistem
        </p>
      </div>

      {/* Warning Box */}
      <div className="bg-[#87482D]/5 border border-[#87482D]/20 rounded-2xl p-5 flex items-start gap-4">
        <div className="w-10 h-10 rounded-xl bg-[#87482D]/10 flex items-center justify-center shrink-0 text-[#87482D]">
          <AlertTriangle className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-sm font-bold text-[#87482D]">
            Fitur Backup Database PostgreSQL
          </h2>
          <p className="text-xs text-zinc-600 mt-1 leading-relaxed">
            Untuk mencadangkan seluruh data sistem (skema, batch FIFO, transaksi, dan akun), jalankan perintah terminal di bawah ini pada komputer server lokal atau gunakan aplikasi GUI seperti <strong>TablePlus</strong> atau <strong>pgAdmin</strong>. Lakukan pencadangan secara berkala untuk menjaga keamanan data toko.
          </p>
        </div>
      </div>

      {/* Two Columns: Backup & Restore */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Backup Card */}
        <div className="bg-white rounded-2xl border border-zinc-200/80 shadow-xs p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-[#87482D]/10 text-[#87482D] flex items-center justify-center">
                <Database className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-zinc-900 text-base">
                  Backup Database
                </h3>
                <p className="text-xs text-zinc-400">
                  Export seluruh data ke file SQL
                </p>
              </div>
            </div>

            <p className="text-xs text-zinc-600 mb-2 font-medium">
              Perintah backup PostgreSQL via terminal:
            </p>

            <div className="bg-zinc-900 text-zinc-100 rounded-xl p-3.5 text-xs font-mono flex items-center justify-between gap-3 mb-4">
              <code className="break-all">{backupCommand}</code>
              <button
                onClick={() => handleCopy(backupCommand, "backup")}
                className="text-zinc-400 hover:text-white shrink-0 p-1 rounded-md hover:bg-zinc-800 transition-colors"
                title="Salin perintah"
              >
                {copiedBackup ? (
                  <Check className="w-4 h-4 text-emerald-400" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          <div className="pt-4 border-t border-zinc-100">
            <Button
              asChild
              className="bg-[#87482D] hover:bg-[#6d3a24] text-white shadow-sm shadow-[#87482D]/20 w-full sm:w-auto"
            >
              <a href="/api/export/stock" download>
                <Download className="w-4 h-4" />
                Export Laporan Stok (CSV)
              </a>
            </Button>
          </div>
        </div>

        {/* Restore Card */}
        <div className="bg-white rounded-2xl border border-zinc-200/80 shadow-xs p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <Terminal className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-zinc-900 text-base">
                  Panduan Restore
                </h3>
                <p className="text-xs text-zinc-400">
                  Pulihkan database dari file cadangan SQL
                </p>
              </div>
            </div>

            <p className="text-xs text-zinc-600 mb-2 font-medium">
              Perintah restore database PostgreSQL:
            </p>

            <div className="bg-zinc-900 text-zinc-100 rounded-xl p-3.5 text-xs font-mono flex items-center justify-between gap-3 mb-4">
              <code className="break-all">{restoreCommand}</code>
              <button
                onClick={() => handleCopy(restoreCommand, "restore")}
                className="text-zinc-400 hover:text-white shrink-0 p-1 rounded-md hover:bg-zinc-800 transition-colors"
                title="Salin perintah"
              >
                {copiedRestore ? (
                  <Check className="w-4 h-4 text-emerald-400" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          <div className="pt-4 border-t border-zinc-100 text-xs text-amber-700 bg-amber-50/70 p-3 rounded-xl border border-amber-200/50">
            ⚠️ <strong>Perhatian:</strong> Pastikan database target sudah tersedia sebelum menjalankan proses restore.
          </div>
        </div>
      </div>

      {/* Database Tables Summary Card */}
      <div className="bg-white rounded-2xl border border-zinc-200/80 shadow-xs p-6">
        <div className="flex items-center gap-3 pb-4 border-b border-zinc-100 mb-4">
          <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <Server className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-zinc-900 text-sm">
              Ringkasan Data Database (PostgreSQL)
            </h3>
            <p className="text-xs text-zinc-400">
              Database: <code className="font-mono text-[#87482D]">mofu_petshop</code> di <code className="font-mono">localhost:5432</code>
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl bg-zinc-50 border border-zinc-100">
            <p className="text-xs text-zinc-500 font-medium">Total Produk</p>
            <p className="text-xl font-bold text-zinc-900 mt-1">{stats.totalProducts}</p>
          </div>

          <div className="p-4 rounded-xl bg-zinc-50 border border-zinc-100">
            <p className="text-xs text-zinc-500 font-medium">Total Batch FIFO</p>
            <p className="text-xl font-bold text-zinc-900 mt-1">{stats.totalBatches}</p>
          </div>

          <div className="p-4 rounded-xl bg-zinc-50 border border-zinc-100">
            <p className="text-xs text-zinc-500 font-medium">Faktur Penjualan</p>
            <p className="text-xl font-bold text-zinc-900 mt-1">{stats.totalSales}</p>
          </div>

          <div className="p-4 rounded-xl bg-zinc-50 border border-zinc-100">
            <p className="text-xs text-zinc-500 font-medium">Faktur Pembelian</p>
            <p className="text-xl font-bold text-zinc-900 mt-1">{stats.totalPurchases}</p>
          </div>

          <div className="p-4 rounded-xl bg-zinc-50 border border-zinc-100">
            <p className="text-xs text-zinc-500 font-medium">Customer</p>
            <p className="text-xl font-bold text-zinc-900 mt-1">{stats.totalCustomers}</p>
          </div>

          <div className="p-4 rounded-xl bg-zinc-50 border border-zinc-100">
            <p className="text-xs text-zinc-500 font-medium">Supplier</p>
            <p className="text-xl font-bold text-zinc-900 mt-1">{stats.totalSuppliers}</p>
          </div>

          <div className="p-4 rounded-xl bg-zinc-50 border border-zinc-100">
            <p className="text-xs text-zinc-500 font-medium">Mutasi Stok</p>
            <p className="text-xl font-bold text-zinc-900 mt-1">{stats.totalMovements}</p>
          </div>

          <div className="p-4 rounded-xl bg-zinc-50 border border-zinc-100">
            <p className="text-xs text-zinc-500 font-medium">Akun Pengguna</p>
            <p className="text-xl font-bold text-zinc-900 mt-1">{stats.totalUsers}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

