-- Status pembatalan faktur penjualan.
-- Faktur yang dibatalkan tetap tersimpan sebagai riwayat, tetapi stoknya
-- dikembalikan dan tidak dihitung pada laporan penjualan/profit.
ALTER TYPE "PaymentStatus" ADD VALUE IF NOT EXISTS 'CANCELLED';
