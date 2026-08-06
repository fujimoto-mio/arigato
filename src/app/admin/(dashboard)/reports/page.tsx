import type { SubscriptionStatus } from "@prisma/client";
import { ArrowDown, ArrowUp, Coins, CreditCard, HandCoins, Star, Wallet } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { ReportChart } from "@/components/admin/ReportChart";
import { formatUsd, startOfTokyoDay, startOfTokyoDaysAgo } from "@/lib/admin/period";
import { getReportChart } from "@/lib/admin/report-chart";
import { getActiveStore, storeScope } from "@/lib/admin/store-scope";
import { prisma } from "@/lib/prisma";
import { isStoreAcceptingTips, subscriptionBadge } from "@/lib/subscription";

export const dynamic = "force-dynamic";

function tokyoLongDate(value: Date): string {
  // Date already holds the JST wall-clock in its UTC components (see @/lib/prisma).
  return new Date(value).toLocaleDateString("ja-JP", {
    timeZone: "UTC",
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
  const { activeStoreId, canSwitch } = await getActiveStore();
  const scope = storeScope(activeStoreId);
  const { range, from, to } = await searchParams;
  const todayStart = startOfTokyoDay();
  const yesterdayStart = startOfTokyoDaysAgo(1);

  const [today, yesterday, all, chart, subStores] = await Promise.all([
    periodStats(scope, todayStart),
    periodStats(scope, yesterdayStart, todayStart),
    periodStats(scope),
    // Initial chart data; the client component refetches just this on range change.
    getReportChart(scope, { range, from, to }),
    // Subscription state per store: just the active store, or every live store for
    // the all-stores (platform-admin) view.
    prisma.store.findMany({
      where: { deletedAt: null, ...(activeStoreId ? { id: activeStoreId } : {}) },
      select: {
        id: true,
        name: true,
        status: true,
        subscriptionStatus: true,
        subscriptionCurrentPeriodEnd: true,
      },
      orderBy: { name: "asc" },
    }),
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
            value={formatUsd(today.tipTotal)}
            accent
            delta={<Delta current={today.tipTotal} previous={yesterday.tipTotal} />}
            icon={<Wallet className="h-4 w-4" strokeWidth={1.75} />}
          />
          <Metric
            label="平均チップ"
            value={today.tipCount > 0 ? formatUsd(Math.round(today.avgTip)) : "—"}
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
          <Metric label="チップ合計金額" value={formatUsd(all.tipTotal)} accent icon={<Wallet className="h-4 w-4" strokeWidth={1.75} />} />
          <Metric label="平均チップ" value={all.tipCount > 0 ? formatUsd(Math.round(all.avgTip)) : "—"} icon={<Coins className="h-4 w-4" strokeWidth={1.75} />} />
          <Metric
            label="平均評価"
            value={all.reviewCount > 0 ? `${all.avgRating.toFixed(2)}（${all.reviewCount}件）` : "—"}
            icon={<Star className="h-4 w-4" strokeWidth={1.75} />}
          />
        </div>
      </section>

      <SubscriptionSection stores={subStores} allStores={activeStoreId === null} isOperator={!canSwitch} />

      {/* Keyed on the active store so switching stores remounts the chart with
          the new store's data (client state is seeded from `initial` on mount). */}
      <ReportChart key={activeStoreId ?? "all"} initial={chart} />
    </div>
  );
}

const SUB_TONE = {
  emerald: "bg-emerald-50 text-emerald-700 ring-emerald-500/20",
  amber: "bg-amber-50 text-amber-700 ring-amber-500/20",
  rose: "bg-rose-50 text-rose-600 ring-rose-500/20",
  neutral: "bg-neutral-100 text-neutral-500 ring-neutral-300",
} as const;

type SubStore = {
  id: string;
  name: string;
  status: string;
  subscriptionStatus: SubscriptionStatus;
  subscriptionCurrentPeriodEnd: Date | null;
};

// A real Stripe instant → JST calendar date, labelled by what it means.
function subPeriodLabel(status: SubscriptionStatus, end: Date | null): string | null {
  if (!end) return null;
  const d = new Date(end).toLocaleDateString("ja-JP", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  if (status === "trialing") return `トライアル終了 ${d}`;
  if (status === "active") return `次回更新 ${d}`;
  return null;
}

/**
 * Per-store subscription overview. In the all-stores view it lists every store
 * with summary counts; scoped to one store (or an operator) it shows just that
 * store, with a shortcut to manage the subscription.
 */
function SubscriptionSection({
  stores,
  allStores,
  isOperator,
}: {
  stores: SubStore[];
  allStores: boolean;
  isOperator: boolean;
}) {
  if (stores.length === 0) return null;

  const counts: Record<SubscriptionStatus, number> = {
    none: 0,
    trialing: 0,
    active: 0,
    past_due: 0,
    canceled: 0,
  };
  for (const s of stores) counts[s.subscriptionStatus] += 1;

  return (
    <section>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-sm font-bold text-neutral-700">
          <CreditCard className="h-4 w-4 text-neutral-400" strokeWidth={1.75} />
          購読状況{allStores ? "（店舗別）" : ""}
        </h2>
        <Link
          href={isOperator ? "/admin/subscription" : "/admin/stores"}
          className="text-sm font-medium text-[var(--color-accent)]"
        >
          {isOperator ? "購読を管理" : "店舗管理"} ›
        </Link>
      </div>

      {allStores ? (
        <div className="mb-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <SubCount label="購読中" value={counts.active} tone="emerald" />
          <SubCount label="トライアル中" value={counts.trialing} tone="amber" />
          <SubCount label="支払い遅延" value={counts.past_due} tone="rose" />
          <SubCount label="未購読" value={counts.none + counts.canceled} tone="neutral" />
        </div>
      ) : null}

      <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-neutral-50 text-xs text-neutral-500">
              <tr>
                <th className="px-4 py-2.5 text-left font-medium">店舗</th>
                <th className="px-4 py-2.5 text-left font-medium">購読ステータス</th>
                <th className="px-4 py-2.5 text-left font-medium">期限</th>
                <th className="px-4 py-2.5 text-left font-medium">公開</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {stores.map((s) => {
                const badge = subscriptionBadge(s.subscriptionStatus);
                const period = subPeriodLabel(s.subscriptionStatus, s.subscriptionCurrentPeriodEnd);
                const live = isStoreAcceptingTips(s.status);
                return (
                  <tr key={s.id}>
                    <td className="whitespace-nowrap px-4 py-3 font-medium text-neutral-800">{s.name}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-medium ring-1 ring-inset ${SUB_TONE[badge.tone]}`}
                      >
                        {badge.label}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 tabular-nums text-neutral-600">{period ?? "—"}</td>
                    <td className="px-4 py-3">
                      {live ? (
                        <span className="inline-flex items-center gap-1.5 whitespace-nowrap text-xs font-medium text-emerald-700">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                          公開中
                        </span>
                      ) : (
                        <span className="text-xs text-neutral-400">未公開</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

function SubCount({ label, value, tone }: { label: string; value: number; tone: keyof typeof SUB_TONE }) {
  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-3">
      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ring-1 ring-inset ${SUB_TONE[tone]}`}>
        {label}
      </span>
      <p className="mt-2 text-xl font-bold text-neutral-900">
        {value} <span className="text-sm font-medium text-neutral-400">店</span>
      </p>
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
