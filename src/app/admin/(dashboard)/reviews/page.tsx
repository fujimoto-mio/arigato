import { Stars } from "@/components/admin/Stars";
import { requireAdmin } from "@/lib/admin/auth";
import { formatTokyoTime, formatYen } from "@/lib/admin/period";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

type ReviewRow = {
  id: string;
  rating: number;
  comment: string | null;
  createdAt: Date;
  redirectedToGoogle: boolean;
  tableLabel: string | null;
  amount: number;
  photoUrls: string[];
};

function ReviewList({ reviews, emptyLabel }: { reviews: ReviewRow[]; emptyLabel: string }) {
  if (reviews.length === 0) {
    return <p className="rounded-xl bg-neutral-50 p-6 text-center text-sm text-neutral-500">{emptyLabel}</p>;
  }

  return (
    <ul className="flex flex-col gap-2">
      {reviews.map((review) => (
        <li key={review.id} className="rounded-xl border border-neutral-200 bg-white p-4">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1">
              <Stars rating={review.rating} /> <span className="text-xs text-neutral-500">{review.rating.toFixed(1)}</span>
            </span>
            <span className="text-xs text-neutral-400">{formatTokyoTime(review.createdAt)}</span>
          </div>
          <p className="mt-2 text-xs text-neutral-500">
            {review.tableLabel ? `${review.tableLabel}番 ・ ` : ""}
            {formatYen(review.amount)}
            {review.redirectedToGoogle ? " ・ Googleへ誘導" : ""}
          </p>
          {review.comment ? <p className="mt-2 text-sm text-neutral-800">{review.comment}</p> : null}
          {review.photoUrls.length > 0 ? (
            <div className="mt-2 flex flex-wrap gap-2">
              {review.photoUrls.map((url) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img key={url} src={url} alt="投稿写真" className="h-16 w-16 rounded-lg object-cover" />
              ))}
            </div>
          ) : null}
        </li>
      ))}
    </ul>
  );
}

export default async function AdminReviewsPage() {
  const { store } = await requireAdmin();

  const reviews = await prisma.review.findMany({
    where: { storeId: store.id },
    include: { tip: true },
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  const rows: ReviewRow[] = reviews.map((review) => ({
    id: review.id,
    rating: review.rating,
    comment: review.comment,
    createdAt: review.createdAt,
    redirectedToGoogle: review.redirectedToGoogle,
    tableLabel: review.tip.tableLabel,
    amount: review.tip.amount,
    photoUrls: review.photoUrls,
  }));

  // Same threshold the guest flow branches on (see /api/reviews).
  const publicReviews = rows.filter((row) => row.rating >= 3);
  const privateReviews = rows.filter((row) => row.rating < 3);

  const average =
    rows.length > 0 ? (rows.reduce((sum, row) => sum + row.rating, 0) / rows.length).toFixed(2) : "—";

  return (
    <div className="flex flex-col gap-8">
      <h1 className="text-xl font-bold">口コミ一覧</h1>

      <section className="grid grid-cols-3 gap-3">
        <div className="rounded-xl border border-neutral-200 bg-white p-4">
          <p className="text-xs text-neutral-500">平均評価</p>
          <p className="mt-1 text-2xl font-bold">{average}</p>
        </div>
        <div className="rounded-xl border border-neutral-200 bg-white p-4">
          <p className="text-xs text-neutral-500">公開（3★以上）</p>
          <p className="mt-1 text-2xl font-bold">{publicReviews.length}</p>
        </div>
        <div className="rounded-xl border border-neutral-200 bg-white p-4">
          <p className="text-xs text-neutral-500">非公開（3★未満）</p>
          <p className="mt-1 text-2xl font-bold">{privateReviews.length}</p>
        </div>
      </section>

      <section>
        <h2 className="text-lg font-bold">要対応（3★未満）</h2>
        <p className="mb-3 text-sm text-neutral-500">公開もGoogleへの誘導もされません。店舗チームだけが確認できます。</p>
        <ReviewList reviews={privateReviews} emptyLabel="低評価はありません。" />
      </section>

      <section>
        <h2 className="text-lg font-bold">公開（3★以上）</h2>
        <p className="mb-3 text-sm text-neutral-500">これらのお客様にはGoogleレビューのリンクが案内されました。</p>
        <ReviewList reviews={publicReviews} emptyLabel="まだ口コミはありません。" />
      </section>
    </div>
  );
}
