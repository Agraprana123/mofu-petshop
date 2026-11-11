export const dynamic = "force-dynamic";

import { getSalesmen } from "@/server/actions/salesman.action";
import { getRegions } from "@/server/actions/region.action";
import { SalesmenClient } from "./client";

export default async function SalesmenPage() {
  const [salesmen, regions] = await Promise.all([getSalesmen(), getRegions()]);
  return (
    <SalesmenClient
      salesmen={JSON.parse(JSON.stringify(salesmen))}
      regions={JSON.parse(JSON.stringify(regions))}
    />
  );
}

