export const dynamic = "force-dynamic";

import { getProducts } from "@/server/actions/product.action";
import { getCategories } from "@/server/actions/category.action";
import { getUnits } from "@/server/actions/unit.action";
import { ProductsClient } from "./client";

export default async function ProductsPage() {
  const [products, categories, units] = await Promise.all([
    getProducts(),
    getCategories(),
    getUnits(),
  ]);

  return (
    <ProductsClient
      products={JSON.parse(JSON.stringify(products))}
      categories={JSON.parse(JSON.stringify(categories))}
      units={JSON.parse(JSON.stringify(units))}
    />
  );
}

