import { DashboardLive } from "@/components/admin/DashboardLive";
import { Pagination } from "@/components/admin/DataTable";
import { Stars } from "@/components/admin/Stars";
import { PendingSwap, TableNavProvider } from "@/components/admin/TableNav";
import { requireAdmin } from "@/lib/admin/auth";
import { formatTokyoTime, formatUsdApprox, formatYen, startOfTokyoDay } from "@/lib/admin/period";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 10;

function parsePage(value: string | undefined): number {
  const n = Number.parseInt(value ?? "1", 10);
  return Number.isFinite(n) && n > 0 ? n : 1;
}

const iconProps = {
  viewBox: "0 0 24 24",
  className: "h-5 w-5",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
};

function YenIcon() {
  return (
    <svg {...iconProps}>
      <circle cx="12" cy="12" r="9" />
      <path d="M9 8l3 4 3-4M9 13h6M9 16h6M12 12v4" />
    </svg>
  );
}

function ChatIcon() {
  return (
    <svg {...iconProps}>
      <path d="M4 6.5A2.5 2.5 0 0 1 6.5 4h11A2.5 2.5 0 0 1 20 6.5v7a2.5 2.5 0 0 1-2.5 2.5H9l-4 3v-3H6.5A2.5 2.5 0 0 1 4 13.5z" />
      <path d="M8 9h8M8 12.5h5" />
    </svg>
  );
}

export default async function AdminNotificationsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { store } = await requireAdmin();
  const { page: pageParam } = await searchParams;
  const todayStart = startOfTokyoDay();
  const where = { storeId: store.id, status: "succeeded" as const };

  const total = await prisma.tip.count({ where });
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const page = Math.min(parsePage(pageParam), pageCount);

  const tips = await prisma.tip.findMany({
    where,
    include: { review: true },
    orderBy: { createdAt: "desc" },
    skip: (page - 1) * PAGE_SIZE,
    take: PAGE_SIZE,
  });

  return (
    <div className="flex flex-col gap-5">
      <DashboardLive storeId={store.id} />
      <div>
        <h1 className="text-xl font-bold">通知</h1>
        <p className="mt-1 text-sm text-neutral-500">新しいチップ・口コミが届くと自動で更新されます。</p>
      </div>

      {total === 0 ? (
        <p className="rounded-2xl border border-neutral-200 bg-white p-10 text-center text-sm text-neutral-500">
          通知はまだありません。
        </p>
      ) : (
        <TableNavProvider>
          <PendingSwap>
            <ul className="flex flex-col gap-3">
              {tips.map((tip) => {
                const isNew = tip.createdAt >= todayStart;
                const hasReview = Boolean(tip.review);
                return (
                  <li
                    key={tip.id}
                    className={`flex gap-3 rounded-2xl border bg-white p-4 shadow-sm ${
                      isNew ? "border-[var(--color-accent)]/40" : "border-neutral-200"
                    }`}
                  >
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--color-accent)]/10 text-[var(--color-accent)]">
                      {hasReview ? <ChatIcon /> : <YenIcon />}
                    </span>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-3">
                        <p className="text-sm font-semibold text-neutral-900">
                          {hasReview ? "チップと口コミが届きました" : "チップが届きました"}
                        </p>
                        <div className="shrink-0 text-right">
                          <span className="font-bold text-[var(--color-accent)]">{formatYen(tip.amount)}</span>
                          <span className="block text-[11px] text-neutral-400">（{formatUsdApprox(tip.amount)}）</span>
                        </div>
                      </div>

                      <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-neutral-500">
                        {isNew ? (
                          <span className="rounded-full bg-red-600 px-1.5 py-0.5 text-[10px] font-bold text-white">新着</span>
                        ) : null}
                        <span>{formatTokyoTime(tip.createdAt)}</span>
                        {tip.review ? (
                          <span className="flex items-center gap-1">
                            <Stars rating={tip.review.rating} /> {tip.review.rating.toFixed(1)}
                          </span>
                        ) : null}
                      </div>

                      {tip.review?.comment ? (
                        <p className="mt-2 whitespace-pre-line rounded-lg bg-neutral-50 px-3 py-2 text-sm text-neutral-800">
                          {tip.review.comment}
                        </p>
                      ) : null}
                    </div>
                  </li>
                );
              })}
            </ul>
          </PendingSwap>

          <Pagination page={page} pageSize={PAGE_SIZE} total={total} basePath="/admin/notifications" />
        </TableNavProvider>
      )}
    </div>
  );
}
