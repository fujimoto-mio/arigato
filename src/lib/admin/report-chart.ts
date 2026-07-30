import { startOfTokyoDay, startOfTokyoDaysAgo } from "@/lib/admin/period";
import { prisma } from "@/lib/prisma";

const DAY_MS = 24 * 60 * 60 * 1000;
const MAX_RANGE_DAYS = 60;
const RANGE_DAYS: Record<string, number> = { today: 1, "7": 7, "14": 14, "30": 30, "60": 60 };

// These Dates carry the JST wall-clock in their UTC components (the Prisma
// connection is pinned to Asia/Tokyo — see @/lib/prisma), so read/build them
// against "UTC" to get the JST calendar day without a double offset.
function tokyoDayKey(value: Date): string {
  return new Date(value).toLocaleDateString("ja-JP", { timeZone: "UTC", month: "2-digit", day: "2-digit" });
}

function tokyoWeekday(value: Date): string {
  return new Date(value).toLocaleDateString("ja-JP", { timeZone: "UTC", weekday: "short" });
}

function tokyoISODate(value: Date): string {
  return new Date(value).toLocaleDateString("en-CA", { timeZone: "UTC" });
}

function parseTokyoDate(value: string | undefined): Date | null {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const [y, m, d] = value.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d)); // JST midnight in UTC components
  return Number.isNaN(dt.getTime()) ? null : dt;
}

export type ChartDay = { key: string; weekday: string; total: number; count: number; isToday: boolean };

/** Serializable payload for the daily-tips chart — shared by the page (SSR) and
 *  the `/api/admin/reports/chart` endpoint (client range changes). */
export type ReportChartData = {
  selection: string;
  fromISO: string;
  toISO: string;
  todayISO: string;
  days: ChartDay[];
  rangeTotal: number;
  rangeCount: number;
  maxTotal: number;
  dayCount: number;
};

/**
 * Build the daily-tips chart data for a store scope and a range (a preset
 * keyword — today/7/14/30/60 — or a custom from–to pair). The range is clamped
 * so it never runs into the future or exceeds the cap.
 */
export async function getReportChart(
  scope: { storeId?: string },
  params: { range?: string; from?: string; to?: string },
): Promise<ReportChartData> {
  const todayStart = startOfTokyoDay();

  const customFrom = parseTokyoDate(params.from);
  const customTo = parseTokyoDate(params.to);
  const isCustom = Boolean(customFrom && customTo);

  let toStart = isCustom ? customTo! : todayStart;
  if (toStart > todayStart) toStart = todayStart;

  let fromStart: Date;
  let selection: string;
  if (isCustom) {
    selection = "custom";
    fromStart = customFrom!;
  } else {
    selection = params.range && RANGE_DAYS[params.range] ? params.range : "7";
    fromStart = startOfTokyoDaysAgo(RANGE_DAYS[selection] - 1, toStart);
  }
  if (fromStart > toStart) fromStart = toStart;
  if ((toStart.getTime() - fromStart.getTime()) / DAY_MS > MAX_RANGE_DAYS - 1) {
    fromStart = new Date(toStart.getTime() - (MAX_RANGE_DAYS - 1) * DAY_MS);
  }
  const rangeEndExclusive = new Date(toStart.getTime() + DAY_MS);

  const rangeTips = await prisma.tip.findMany({
    where: { ...scope, status: "succeeded", createdAt: { gte: fromStart, lt: rangeEndExclusive } },
    select: { amount: true, createdAt: true },
  });

  // One bucket per Tokyo day across the selected range.
  const dayCount = Math.floor((toStart.getTime() - fromStart.getTime()) / DAY_MS) + 1;
  const days: ChartDay[] = Array.from({ length: dayCount }, (_, i) => {
    const d = new Date(fromStart.getTime() + i * DAY_MS);
    return {
      key: tokyoDayKey(d),
      weekday: tokyoWeekday(d),
      total: 0,
      count: 0,
      isToday: d.getTime() === todayStart.getTime(),
    };
  });
  const byKey = new Map(days.map((d) => [d.key, d]));
  for (const tip of rangeTips) {
    const bucket = byKey.get(tokyoDayKey(tip.createdAt));
    if (bucket) {
      bucket.total += tip.amount;
      bucket.count += 1;
    }
  }
  const maxTotal = Math.max(1, ...days.map((d) => d.total));
  const rangeTotal = days.reduce((sum, d) => sum + d.total, 0);
  const rangeCount = days.reduce((sum, d) => sum + d.count, 0);

  return {
    selection,
    fromISO: tokyoISODate(fromStart),
    toISO: tokyoISODate(toStart),
    todayISO: tokyoISODate(todayStart),
    days,
    rangeTotal,
    rangeCount,
    maxTotal,
    dayCount,
  };
}
