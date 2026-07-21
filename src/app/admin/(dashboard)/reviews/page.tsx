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
  staffName: string;
  amount: number;
};

function Stars({ rating }: { rating: number }) {
  return (
    <span aria-label={`${rating} out of 5`} className="text-sm text-amber-500">
      {"★".repeat(rating)}
      <span className="text-neutral-300">{"★".repeat(5 - rating)}</span>
    </span>
  );
}

function ReviewList({ reviews, emptyLabel }: { reviews: ReviewRow[]; emptyLabel: string }) {
  if (reviews.length === 0) {
    return <p className="rounded-xl bg-neutral-50 p-6 text-center text-sm text-neutral-500">{emptyLabel}</p>;
  }

  return (
    <ul className="flex flex-col gap-2">
      {reviews.map((review) => (
        <li key={review.id} className="rounded-xl border border-neutral-200 p-4">
          <div className="flex items-center justify-between">
            <Stars rating={review.rating} />
            <span className="text-xs text-neutral-400">{formatTokyoTime(review.createdAt)}</span>
          </div>
          <p className="mt-2 text-xs text-neutral-500">
            {review.staffName} · {formatYen(review.amount)}
            {review.redirectedToGoogle ? " · sent to Google" : ""}
          </p>
          {review.comment ? <p className="mt-2 text-sm text-neutral-800">{review.comment}</p> : null}
        </li>
      ))}
    </ul>
  );
}

export default async function AdminReviewsPage() {
  const { store } = await requireAdmin();

  const reviews = await prisma.review.findMany({
    where: { storeId: store.id },
    include: { tip: { include: { staff: true } } },
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  const rows: ReviewRow[] = reviews.map((review) => ({
    id: review.id,
    rating: review.rating,
    comment: review.comment,
    createdAt: review.createdAt,
    redirectedToGoogle: review.redirectedToGoogle,
    staffName: review.tip.staff.name,
    amount: review.tip.amount,
  }));

  // Same threshold the guest flow branches on (see /api/reviews).
  const publicReviews = rows.filter((row) => row.rating >= 3);
  const privateReviews = rows.filter((row) => row.rating < 3);

  const average =
    rows.length > 0 ? (rows.reduce((sum, row) => sum + row.rating, 0) / rows.length).toFixed(2) : "—";

  return (
    <div className="flex flex-col gap-8">
      <section className="grid grid-cols-3 gap-3">
        <div className="rounded-xl border border-neutral-200 p-4">
          <p className="text-xs text-neutral-500">Average</p>
          <p className="mt-1 text-2xl font-bold">{average}</p>
        </div>
        <div className="rounded-xl border border-neutral-200 p-4">
          <p className="text-xs text-neutral-500">Public</p>
          <p className="mt-1 text-2xl font-bold">{publicReviews.length}</p>
        </div>
        <div className="rounded-xl border border-neutral-200 p-4">
          <p className="text-xs text-neutral-500">Private</p>
          <p className="mt-1 text-2xl font-bold">{privateReviews.length}</p>
        </div>
      </section>

      <section>
        <h2 className="text-lg font-bold">Needs attention (under 3★)</h2>
        <p className="mb-3 text-sm text-neutral-500">
          Never shown publicly and never sent to Google — only your team sees these.
        </p>
        <ReviewList reviews={privateReviews} emptyLabel="No low ratings. " />
      </section>

      <section>
        <h2 className="text-lg font-bold">Public (3★ and above)</h2>
        <p className="mb-3 text-sm text-neutral-500">
          These guests were offered the Google review link.
        </p>
        <ReviewList reviews={publicReviews} emptyLabel="No reviews yet." />
      </section>
    </div>
  );
}
