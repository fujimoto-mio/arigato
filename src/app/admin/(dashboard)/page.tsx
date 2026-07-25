import { Armchair, Coins, HandCoins, MessageSquareText, Star, Wallet } from "lucide-react";
import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { DashboardLive } from "@/components/admin/DashboardLive";
import { type Column, DataTable } from "@/components/admin/DataTable";
import { Stars } from "@/components/admin/Stars";
import { GoogleIcon } from "@/components/flow/brand";
import { requireAdmin } from "@/lib/admin/auth";
import { formatTokyoTime, formatUsdApprox, formatYen, startOfTokyoDay } from "@/lib/admin/period";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

type TipWithReview = Prisma.TipGetPayload<{ include: { review: true } }>;

function tableText(label: string | null) {
  return label ? `${label}番` : "—";
}

export default async function AdminDashboardPage() {
  const { store } = await requireAdmin();
  const todayStart = startOfTokyoDay();
  const todayWhere = { storeId: store.id, status: "succeeded" as const, createdAt: { gte: todayStart } };

  const [tips, tipsAgg, reviewsAgg] = await Promise.all([
    prisma.tip.findMany({
      where: { storeId: store.id, status: "succeeded" },
      include: { review: true },
      orderBy: { createdAt: "desc" },
      take: 12,
    }),
    prisma.tip.aggregate({ where: todayWhere, _sum: { amount: true }, _count: true }),
    prisma.review.aggregate({
      where: { storeId: store.id, createdAt: { gte: todayStart } },
      _count: true,
      _avg: { rating: true },
    }),
  ]);

  const latest = tips[0] ?? null;
  const latestIsToday = latest ? latest.createdAt >= todayStart : false;

  return (
    <div className="flex flex-col gap-6">
      <DashboardLive storeId={store.id} />

      <section>
        <h2 className="text-sm font-bold text-neutral-700">本日のサマリー</h2>
        <div className="mt-3 grid grid-cols-2 gap-3 md:grid-cols-4">
          <KpiCard label="本日のチップ件数" value={`${tipsAgg._count} 件`} icon={<HandCoins className="h-4 w-4" strokeWidth={1.75} />} />
          <KpiCard
            label="本日の合計金額"
            value={formatYen(tipsAgg._sum.amount ?? 0)}
            accent
            icon={<Wallet className="h-4 w-4" strokeWidth={1.75} />}
          />
          <KpiCard
            label="本日の口コミ件数"
            value={`${reviewsAgg._count} 件`}
            icon={<MessageSquareText className="h-4 w-4" strokeWidth={1.75} />}
          />
          <KpiCard
            label="本日の平均評価"
            value={reviewsAgg._avg.rating ? reviewsAgg._avg.rating.toFixed(1) : "—"}
            icon={<Star className="h-4 w-4" strokeWidth={1.75} />}
          />
        </div>
      </section>

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

function KpiCard({
  label,
  value,
  accent,
  icon,
}: {
  label: string;
  value: string;
  accent?: boolean;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-medium text-neutral-500">{label}</p>
        <span
          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
            accent ? "bg-[var(--color-accent)]/10 text-[var(--color-accent)]" : "bg-neutral-100 text-neutral-400"
          }`}
        >
          {icon}
        </span>
      </div>
      <p className={`mt-2 text-2xl font-bold ${accent ? "text-[var(--color-accent)]" : "text-neutral-900"}`}>{value}</p>
    </div>
  );
}

function NewArrivalBanner({ tip, isNew }: { tip: TipWithReview; isNew: boolean }) {
  return (
    <div className="flex items-start gap-4">
      <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border-2 border-[var(--color-accent)] text-[var(--color-accent)]">
        <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M6 9a6 6 0 0 1 12 0c0 5 2 6 2 6H4s2-1 2-6" />
          <path d="M10 20a2 2 0 0 0 4 0" />
        </svg>
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

function StatCol({ label, icon, children }: { label: string; icon?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-2 px-2 text-center">
      <p className="text-xs font-bold text-neutral-600">{label}</p>
      <div className="flex items-center justify-center gap-2 text-lg font-bold">
        {icon ? <span className="shrink-0 text-[var(--color-accent)]">{icon}</span> : null}
        <div>{children}</div>
      </div>
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

      <div className="mt-5 grid grid-cols-2 gap-4 border-y border-neutral-100 py-5 sm:grid-cols-4 sm:divide-x sm:divide-neutral-100">
        <StatCol label="テーブル番号" icon={<Armchair className="h-6 w-6" strokeWidth={1.6} />}>
          {tableText(tip.tableLabel)}
        </StatCol>
        <StatCol label="チップ金額" icon={<Coins className="h-6 w-6" strokeWidth={1.6} />}>
          <span className="text-[var(--color-accent)]">{formatYen(tip.amount)}</span>
          <span className="mt-0.5 block text-[11px] font-normal text-neutral-400">（{formatUsdApprox(tip.amount)}）</span>
        </StatCol>
        <StatCol label="評価" icon={<Star className="h-6 w-6" strokeWidth={1.6} />}>
          {review ? (
            <span className="flex flex-col items-center">
              <Stars rating={review.rating} />
              <span className="text-sm">{review.rating.toFixed(1)}</span>
            </span>
          ) : (
            "—"
          )}
        </StatCol>
        <StatCol label="口コミ" icon={<MessageSquareText className="h-6 w-6" strokeWidth={1.6} />}>
          {review?.comment ? "あり" : "—"}
        </StatCol>
      </div>

      {review?.comment ? (
        <div className="mt-5">
          <p className="text-sm font-bold text-neutral-700">口コミ内容</p>
          <p className="mt-2 whitespace-pre-line rounded-xl bg-neutral-50 p-4 text-sm text-neutral-800">{review.comment}</p>
        </div>
      ) : null}

      {review && review.photoUrls.length > 0 ? (
        <div className="mt-5">
          <p className="text-sm font-bold text-neutral-700">投稿写真</p>
          {/* 4 per row on mobile; fixed 6rem thumbnails (wrapping) on desktop. */}
          <div className="mt-2 grid grid-cols-4 gap-2 sm:grid-cols-[repeat(auto-fill,6rem)] sm:gap-3">
            {review.photoUrls.map((url) => (
              <a
                key={url}
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="relative aspect-square overflow-hidden rounded-xl bg-neutral-100"
              >
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
      key: "table",
      header: "テーブル番号",
      className: "whitespace-nowrap",
      render: (tip) => tableText(tip.tableLabel),
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
      className: "min-w-[200px] max-w-[340px] whitespace-pre-line leading-relaxed text-neutral-700",
      render: (tip) => tip.review?.comment ?? <span className="text-neutral-400">—</span>,
    },
    {
      key: "photos",
      header: "投稿写真",
      render: (tip) => {
        const photos = tip.review?.photoUrls ?? [];
        return photos.length > 0 ? (
          <div className="flex gap-1">
            {photos.slice(0, 3).map((url) => (
              // Guest-uploaded Supabase URLs; plain img avoids remote-loader config.
              // eslint-disable-next-line @next/next/no-img-element
              <img key={url} src={url} alt="投稿写真" className="h-8 w-8 rounded object-cover" />
            ))}
            {photos.length > 3 ? <span className="self-center text-xs text-neutral-400">+{photos.length - 3}</span> : null}
          </div>
        ) : (
          <span className="text-neutral-400">—</span>
        );
      },
    },
    {
      key: "guide",
      header: "口コミ誘導",
      className: "whitespace-nowrap",
      render: (tip) =>
        tip.review?.redirectedToGoogle ? (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--color-accent)]/10 px-2.5 py-1 text-xs font-medium text-[var(--color-accent)]">
            <GoogleIcon size={14} /> Googleに誘導
          </span>
        ) : (
          <span className="text-neutral-400">—</span>
        ),
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
        bodyCellClassName="align-top"
        emptyLabel="まだチップ・口コミはありません。"
      />
    </section>
  );
}
