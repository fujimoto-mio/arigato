import { DashboardLive } from "@/components/admin/DashboardLive";
import { Pagination } from "@/components/admin/DataTable";
import { type NotificationItem, NotificationsList } from "@/components/admin/NotificationsList";
import { PendingSwap, TableNavProvider } from "@/components/admin/TableNav";
import { requireAdmin } from "@/lib/admin/auth";
import { formatTokyoTime, formatUsdApprox, formatYen } from "@/lib/admin/period";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 10;

function parsePage(value: string | undefined): number {
  const n = Number.parseInt(value ?? "1", 10);
  return Number.isFinite(n) && n > 0 ? n : 1;
}

export default async function AdminNotificationsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { store, adminUserId } = await requireAdmin();
  const { page: pageParam } = await searchParams;
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

  // Which of this page's tips this admin has already opened.
  const reads = await prisma.notificationRead.findMany({
    where: { adminUserId, tipId: { in: tips.map((tip) => tip.id) } },
    select: { tipId: true },
  });
  const readSet = new Set(reads.map((read) => read.tipId));

  const items: NotificationItem[] = tips.map((tip) => ({
    id: tip.id,
    amountYen: formatYen(tip.amount),
    amountUsd: formatUsdApprox(tip.amount),
    createdAtLabel: formatTokyoTime(tip.createdAt),
    paymentLabel: tip.paymentMethod === "card" ? "カード" : "現金",
    isUnread: !readSet.has(tip.id),
    hasReview: Boolean(tip.review),
    rating: tip.review?.rating ?? null,
    comment: tip.review?.comment ?? null,
    photoUrls: tip.review?.photoUrls ?? [],
    redirectedToGoogle: tip.review?.redirectedToGoogle ?? false,
  }));

  return (
    <div className="flex flex-col gap-5">
      <DashboardLive storeId={store.id} />
      <div>
        <h1 className="text-xl font-bold">通知</h1>
        <p className="mt-1 text-sm text-neutral-500">新しいチップ・口コミが届くと自動で更新されます。項目をタップすると詳細が開きます。</p>
      </div>

      {total === 0 ? (
        <p className="rounded-2xl border border-neutral-200 bg-white p-10 text-center text-sm text-neutral-500">
          通知はまだありません。
        </p>
      ) : (
        <TableNavProvider>
          <PendingSwap>
            <NotificationsList items={items} />
          </PendingSwap>

          <Pagination page={page} pageSize={PAGE_SIZE} total={total} basePath="/admin/notifications" />
        </TableNavProvider>
      )}
    </div>
  );
}
