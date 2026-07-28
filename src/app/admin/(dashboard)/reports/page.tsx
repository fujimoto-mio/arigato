import { ArrowDown, ArrowUp, Coins, HandCoins, Star, Wallet } from "lucide-react";
import type { ReactNode } from "react";
import { ReportRangeSelect } from "@/components/admin/ReportRangeSelect";
import { formatYen, startOfTokyoDay, startOfTokyoDaysAgo } from "@/lib/admin/period";
import { getActiveStore, storeScope } from "@/lib/admin/store-scope";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const TOKYO_OFFSET_MS = 9 * 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;
const MAX_RANGE_DAYS = 60;
const RANGE_DAYS: Record<string, number> = { today: 1, "7": 7, "14": 14, "30": 30, "60": 60 };

function tokyoDayKey(value: Date): string {
  return new Date(value).toLocaleDateString("ja-JP", { timeZone: "Asia/Tokyo", month: "2-digit", day: "2-digit" });
}

function tokyoWeekday(value: Date): string {
  return new Date(value).toLocaleDateString("ja-JP", { timeZone: "Asia/Tokyo", weekday: "short" });
}

function tokyoISODate(value: Date): string {
  return new Date(value).toLocaleDateString("en-CA", { timeZone: "Asia/Tokyo" });
}

function tokyoLongDate(value: Date): string {
  return new Date(value).toLocaleDateString("ja-JP", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "short",
  });
}

function parseTokyoDate(value: string | undefined): Date | null {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const [y, m, d] = value.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d) - TOKYO_OFFSET_MS);
  return Number.isNaN(dt.getTime()) ? null : dt;
}

async function periodStats(scope: { storeId?: string }, start?: Date, end?: Date) {
  const createdAt: { gte?: Date; lt?: Date } = {};
  if (start) createdAt.gte = start;
  if (end) createdAt.lt = end;
  const scoped = Boolean(start || end);
  const where = { ...scope, status: "succeeded" as const, ...(scoped ? { createdAt } : {}) };
  const reviewWhere = { ...scope, ...(scoped ? { createdAt } : {}) };
  const [tips, reviews] = await Promise.all([
    prisma.tip.aggregate({ where, _sum: { amount: true }, _count: true }),
    prisma.review.aggregate({ where: reviewWhere, _count: true, _avg: { rating: true } }),
  ]);
  const tipCount = tips._count;
  const tipTotal = tips._sum.amount ?? 0;
  return {
    tipCount,
    tipTotal,
    avgTip: tipCount > 0 ? tipTotal / tipCount : 0,
    reviewCount: reviews._count,
    avgRating: reviews._avg.rating ?? 0,
  };
}

