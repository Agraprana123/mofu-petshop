-- Snapshot subtotal, diskon, dan pajak pada faktur penjualan.
ALTER TABLE "sales"
  ADD COLUMN "subtotal" DECIMAL(18, 2) NOT NULL DEFAULT 0,
  ADD COLUMN "discount_amount" DECIMAL(18, 2) NOT NULL DEFAULT 0,
  ADD COLUMN "tax_amount" DECIMAL(18, 2) NOT NULL DEFAULT 0;

-- Faktur lama: total sebelumnya adalah subtotal tanpa diskon/pajak.
UPDATE "sales" SET "subtotal" = "total";
