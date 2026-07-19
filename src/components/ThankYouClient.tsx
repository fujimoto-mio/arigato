"use client";

import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { StarRating } from "@/components/StarRating";

export function ThankYouClient({ slug, tipId }: { slug: string; tipId: string }) {
  const t = useTranslations("thankYou");
  const router = useRouter();

  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [privateFeedbackSubmitted, setPrivateFeedbackSubmitted] = useState(false);

  async function handleComplete() {
    if (rating === 0) return;
    setIsSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tipId, rating, comment: comment.trim() || undefined }),
      });

      if (!res.ok) {
        throw new Error("review_failed");
      }

      const { redirectUrl } = (await res.json()) as { redirectUrl: string | null };

      if (redirectUrl) {
        window.location.href = redirectUrl;
        return;
      }

      setPrivateFeedbackSubmitted(true);
      setTimeout(() => router.push(`/s/${slug}`), 1800);
    } catch {
      setError(t("errorGeneric"));
      setIsSubmitting(false);
    }
  }

  return (
    <div className="mx-auto min-h-screen max-w-md bg-white">
      <div className="flex flex-col items-center gap-4 px-6 pt-12 text-center">
        <span className="flex h-14 w-14 items-center justify-center rounded-full bg-neutral-900 text-2xl text-white">
          ✓
        </span>
        <h1 className="text-xl font-bold">{t("title")}</h1>
        <p className="text-sm text-neutral-500">{t("subtitle")}</p>
      </div>

      <div className="mt-10 px-6">
        {privateFeedbackSubmitted ? (
          <p className="text-center text-sm text-neutral-600">{t("privateFeedbackNote")}</p>
        ) : (
          <>
            <h2 className="text-center text-lg font-bold">{t("ratingHeading")}</h2>
            <p className="mt-1 text-center text-sm text-neutral-500">{t("ratingSubheading")}</p>

            <div className="mt-4">
              <StarRating value={rating} onChange={setRating} />
            </div>

            <label className="mt-6 block text-sm font-medium text-neutral-700">
              {t("commentLabel")}
              <textarea
                value={comment}
                onChange={(event) => setComment(event.target.value)}
                placeholder={t("commentPlaceholder")}
                rows={4}
                className="mt-2 w-full rounded-lg border border-neutral-300 p-3 text-sm"
              />
            </label>

            {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}

            <button
              type="button"
              disabled={rating === 0 || isSubmitting}
              onClick={handleComplete}
              className="mt-6 w-full rounded-full bg-neutral-900 py-3 text-center font-semibold text-white disabled:opacity-40"
            >
              {t("completeButton")}
            </button>
            <p className="mt-2 text-center text-xs text-neutral-400">{t("completeNote")}</p>
          </>
        )}
      </div>
    </div>
  );
}
