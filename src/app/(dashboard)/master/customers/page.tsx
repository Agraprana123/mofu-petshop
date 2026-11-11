export const dynamic = "force-dynamic";

import { getCustomers } from "@/server/actions/customer.action";
import { getRegions } from "@/server/actions/region.action";
import { CustomersClient } from "./client";

export default async function CustomersPage() {
  const [customers, regions] = await Promise.all([getCustomers(), getRegions()]);
  return (
    <CustomersClient
      customers={JSON.parse(JSON.stringify(customers))}
      regions={JSON.parse(JSON.stringify(regions))}
    />
  );
}

