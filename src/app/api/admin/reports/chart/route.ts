import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/admin/auth";
import { getReportChart } from "@/lib/admin/report-chart";
import { getActiveStore, storeScope } from "@/lib/admin/store-scope";

/**
 * Daily-tips chart data for the active store scope. Lets the reports page refresh
 * just the chart when the range changes — without reloading the whole page.
 */
export async function GET(request: Request) {
  const { error } = await requireAdminApi();
  if (error) return error;

  const { activeStoreId } = await getActiveStore();
  const { searchParams } = new URL(request.url);

  const data = await getReportChart(storeScope(activeStoreId), {
    range: searchParams.get("range") ?? undefined,
    from: searchParams.get("from") ?? undefined,
    to: searchParams.get("to") ?? undefined,
  });

  return NextResponse.json(data);
}
