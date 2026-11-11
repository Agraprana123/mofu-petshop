export const dynamic = "force-dynamic";

import { getCategories } from "@/server/actions/category.action";
import { CategoriesClient } from "./client";

export default async function CategoriesPage() {
  const categories = await getCategories();
  return <CategoriesClient categories={JSON.parse(JSON.stringify(categories))} />;
}

