"use client";

import { Elements, PaymentElement, useElements, useStripe } from "@stripe/react-stripe-js";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";
import { stripePromise } from "@/lib/stripeClient";

function PayButton({ slug, tipId }: { slug: string; tipId: string }) {
  const t = useTranslations("checkout");
  const stripe = useStripe();
  const elements = useElements();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!stripe || !elements) return;

    setIsSubmitting(true);
    setError(null);

    const { error: confirmError, paymentIntent } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/s/${slug}/thank-you?tipId=${tipId}`,
      },
      redirect: "if_required",
    });

    if (confirmError) {
      // Card/validation errors are the guest's to fix, so surface Stripe's own
      // wording; anything else is our problem and gets the generic message.
      const isGuestFixable =
        confirmError.type === "card_error" || confirmError.type === "validation_error";
      setError(isGuestFixable ? (confirmError.message ?? t("errorCard")) : t("errorGeneric"));
      setIsSubmitting(false);
      return;
    }

    // `processing` still lands on thank-you: the webhook (and the reviews route's
    // self-heal) resolve the final status before a review can be written.
    if (paymentIntent?.status === "succeeded" || paymentIntent?.status === "processing") {
      router.push(`/s/${slug}/thank-you?tipId=${tipId}`);
      return;
    }

    setError(t("errorGeneric"));
    setIsSubmitting(false);
  }

  const hasFailed = error !== null;

  return (
    <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4 px-4">
      <PaymentElement />
      {error ? (
        <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-600">
          {error}
        </p>
      ) : null}
      <button
        type="submit"
        disabled={!stripe || isSubmitting}
        className="w-full rounded-full bg-neutral-900 py-3 text-center font-semibold text-white disabled:opacity-40"
      >
        {isSubmitting ? t("processingNote") : hasFailed ? t("retryButton") : t("payButton")}
      </button>
      <p className="text-center text-xs text-neutral-400">{t("processingNote")}</p>
    </form>
  );
}

export function PaymentForm({
  slug,
  tipId,
  clientSecret,
  amount,
  staffName,
}: {
  slug: string;
  tipId: string;
  clientSecret: string;
  amount: number;
  staffName: string;
}) {
  const t = useTranslations("checkout");

  return (
    <div className="mx-auto min-h-screen max-w-md bg-white pb-10">
      <div className="px-4 pt-8">
        <h1 className="text-xl font-bold">{t("heading")}</h1>
        <p className="mt-1 text-sm text-neutral-500">{t("subheading")}</p>
        <div className="mt-4 rounded-xl bg-neutral-100 px-4 py-3">
          <p className="text-sm text-neutral-600">{t("tippingLabel", { staffName })}</p>
          <p className="text-2xl font-bold">¥{amount.toLocaleString()}</p>
        </div>
      </div>

      {stripePromise ? (
        <Elements stripe={stripePromise} options={{ clientSecret, appearance: { theme: "stripe" } }}>
          <PayButton slug={slug} tipId={tipId} />
        </Elements>
      ) : (
        <p className="mt-6 px-4 text-sm text-red-600">Stripe is not configured (missing publishable key).</p>
      )}
    </div>
  );
}
