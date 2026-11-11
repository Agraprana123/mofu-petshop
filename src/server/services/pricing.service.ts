import { Decimal } from "@prisma/client/runtime/library";
import type { PrismaClient, Product, Category } from "@prisma/client";

type Tx = Omit<PrismaClient, "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends">;

/**
 * Ambil margin efektif suatu produk (persen).
 * Prioritas: product.marginPercent → category.defaultMarginPercent
 */
export async function getEffectiveMargin(
  tx: Tx,
  productId: number
): Promise<Decimal> {
  const product = await tx.product.findUniqueOrThrow({
    where: { id: productId },
    include: { category: true },
  });

  return product.marginPercent ?? product.category.defaultMarginPercent;
}

/**
 * Hitung harga jual per satuan dasar dari cost per base + margin.
 * Formula: pricePerBase = costPerBase × (1 + margin / 100)
 */
export function calcSellPrice(
  costPerBase: Decimal,
  marginPercent: Decimal
): Decimal {
  const factor = new Decimal(1).plus(marginPercent.div(100));
  return costPerBase.mul(factor).toDecimalPlaces(4, Decimal.ROUND_HALF_UP);
}

/**
 * Hitung harga jual per base langsung dari product (ambil margin otomatis).
 */
export async function getSellPricePerBase(
  tx: Tx,
  productId: number,
  costPerBase: Decimal
): Promise<Decimal> {
  const margin = await getEffectiveMargin(tx, productId);
  return calcSellPrice(costPerBase, margin);
}

