import { requireAdmin } from "@/lib/admin/auth";
import { formatYen, startOfTokyoDay, startOfTokyoDaysAgo } from "@/lib/admin/period";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

function tokyoDayKey(value: Date): string {
  return new Date(value).toLocaleDateString("ja-JP", {
    timeZone: "Asia/Tokyo",
    month: "2-digit",
    day: "2-digit",
  });
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

export default async function AdminReportsPage() {
  const { store } = await requireAdmin();
  const todayStart = startOfTokyoDay();
  const weekStart = startOfTokyoDaysAgo(6); // last 7 days incl. today

  const [today, week, all, weekTips] = await Promise.all([
    periodStats(store.id, todayStart),
    periodStats(store.id, weekStart),
    periodStats(store.id),
    prisma.tip.findMany({
      where: { storeId: store.id, status: "succeeded", createdAt: { gte: weekStart } },
      select: { amount: true, createdAt: true },
    }),
  ]);

  // Bucket the last 7 Tokyo days.
  const days: { key: string; total: number; count: number }[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = startOfTokyoDaysAgo(i);
    days.push({ key: tokyoDayKey(d), total: 0, count: 0 });
  }
  const byKey = new Map(days.map((d) => [d.key, d]));
  for (const tip of weekTips) {
    const bucket = byKey.get(tokyoDayKey(tip.createdAt));
    if (bucket) {
      bucket.total += tip.amount;
      bucket.count += 1;
    }
  }
  const maxTotal = Math.max(1, ...days.map((d) => d.total));

  return (
    <div className="flex flex-col gap-8">
      <h1 className="text-xl font-bold">レポート</h1>

      {[
        { title: "本日", s: today },
        { title: "直近7日間", s: week },
        { title: "累計", s: all },
      ].map(({ title, s }) => (
        <section key={title}>
          <h2 className="mb-3 text-sm font-bold text-neutral-700">{title}</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Metric label="チップ件数" value={`${s.tipCount} 件`} />
            <Metric label="チップ合計金額" value={formatYen(s.tipTotal)} />
            <Metric label="口コミ件数" value={`${s.reviewCount} 件`} />
            <Metric label="平均評価" value={s.avgRating ? s.avgRating.toFixed(2) : "—"} />
          </div>
        </section>
      ))}

      <section>
        <h2 className="mb-3 text-sm font-bold text-neutral-700">日別チップ（直近7日間）</h2>
        <div className="flex flex-col gap-2 rounded-2xl border border-neutral-200 bg-white p-4">
          {days.map((d) => (
            <div key={d.key} className="flex items-center gap-3 text-sm">
              <span className="w-14 shrink-0 text-neutral-500">{d.key}</span>
              <div className="h-4 flex-1 overflow-hidden rounded-full bg-neutral-100">
                <div className="h-full rounded-full bg-[var(--color-accent)]" style={{ width: `${(d.total / maxTotal) * 100}%` }} />
              </div>
              <span className="w-24 shrink-0 text-right font-medium">{formatYen(d.total)}</span>
              <span className="w-12 shrink-0 text-right text-xs text-neutral-400">{d.count}件</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-4">
      <p className="text-xs text-neutral-500">{label}</p>
      <p className="mt-1 text-xl font-bold">{value}</p>
    </div>
  );
}
