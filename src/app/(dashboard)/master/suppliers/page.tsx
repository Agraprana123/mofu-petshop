export const dynamic = "force-dynamic";

import { getSuppliers } from "@/server/actions/supplier.action";
import { SuppliersClient } from "./client";

export default async function SuppliersPage() {
  const suppliers = await getSuppliers();
  return <SuppliersClient suppliers={JSON.parse(JSON.stringify(suppliers))} />;
}

