import { DashboardLive } from "@/components/admin/DashboardLive";
import { Stars } from "@/components/admin/Stars";
import { requireAdmin } from "@/lib/admin/auth";
import { formatTokyoTime, formatUsdApprox, formatYen, startOfTokyoDay } from "@/lib/admin/period";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function AdminNotificationsPage() {
  const { store } = await requireAdmin();
  const todayStart = startOfTokyoDay();

  const tips = await prisma.tip.findMany({
    where: { storeId: store.id, status: "succeeded" },
    include: { review: true },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return (
    <div className="flex flex-col gap-5">
      <DashboardLive storeId={store.id} />
      <div>
        <h1 className="text-xl font-bold">通知</h1>
        <p className="mt-1 text-sm text-neutral-500">新しいチップ・口コミが届くと自動で更新されます。</p>
      </div>

      {tips.length === 0 ? (
        <p className="rounded-2xl border border-neutral-200 bg-white p-10 text-center text-sm text-neutral-500">
          通知はまだありません。
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
          {tips.map((tip) => {
            const isNew = tip.createdAt >= todayStart;
            return (
              <li key={tip.id} className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {isNew ? (
                      <span className="rounded-full bg-red-600 px-2 py-0.5 text-[10px] font-bold text-white">新着</span>
                    ) : null}
                    <span className="text-xs text-neutral-500">{formatTokyoTime(tip.createdAt)}</span>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-[var(--color-accent)]">{formatYen(tip.amount)}</span>
                    <span className="block text-[11px] text-neutral-400">（{formatUsdApprox(tip.amount)}）</span>
                  </div>
                </div>
                {tip.review ? (
                  <div className="mt-2 flex items-center gap-2">
                    <Stars rating={tip.review.rating} />
                    <span className="text-xs text-neutral-500">{tip.review.rating.toFixed(1)}</span>
                  </div>
                ) : null}
                {tip.review?.comment ? <p className="mt-1 text-sm text-neutral-800">{tip.review.comment}</p> : null}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
