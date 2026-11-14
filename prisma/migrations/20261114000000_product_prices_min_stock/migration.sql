-- Harga master produk & ambang stok minimum.
-- IF NOT EXISTS membuat migrasi aman dijalankan pada database yang
-- sebelumnya sudah disinkronkan lewat `prisma db push`.
ALTER TABLE "products"
  ADD COLUMN IF NOT EXISTS "buy_price" DECIMAL(18,4),
  ADD COLUMN IF NOT EXISTS "sell_price" DECIMAL(18,4),
  ADD COLUMN IF NOT EXISTS "min_stock" DECIMAL(18,3) NOT NULL DEFAULT 5;

-- Kolom harga snapshot batch (sebelumnya hanya ada lewat db push).
ALTER TABLE "purchase_items"
  ADD COLUMN IF NOT EXISTS "margin_percent" DECIMAL(7,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "sell_price_per_unit" DECIMAL(18,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "sell_price_per_base" DECIMAL(18,4) NOT NULL DEFAULT 0;

ALTER TABLE "stock_batches"
  ADD COLUMN IF NOT EXISTS "margin_percent" DECIMAL(7,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "sell_price_per_base" DECIMAL(18,4) NOT NULL DEFAULT 0;
