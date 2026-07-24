import type { ReactNode } from "react";
import { ReportRangeSelect } from "@/components/admin/ReportRangeSelect";
import { requireAdmin } from "@/lib/admin/auth";
import { formatYen, startOfTokyoDay, startOfTokyoDaysAgo } from "@/lib/admin/period";
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

function parseTokyoDate(value: string | undefined): Date | null {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const [y, m, d] = value.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d) - TOKYO_OFFSET_MS);
  return Number.isNaN(dt.getTime()) ? null : dt;
}

async function periodStats(storeId: string, since?: Date) {
  const where = { storeId, status: "succeeded" as const, ...(since ? { createdAt: { gte: since } } : {}) };
  const reviewWhere = { storeId, ...(since ? { createdAt: { gte: since } } : {}) };
  const [tips, reviews] = await Promise.all([
    prisma.tip.aggregate({ where, _sum: { amount: true }, _count: true }),
    prisma.review.aggregate({ where: reviewWhere, _count: true, _avg: { rating: true } }),
  ]);
  return {
    tipCount: tips._count,
    tipTotal: tips._sum.amount ?? 0,
    reviewCount: reviews._count,
    avgRating: reviews._avg.rating,
  };
}

export default async function AdminReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string; from?: string; to?: string }>;
}) {
  const { store } = await requireAdmin();
  const { range, from, to } = await searchParams;
  const todayStart = startOfTokyoDay();

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

  const [today, all, rangeTips] = await Promise.all([
    periodStats(store.id, todayStart),
    periodStats(store.id),
    prisma.tip.findMany({
      where: { storeId: store.id, status: "succeeded", createdAt: { gte: fromStart, lt: rangeEndExclusive } },
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
  // value 0 sits at the baseline (96), the peak near the top (6).
  const n = days.length;
  const px = (i: number) => ((i + 0.5) / n) * 100;
  const py = (total: number) => 96 - (total / maxTotal) * 90;
  const baseY = py(0).toFixed(2);
  const linePoints = days.map((d, i) => `${px(i).toFixed(2)},${py(d.total).toFixed(2)}`).join(" ");
  const areaPoints = `${px(0).toFixed(2)},${baseY} ${linePoints} ${px(n - 1).toFixed(2)},${baseY}`;
  // Y-axis ticks (top → bottom).
  const yTicks = [1, 0.75, 0.5, 0.25, 0].map((f) => Math.round(maxTotal * f));

  const labelEveryNth = dayCount <= 14 ? 1 : Math.ceil(dayCount / 12);
  const showValues = dayCount <= 10;

  return (
    <div className="flex flex-col gap-8">
      <h1 className="text-xl font-bold">レポート</h1>

      {[
        { title: "本日", s: today },
        { title: "累計", s: all },
      ].map(({ title, s }) => (
        <section key={title}>
          <h2 className="mb-3 text-sm font-bold text-neutral-700">{title}</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Metric label="チップ件数" value={`${s.tipCount} 件`} icon={<CountIcon />} />
            <Metric label="チップ合計金額" value={formatYen(s.tipTotal)} accent icon={<YenIcon />} />
            <Metric
              label="平均チップ"
              value={s.tipCount > 0 ? formatYen(Math.round(s.tipTotal / s.tipCount)) : "—"}
              icon={<YenIcon />}
            />
            <Metric
              label="平均評価"
              value={s.avgRating ? s.avgRating.toFixed(2) : `— (${s.reviewCount}件)`}
              icon={<StarIcon />}
            />
          </div>
        </section>
      ))}

      <section>
        <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
          <h2 className="text-sm font-bold text-neutral-700">日別チップ</h2>
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
            <RangeStat label="チップ件数" value={`${rangeCount} 件`} />
            <RangeStat label="1日平均" value={formatYen(Math.round(rangeTotal / dayCount))} />
            <RangeStat label="最高日" value={formatYen(maxTotal)} />
          </div>

          <div className="relative h-56">
            {/* Y axis: amount ticks with gridlines. */}
            {yTicks.map((t, i) => (
              <div key={i} className="absolute inset-x-0 flex -translate-y-1/2 items-center" style={{ top: `${py(t)}%` }}>
                <span className="w-14 shrink-0 pr-2 text-right text-[10px] tabular-nums text-neutral-400">{formatYen(t)}</span>
                <span className="h-px flex-1 bg-neutral-100" />
              </div>
            ))}

            {/* Plot, offset right of the axis gutter. */}
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
                      <p className="text-[10px] font-medium leading-tight text-neutral-600">
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
  accent,
  icon,
}: {
  label: string;
  value: string;
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
      <p className={`mt-2 text-2xl font-bold tracking-tight ${accent ? "text-[var(--color-accent)]" : "text-neutral-900"}`}>
        {value}
      </p>
    </div>
  );
}

function RangeStat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div>
      <p className="text-xs text-neutral-500">{label}</p>
      <p className={`mt-0.5 text-lg font-bold ${accent ? "text-[var(--color-accent)]" : "text-neutral-900"}`}>{value}</p>
    </div>
  );
}

const metricIconProps = {
  viewBox: "0 0 24 24",
  className: "h-4 w-4",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
};

function CountIcon() {
  return (
    <svg {...metricIconProps}>
      <path d="M8 6h11M8 12h11M8 18h11" />
      <path d="M4 6h.01M4 12h.01M4 18h.01" />
    </svg>
  );
}

function YenIcon() {
  return (
    <svg {...metricIconProps}>
      <path d="M7 5l5 7 5-7M9 12h6M9 16h6M12 12v6" />
    </svg>
  );
}

function StarIcon() {
  return (
    <svg {...metricIconProps}>
      <path d="M12 3l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.9 6.8 19.2l1-5.8L3.5 9.2l5.9-.9z" />
    </svg>
  );
}
