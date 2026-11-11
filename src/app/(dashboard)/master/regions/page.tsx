export const dynamic = "force-dynamic";

import { getRegions } from "@/server/actions/region.action";
import { RegionsClient } from "./client";

export default async function RegionsPage() {
  const regions = await getRegions();
  return <RegionsClient regions={JSON.parse(JSON.stringify(regions))} />;
}

