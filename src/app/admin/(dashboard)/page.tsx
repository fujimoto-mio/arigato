import { LiveTipFeed, type FeedTip } from "@/components/admin/LiveTipFeed";
import { requireAdmin } from "@/lib/admin/auth";
import { formatYen, startOfTokyoDay } from "@/lib/admin/period";
import { prisma } from "@/lib/prisma";

// Totals must reflect tips that landed seconds ago, so never serve this cached.
export const dynamic = "force-dynamic";

export default async function AdminLivePage() {
  const { store } = await requireAdmin();
  const todayStart = startOfTokyoDay();

  const [recentTips, todayTips, todayReviews] = await Promise.all([
    prisma.tip.findMany({
      where: { storeId: store.id, status: "succeeded" },
      include: { review: true },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
    prisma.tip.aggregate({
      where: { storeId: store.id, status: "succeeded", createdAt: { gte: todayStart } },
      _sum: { amount: true },
      _count: true,
    }),
    prisma.review.aggregate({
      where: { storeId: store.id, createdAt: { gte: todayStart } },
      _count: true,
      _avg: { rating: true },
    }),
  ]);

  const initialTips: FeedTip[] = recentTips.map((tip) => ({
    tipId: tip.id,
    amount: tip.amount,
    tableLabel: tip.tableLabel,
    paymentMethod: tip.paymentMethod,
    locale: tip.locale,
    createdAt: tip.createdAt.toISOString(),
    rating: tip.review?.rating ?? null,
    comment: tip.review?.comment ?? null,
    photoUrls: tip.review?.photoUrls ?? [],
  }));

  const avgRating = todayReviews._avg.rating;

  return (
    <div className="flex flex-col gap-8">
      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <SummaryCard label="Tips today" value={String(todayTips._count)} />
        <SummaryCard label="Total today" value={formatYen(todayTips._sum.amount ?? 0)} />
        <SummaryCard label="Reviews today" value={String(todayReviews._count)} />
        <SummaryCard label="Avg rating" value={avgRating ? avgRating.toFixed(1) : "—"} />
      </section>

      <LiveTipFeed storeId={store.id} initialTips={initialTips} />
    </div>
  );
}

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-neutral-200 p-4">
      <p className="text-xs text-neutral-500">{label}</p>
      <p className="mt-1 text-2xl font-bold">{value}</p>
    </div>
  );
}
