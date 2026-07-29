import { ArrowDown, ArrowUp, Coins, HandCoins, Star, Wallet } from "lucide-react";
import type { ReactNode } from "react";
import { ReportChart } from "@/components/admin/ReportChart";
import { formatYen, startOfTokyoDay, startOfTokyoDaysAgo } from "@/lib/admin/period";
import { getReportChart } from "@/lib/admin/report-chart";
import { getActiveStore, storeScope } from "@/lib/admin/store-scope";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

function tokyoLongDate(value: Date): string {
  return new Date(value).toLocaleDateString("ja-JP", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "short",
  });
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

  const [today, yesterday, all, chart] = await Promise.all([
    periodStats(scope, todayStart),
    periodStats(scope, yesterdayStart, todayStart),
    periodStats(scope),
    // Initial chart data; the client component refetches just this on range change.
    getReportChart(scope, { range, from, to }),
  ]);

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-xl font-bold">レポート</h1>
        <p className="mt-1 text-sm text-neutral-500">集計日：{tokyoLongDate(todayStart)}</p>
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

      <ReportChart initial={chart} />
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
