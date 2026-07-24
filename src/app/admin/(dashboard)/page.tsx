import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { DashboardLive } from "@/components/admin/DashboardLive";
import { type Column, DataTable } from "@/components/admin/DataTable";
import { Stars } from "@/components/admin/Stars";
import { requireAdmin } from "@/lib/admin/auth";
import { formatTokyoTime, formatUsdApprox, formatYen, startOfTokyoDay } from "@/lib/admin/period";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

type TipWithReview = Prisma.TipGetPayload<{ include: { review: true } }>;

export default async function AdminDashboardPage() {
  const { store } = await requireAdmin();
  const todayStart = startOfTokyoDay();

  const tips = await prisma.tip.findMany({
    where: { storeId: store.id, status: "succeeded" },
    include: { review: true },
    orderBy: { createdAt: "desc" },
    take: 12,
  });

  const latest = tips[0] ?? null;
  const latestIsToday = latest ? latest.createdAt >= todayStart : false;

  return (
    <div className="flex flex-col gap-6">
      <DashboardLive storeId={store.id} />

      {latest ? (
        <>
          <NewArrivalBanner tip={latest} isNew={latestIsToday} />
          <DetailCard tip={latest} isNew={latestIsToday} />
        </>
      ) : (
        <div className="rounded-2xl border border-neutral-200 bg-white p-10 text-center text-sm text-neutral-500">
          まだチップ・口コミはありません。届くとここにリアルタイムで表示されます。
        </div>
      )}

      <RecentList tips={tips} />
    </div>
  );
}

function NewArrivalBanner({ tip, isNew }: { tip: TipWithReview; isNew: boolean }) {
  return (
    <div className="flex items-start gap-4">
      <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border-2 border-[var(--color-accent)] text-2xl text-[var(--color-accent)]">
        🔔
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-3">
          <h2 className="text-xl font-bold md:text-2xl">新しいチップ・口コミが届きました！</h2>
          {isNew ? <span className="rounded-full bg-red-600 px-2 py-0.5 text-[10px] font-bold text-white">新着</span> : null}
        </div>
        <p className="mt-1 text-sm text-neutral-500">お客様からチップと口コミが投稿されました。</p>
      </div>
      <p className="hidden shrink-0 text-xs text-neutral-400 sm:block">受信日時：{formatTokyoTime(tip.createdAt)}</p>
    </div>
  );
}

function StatCol({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-1 px-2 text-center">
      <p className="text-xs text-neutral-500">{label}</p>
      <div className="text-lg font-bold">{children}</div>
    </div>
  );
}

function DetailCard({ tip, isNew }: { tip: TipWithReview; isNew: boolean }) {
  const review = tip.review;
  return (
    <section className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
      <div className="flex items-center gap-3">
        {isNew ? <span className="rounded-full bg-red-600 px-2 py-0.5 text-[10px] font-bold text-white">新着</span> : null}
        <span className="text-xs text-neutral-500">受信日時：{formatTokyoTime(tip.createdAt)}</span>
      </div>

      <div className="mt-5 grid grid-cols-3 gap-4 border-y border-neutral-100 py-5 sm:divide-x sm:divide-neutral-100">
        <StatCol label="チップ金額">
          <span className="text-[var(--color-accent)]">{formatYen(tip.amount)}</span>
          <span className="mt-0.5 block text-[11px] font-normal text-neutral-400">（{formatUsdApprox(tip.amount)}）</span>
        </StatCol>
        <StatCol label="評価">
          {review ? (
            <span className="flex flex-col items-center">
              <Stars rating={review.rating} />
              <span className="text-sm">{review.rating.toFixed(1)}</span>
            </span>
          ) : (
            "—"
          )}
        </StatCol>
        <StatCol label="口コミ">{review?.comment ? "💬" : "—"}</StatCol>
      </div>

      {review?.comment ? (
        <div className="mt-5">
          <p className="text-sm font-medium text-neutral-700">口コミ内容（原文のまま）</p>
          <p className="mt-2 whitespace-pre-line rounded-xl bg-neutral-50 p-4 text-sm text-neutral-800">{review.comment}</p>
        </div>
      ) : null}

      {review && review.photoUrls.length > 0 ? (
        <div className="mt-5">
          <p className="text-sm font-medium text-neutral-700">投稿写真</p>
          <div className="mt-2 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {review.photoUrls.map((url) => (
              <a key={url} href={url} target="_blank" rel="noopener noreferrer" className="relative aspect-square overflow-hidden rounded-xl bg-neutral-100">
                {/* Guest-uploaded Supabase URLs; plain img avoids remote-loader config. */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={url} alt="投稿写真" className="h-full w-full object-cover" />
              </a>
            ))}
          </div>
          <p className="mt-2 text-xs text-neutral-400">※写真をクリックすると拡大表示されます</p>
        </div>
      ) : null}
    </section>
  );
}

function RecentList({ tips }: { tips: TipWithReview[] }) {
  const columns: Column<TipWithReview>[] = [
    {
      key: "createdAt",
      header: "受信日時",
      className: "whitespace-nowrap text-neutral-600",
      render: (tip) => formatTokyoTime(tip.createdAt),
    },
    {
      key: "amount",
      header: "チップ金額",
      className: "whitespace-nowrap",
      render: (tip) => (
        <>
          <span className="font-bold">{formatYen(tip.amount)}</span>
          <span className="block text-[11px] text-neutral-400">（{formatUsdApprox(tip.amount)}）</span>
        </>
      ),
    },
    {
      key: "rating",
      header: "評価",
      className: "whitespace-nowrap",
      render: (tip) =>
        tip.review ? (
          <span className="flex items-center gap-1">
            <Stars rating={tip.review.rating} /> <span className="text-xs">{tip.review.rating.toFixed(1)}</span>
          </span>
        ) : (
          <span className="text-neutral-400">—</span>
        ),
    },
    {
      key: "comment",
      header: "口コミ",
      className: "max-w-[220px] truncate text-neutral-600",
      render: (tip) => tip.review?.comment ?? "—",
    },
  ];

  return (
    <section>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-lg font-bold">最近のチップ・口コミ一覧</h2>
        <Link href="/admin/tips" className="text-sm font-medium text-[var(--color-accent)]">
          一覧を見る ›
        </Link>
      </div>

      <DataTable
        columns={columns}
        rows={tips}
        rowKey={(tip) => tip.id}
        rowClassName={(_, index) => (index === 0 ? "bg-[var(--color-accent)]/5" : "")}
        emptyLabel="まだチップ・口コミはありません。"
      />
    </section>
  );
}
