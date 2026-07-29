import type { ReactNode } from "react";
import { type Column, DataTable } from "@/components/admin/DataTable";
import { DetailRow } from "@/components/admin/RowModal";
import { Stars } from "@/components/admin/Stars";
import { TableNavProvider } from "@/components/admin/TableNav";
import { GoogleIcon } from "@/components/flow/brand";
import { formatTokyoTime, formatYen } from "@/lib/admin/period";
import { getActiveStore, storeScope } from "@/lib/admin/store-scope";
import { prisma } from "@/lib/prisma";
import { PUBLIC_REVIEW_MIN_RATING } from "@/lib/review";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 10;
// The 要対応 (≤3★) table is action-focused, so it shows fewer rows per page.
const PRIVATE_PAGE_SIZE = 5;

type ReviewRow = {
  id: string;
  rating: number;
  comment: string | null;
  createdAt: Date;
  redirectedToGoogle: boolean;
  storeName: string;
  amount: number;
  photoUrls: string[];
};

function parsePage(value: string | undefined): number {
  const n = Number.parseInt(value ?? "1", 10);
  return Number.isFinite(n) && n > 0 ? n : 1;
}

function reviewDetail(row: ReviewRow): { title: string; body: ReactNode } {
  return {
    title: "口コミ詳細",
    body: (
      <>
        <div className="rounded-xl border border-neutral-100 p-5 text-center">
          <p className="text-4xl font-bold text-[var(--color-accent)]">{formatYen(row.amount)}</p>
        </div>
        <dl className="mt-4 divide-y divide-neutral-100 text-sm">
          <DetailRow label="店舗" value={row.storeName} />
          <DetailRow label="受信日時" value={formatTokyoTime(row.createdAt)} />
          <DetailRow label="評価">
            <span className="flex items-center justify-end gap-1">
              <Stars rating={row.rating} /> {row.rating.toFixed(1)}
            </span>
          </DetailRow>
          <DetailRow label="口コミ誘導">
            {row.redirectedToGoogle ? (
              <span className="inline-flex items-center gap-1.5 text-[var(--color-accent)]">
                <GoogleIcon size={14} /> Googleに誘導
              </span>
            ) : (
              <span className="text-neutral-400">—</span>
            )}
          </DetailRow>
        </dl>
        {row.comment ? (
          <div className="mt-4">
            <p className="text-sm font-medium text-neutral-700">口コミ内容</p>
            <p className="mt-2 whitespace-pre-line rounded-xl bg-neutral-50 p-4 text-sm text-neutral-800">
              {row.comment}
            </p>
          </div>
        ) : null}
        {row.photoUrls.length > 0 ? (
          <div className="mt-4">
            <p className="text-sm font-medium text-neutral-700">投稿写真</p>
            <div className="mt-2 grid grid-cols-3 gap-2">
              {row.photoUrls.map((url) => (
                <a
                  key={url}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="relative aspect-square overflow-hidden rounded-lg bg-neutral-100"
                >
                  {/* Guest-uploaded Supabase URLs; plain img avoids remote-loader config. */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={url} alt="投稿写真" className="h-full w-full object-cover" />
                </a>
              ))}
            </div>
          </div>
        ) : null}
      </>
    ),
  };
}

const baseColumns: Column<ReviewRow>[] = [
  {
    key: "createdAt",
    header: "受信日時",
    className: "whitespace-nowrap text-neutral-600",
    render: (row) => formatTokyoTime(row.createdAt),
  },
  {
    key: "store",
    header: "店舗",
    className: "whitespace-nowrap font-medium",
    render: (row) => row.storeName,
  },
  {
    key: "rating",
    header: "評価",
    className: "whitespace-nowrap",
    render: (row) => (
      <span className="flex items-center gap-1">
        <Stars rating={row.rating} /> <span className="text-xs">{row.rating.toFixed(1)}</span>
      </span>
    ),
  },
  {
    key: "amount",
    header: "チップ金額",
    className: "whitespace-nowrap",
    render: (row) => formatYen(row.amount),
  },
  {
    key: "comment",
    header: "口コミ",
    className: "min-w-[240px] max-w-[380px] whitespace-pre-line leading-relaxed text-neutral-800",
    render: (row) => row.comment ?? <span className="text-neutral-400">—</span>,
  },
  {
    key: "photos",
    header: "写真",
    render: (row) =>
      row.photoUrls.length > 0 ? (
        <div className="flex flex-wrap items-center gap-1.5">
          {row.photoUrls.slice(0, 3).map((url) => (
            // Guest-uploaded Supabase URLs; plain img avoids remote-loader config.
            // eslint-disable-next-line @next/next/no-img-element
            <img key={url} src={url} alt="投稿写真" className="h-12 w-12 rounded-lg object-cover" />
          ))}
          {row.photoUrls.length > 3 ? (
            <span className="text-xs text-neutral-400">+{row.photoUrls.length - 3}</span>
          ) : null}
        </div>
      ) : (
        <span className="text-neutral-400">—</span>
      ),
  },
];

const guideColumn: Column<ReviewRow> = {
  key: "guide",
  header: "口コミ誘導",
  className: "whitespace-nowrap",
  render: (row) =>
    row.redirectedToGoogle ? (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--color-accent)]/10 px-2.5 py-1 text-xs font-medium text-[var(--color-accent)]">
        <GoogleIcon size={14} /> Googleに誘導
      </span>
    ) : (
      <span className="text-neutral-400">—</span>
    ),
};

