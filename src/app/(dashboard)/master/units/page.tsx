export const dynamic = "force-dynamic";

import { getUnits } from "@/server/actions/unit.action";
import { UnitsClient } from "./client";

export default async function UnitsPage() {
  const units = await getUnits();
  return <UnitsClient units={JSON.parse(JSON.stringify(units))} />;
}