export default async function AdminReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string; from?: string; to?: string }>;
}) {
  const { activeStoreId } = await getActiveStore();
  const scope = storeScope(activeStoreId);
  const { range, from, to } = await searchParams;
  const todayStart = startOfTokyoDay();
  const yesterdayStart = startOfTokyoDaysAgo(1);

  // Resolve the chart range: a preset keyword (today/7/14/30/60) or a custom
  // from–to pair. Clamped so it never runs into the future or exceeds the cap.
  const customFrom = parseTokyoDate(from);
  const customTo = parseTokyoDate(to);
  const isCustom = Boolean(customFrom && customTo);

  let toStart = isCustom ? customTo! : todayStart;
  if (toStart > todayStart) toStart = todayStart;

  let fromStart: Date;
  let selection: string;
  if (isCustom) {
    selection = "custom";
    fromStart = customFrom!;
  } else {
    selection = range && RANGE_DAYS[range] ? range : "7";
    fromStart = startOfTokyoDaysAgo(RANGE_DAYS[selection] - 1, toStart);
  }
  if (fromStart > toStart) fromStart = toStart;
  if ((toStart.getTime() - fromStart.getTime()) / DAY_MS > MAX_RANGE_DAYS - 1) {
    fromStart = new Date(toStart.getTime() - (MAX_RANGE_DAYS - 1) * DAY_MS);
  }
  const rangeEndExclusive = new Date(toStart.getTime() + DAY_MS);

  const [today, yesterday, all, rangeTips] = await Promise.all([
    periodStats(scope, todayStart),
    periodStats(scope, yesterdayStart, todayStart),
    periodStats(scope),
    prisma.tip.findMany({
      where: { ...scope, status: "succeeded", createdAt: { gte: fromStart, lt: rangeEndExclusive } },
      select: { amount: true, createdAt: true },
    }),
  ]);

  // One bucket per Tokyo day across the selected range.
  const dayCount = Math.floor((toStart.getTime() - fromStart.getTime()) / DAY_MS) + 1;
  const days = Array.from({ length: dayCount }, (_, i) => {
    const d = new Date(fromStart.getTime() + i * DAY_MS);
    return { key: tokyoDayKey(d), weekday: tokyoWeekday(d), total: 0, count: 0, isToday: d.getTime() === todayStart.getTime() };
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

  // Line chart geometry in a 0–100 viewBox (points at each day's column centre).
  const n = days.length;
  const px = (i: number) => ((i + 0.5) / n) * 100;
  const py = (total: number) => 96 - (total / maxTotal) * 90;
  const baseY = py(0).toFixed(2);
  const linePoints = days.map((d, i) => `${px(i).toFixed(2)},${py(d.total).toFixed(2)}`).join(" ");
  const areaPoints = `${px(0).toFixed(2)},${baseY} ${linePoints} ${px(n - 1).toFixed(2)},${baseY}`;
  const yTicks = [1, 0.75, 0.5, 0.25, 0].map((f) => Math.round(maxTotal * f));

  const labelEveryNth = dayCount <= 14 ? 1 : Math.ceil(dayCount / 12);
  const showValues = dayCount <= 10;

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-xl font-bold">レポート</h1>
        <p className="mt-1 text-sm text-neutral-500">集計日：{tokyoLongDate(todayStart)}（JST）</p>
      </div>

      <section>
        <h2 className="mb-3 text-sm font-bold text-neutral-700">本日の実績</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Metric
            label="チップ件数"
            value={`${today.tipCount.toLocaleString("ja-JP")} 件`}
            delta={<Delta current={today.tipCount} previous={yesterday.tipCount} />}
            icon={<HandCoins className="h-4 w-4" strokeWidth={1.75} />}
          />
          <Metric
            label="チップ合計金額"
            value={formatYen(today.tipTotal)}
            accent
            delta={<Delta current={today.tipTotal} previous={yesterday.tipTotal} />}
            icon={<Wallet className="h-4 w-4" strokeWidth={1.75} />}
          />
          <Metric
            label="平均チップ"
            value={today.tipCount > 0 ? formatYen(Math.round(today.avgTip)) : "—"}
            delta={<Delta current={today.avgTip} previous={yesterday.avgTip} />}
            icon={<Coins className="h-4 w-4" strokeWidth={1.75} />}
          />
          <Metric
            label="平均評価"
            value={today.reviewCount > 0 ? today.avgRating.toFixed(2) : "—"}
            delta={<Delta current={today.avgRating} previous={yesterday.avgRating} suffix="pt" absolute />}
            icon={<Star className="h-4 w-4" strokeWidth={1.75} />}
          />
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-sm font-bold text-neutral-700">累計</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Metric label="チップ件数" value={`${all.tipCount.toLocaleString("ja-JP")} 件`} icon={<HandCoins className="h-4 w-4" strokeWidth={1.75} />} />
          <Metric label="チップ合計金額" value={formatYen(all.tipTotal)} accent icon={<Wallet className="h-4 w-4" strokeWidth={1.75} />} />
          <Metric label="平均チップ" value={all.tipCount > 0 ? formatYen(Math.round(all.avgTip)) : "—"} icon={<Coins className="h-4 w-4" strokeWidth={1.75} />} />
          <Metric
            label="平均評価"
            value={all.reviewCount > 0 ? `${all.avgRating.toFixed(2)}（${all.reviewCount}件）` : "—"}
            icon={<Star className="h-4 w-4" strokeWidth={1.75} />}
          />
        </div>
      </section>

      <section>
        <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
          <h2 className="text-sm font-bold text-neutral-700">日別チップ推移</h2>
          <ReportRangeSelect
            selection={selection}
            fromISO={tokyoISODate(fromStart)}
            toISO={tokyoISODate(toStart)}
            todayISO={tokyoISODate(todayStart)}
          />
        </div>

        <div className="rounded-2xl border border-neutral-200 bg-white p-4">
          <div className="mb-4 flex flex-wrap gap-x-8 gap-y-2 border-b border-neutral-100 pb-4">
            <RangeStat label="期間合計" value={formatYen(rangeTotal)} accent />
            <RangeStat label="チップ件数" value={`${rangeCount.toLocaleString("ja-JP")} 件`} />
            <RangeStat label="1日平均" value={formatYen(Math.round(rangeTotal / dayCount))} />
            <RangeStat label="最高日" value={formatYen(maxTotal)} />
          </div>

          <div className="relative h-56">
            {yTicks.map((t, i) => (
              <div key={i} className="absolute inset-x-0 flex -translate-y-1/2 items-center" style={{ top: `${py(t)}%` }}>
                <span className="w-14 shrink-0 pr-2 text-right text-[10px] tabular-nums text-neutral-400">{formatYen(t)}</span>
                <span className="h-px flex-1 bg-neutral-100" />
              </div>
            ))}

            <div className="absolute inset-y-0 left-14 right-0">
              <svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                <polygon points={areaPoints} fill="var(--color-accent)" fillOpacity={0.1} />
                {n > 1 ? (
                  <polyline
                    points={linePoints}
                    fill="none"
                    stroke="var(--color-accent)"
                    strokeWidth={2}
                    vectorEffect="non-scaling-stroke"
                    strokeLinejoin="round"
                    strokeLinecap="round"
                  />
                ) : null}
              </svg>
              {days.map((d, i) => (
                <div
                  key={d.key}
                  className="absolute z-10 -translate-x-1/2 -translate-y-1/2"
                  style={{ left: `${px(i)}%`, top: `${py(d.total)}%` }}
                  title={`${d.key}（${d.weekday}）: ${formatYen(d.total)} ・ ${d.count}件`}
                >
                  <span
                    className={`block rounded-full border-2 border-white bg-[var(--color-accent)] ${
                      d.isToday ? "h-3.5 w-3.5" : "h-2.5 w-2.5"
                    }`}
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="mt-2 flex gap-1 border-t border-neutral-100 pt-2">
            <div className="w-14 shrink-0" />
            {days.map((d, i) => (
              <div
                key={d.key}
                className={`min-w-0 flex-1 text-center ${d.isToday ? "font-semibold text-neutral-700" : "text-neutral-400"}`}
              >
                {i % labelEveryNth === 0 ? (
                  <>
                    <p className="text-[10px] leading-tight">{d.key}</p>
                    {showValues ? (
                      <p className="text-[10px] font-medium leading-tight tabular-nums text-neutral-600">
                        {d.count > 0 ? formatYen(d.total) : "—"}
                      </p>
                    ) : null}
                  </>
                ) : null}
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

function Metric({
  label,
  value,
  delta,
  accent,
  icon,
}: {
  label: string;
  value: string;
  delta?: ReactNode;
  accent?: boolean;
  icon: ReactNode;
}) {
  return (
    <div
      className={`rounded-2xl border bg-white p-4 shadow-sm ${
        accent ? "border-[var(--color-accent)]/30 bg-[var(--color-accent)]/[0.04]" : "border-neutral-200"
      }`}
    >
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-neutral-500">{label}</p>
        <span
          className={`flex h-7 w-7 items-center justify-center rounded-full ${
            accent ? "bg-[var(--color-accent)]/15 text-[var(--color-accent)]" : "bg-neutral-100 text-neutral-400"
          }`}
        >
          {icon}
        </span>
      </div>
      <p className={`mt-2 text-2xl font-bold tracking-tight tabular-nums ${accent ? "text-[var(--color-accent)]" : "text-neutral-900"}`}>
        {value}
      </p>
      {delta ? (
        <div className="mt-1.5 flex items-center gap-1.5 text-xs">
          <span className="text-neutral-400">前日比</span>
          {delta}
        </div>
      ) : null}
    </div>
  );
}

/** Day-over-day change indicator (Japanese report style: ▲/▼ + %). */
function Delta({
  current,
  previous,
  suffix,
  absolute,
}: {
  current: number;
  previous: number;
  suffix?: string;
  absolute?: boolean;
}) {
  if (previous <= 0) {
    return current > 0 ? (
      <span className="font-medium text-emerald-600">新規</span>
    ) : (
      <span className="text-neutral-400">—</span>
    );
  }

  const diff = absolute ? current - previous : ((current - previous) / previous) * 100;
  if (Math.abs(diff) < 0.05) return <span className="tabular-nums text-neutral-400">±0.0{suffix ?? "%"}</span>;

  const up = diff > 0;
  return (
    <span className={`inline-flex items-center gap-0.5 font-medium tabular-nums ${up ? "text-emerald-600" : "text-red-500"}`}>
      {up ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
      {Math.abs(diff).toFixed(1)}
      {suffix ?? "%"}
    </span>
  );
}

function RangeStat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div>
      <p className="text-xs text-neutral-500">{label}</p>
      <p className={`mt-0.5 text-lg font-bold tabular-nums ${accent ? "text-[var(--color-accent)]" : "text-neutral-900"}`}>
        {value}
      </p>
    </div>
  );
}