function toRow(review: {
  id: string;
  rating: number;
  comment: string | null;
  createdAt: Date;
  redirectedToGoogle: boolean;
  photoUrls: string[];
  tip: { amount: number; store: { name: string } };
}): ReviewRow {
  return {
    id: review.id,
    rating: review.rating,
    comment: review.comment,
    createdAt: review.createdAt,
    redirectedToGoogle: review.redirectedToGoogle,
    storeName: review.tip.store.name,
    amount: review.tip.amount,
    photoUrls: review.photoUrls,
  };
}

export default async function AdminReviewsPage({
  searchParams,
}: {
  searchParams: Promise<{ pubPage?: string; privPage?: string }>;
}) {
  const { activeStoreId } = await getActiveStore();
  const scope = storeScope(activeStoreId);
  const { pubPage: pubParam, privPage: privParam } = await searchParams;

  // Same threshold the guest flow branches on (see /api/reviews).
  const publicWhere = { ...scope, rating: { gte: PUBLIC_REVIEW_MIN_RATING } };
  const privateWhere = { ...scope, rating: { lt: PUBLIC_REVIEW_MIN_RATING } };

  const [publicCount, privateCount, avgAgg] = await Promise.all([
    prisma.review.count({ where: publicWhere }),
    prisma.review.count({ where: privateWhere }),
    prisma.review.aggregate({ where: { ...scope }, _avg: { rating: true } }),
  ]);
  const average = avgAgg._avg.rating ? avgAgg._avg.rating.toFixed(2) : "—";

  const publicPageCount = Math.max(1, Math.ceil(publicCount / PAGE_SIZE));
  const privatePageCount = Math.max(1, Math.ceil(privateCount / PRIVATE_PAGE_SIZE));
  const pubPage = Math.min(parsePage(pubParam), publicPageCount);
  const privPage = Math.min(parsePage(privParam), privatePageCount);

  const [publicReviews, privateReviews] = await Promise.all([
    prisma.review.findMany({
      where: publicWhere,
      include: { tip: { include: { store: { select: { name: true } } } } },
      orderBy: { createdAt: "desc" },
      skip: (pubPage - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.review.findMany({
      where: privateWhere,
      include: { tip: { include: { store: { select: { name: true } } } } },
      orderBy: { createdAt: "desc" },
      skip: (privPage - 1) * PRIVATE_PAGE_SIZE,
      take: PRIVATE_PAGE_SIZE,
    }),
  ]);

  return (
    <div className="flex flex-col gap-8">
      <h1 className="text-xl font-bold">口コミ一覧</h1>

      <section className="grid grid-cols-3 gap-3">
        <div className="rounded-xl border border-neutral-200 bg-white p-4">
          <p className="text-xs text-neutral-500">平均評価</p>
          <p className="mt-1 text-2xl font-bold">{average}</p>
        </div>
        <div className="rounded-xl border border-neutral-200 bg-white p-4">
          <p className="text-xs text-neutral-500">公開（4★以上）</p>
          <p className="mt-1 text-2xl font-bold">{publicCount}</p>
        </div>
        <div className="rounded-xl border border-neutral-200 bg-white p-4">
          <p className="text-xs text-neutral-500">非公開（3★以下）</p>
          <p className="mt-1 text-2xl font-bold">{privateCount}</p>
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <div>
          <h2 className="text-lg font-bold">要対応（3★以下）</h2>
        </div>
        <TableNavProvider>
          <DataTable
            columns={baseColumns}
            rows={privateReviews.map(toRow)}
            rowKey={(row) => row.id}
            renderDetail={reviewDetail}
            emptyLabel="低評価はありません。"
            minWidthClass="min-w-[720px]"
            bodyCellClassName="align-top py-4"
            page={privPage}
            pageSize={PRIVATE_PAGE_SIZE}
            total={privateCount}
            basePath="/admin/reviews"
            pageParam="privPage"
            query={{ pubPage: pubParam }}
          />
        </TableNavProvider>
      </section>

      <section className="flex flex-col gap-3">
        <div>
          <h2 className="text-lg font-bold">公開（4★以上）</h2>
        </div>
        <TableNavProvider>
          <DataTable
            columns={[...baseColumns, guideColumn]}
            rows={publicReviews.map(toRow)}
            rowKey={(row) => row.id}
            renderDetail={reviewDetail}
            emptyLabel="まだ口コミはありません。"
            minWidthClass="min-w-[820px]"
            bodyCellClassName="align-top py-4"
            page={pubPage}
            pageSize={PAGE_SIZE}
            total={publicCount}
            basePath="/admin/reviews"
            pageParam="pubPage"
            query={{ privPage: privParam }}
          />
        </TableNavProvider>
      </section>
    </div>
  );
}
