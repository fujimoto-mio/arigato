import { LiveTipFeed, type FeedTip } from "@/components/admin/LiveTipFeed";
import { requireAdmin } from "@/lib/admin/auth";
import { formatYen, startOfTokyoDay } from "@/lib/admin/period";
import { prisma } from "@/lib/prisma";

// Totals must reflect tips that landed seconds ago, so never serve this cached.
export const dynamic = "force-dynamic";

export default async function AdminLivePage() {
  const { store } = await requireAdmin();
  const todayStart = startOfTokyoDay();

  const [recentTips, todayAggregate, perStaffToday] = await Promise.all([
    prisma.tip.findMany({
      where: { storeId: store.id, status: "succeeded" },
      include: { staff: true },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
    prisma.tip.aggregate({
      where: { storeId: store.id, status: "succeeded", createdAt: { gte: todayStart } },
      _sum: { amount: true },
      _count: true,
    }),
    prisma.tip.groupBy({
      by: ["staffId"],
      where: { storeId: store.id, status: "succeeded", createdAt: { gte: todayStart } },
      _sum: { amount: true },
      _count: true,
    }),
  ]);

  const staffById = new Map(recentTips.map((tip) => [tip.staffId, tip.staff.name]));
  const missingStaffIds = perStaffToday
    .map((row) => row.staffId)
    .filter((staffId) => !staffById.has(staffId));

  if (missingStaffIds.length > 0) {
    const extra = await prisma.staff.findMany({ where: { id: { in: missingStaffIds } } });
    for (const member of extra) staffById.set(member.id, member.name);
  }

  const leaderboard = perStaffToday
    .map((row) => ({
      staffId: row.staffId,
      name: staffById.get(row.staffId) ?? "Unknown",
      total: row._sum.amount ?? 0,
      count: row._count,
    }))
    .sort((a, b) => b.total - a.total);

  const initialTips: FeedTip[] = recentTips.map((tip) => ({
    tipId: tip.id,
    staffName: tip.staff.name,
    amount: tip.amount,
    locale: tip.locale,
    createdAt: tip.createdAt.toISOString(),
  }));

  return (
    <div className="flex flex-col gap-8">
      <section className="grid grid-cols-2 gap-3">
        <div className="rounded-xl border border-neutral-200 p-4">
          <p className="text-xs text-neutral-500">Today&apos;s total</p>
          <p className="mt-1 text-2xl font-bold">{formatYen(todayAggregate._sum.amount ?? 0)}</p>
        </div>
        <div className="rounded-xl border border-neutral-200 p-4">
          <p className="text-xs text-neutral-500">Tips today</p>
          <p className="mt-1 text-2xl font-bold">{todayAggregate._count}</p>
        </div>
      </section>

      {leaderboard.length > 0 ? (
        <section>
          <h2 className="text-lg font-bold">By staff today</h2>
          <ul className="mt-3 flex flex-col gap-2">
            {leaderboard.map((row) => (
              <li
                key={row.staffId}
                className="flex items-center justify-between rounded-lg bg-neutral-50 px-4 py-3 text-sm"
              >
                <span className="font-medium">{row.name}</span>
                <span className="text-neutral-600">
                  {formatYen(row.total)} · {row.count}
                </span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <LiveTipFeed storeId={store.id} initialTips={initialTips} />
    </div>
  );
}
