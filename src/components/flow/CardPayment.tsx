"use client";

import {
  Elements,
  ExpressCheckoutElement,
  PaymentElement,
  useElements,
  useStripe,
} from "@stripe/react-stripe-js";
import { useTranslations } from "next-intl";
import { type FormEvent, useState } from "react";
import { LogoBadge } from "@/components/flow/brand";
import { stripePromise } from "@/lib/stripeClient";

function PaymentInner({ slug, tipId, onPaid }: { slug: string; tipId: string; onPaid: () => void }) {
  const t = useTranslations("payment");
  const stripe = useStripe();
  const elements = useElements();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [walletReady, setWalletReady] = useState(false);

  // One confirm path shared by the Apple Pay / Google Pay buttons and the card form.
  async function confirm() {
    if (!stripe || !elements) return;
    setError(null);
    const { error: confirmError, paymentIntent } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        // Only used if a method needs a redirect (e.g. 3-D Secure). The guest lands
        // back on the store page, which resumes at the review step (see page.tsx).
        return_url: `${window.location.origin}/s/${slug}?paid=${tipId}`,
      },
      redirect: "if_required",
    });

    if (confirmError) {
      const isGuestFixable =
        confirmError.type === "card_error" || confirmError.type === "validation_error";
      setError(isGuestFixable ? (confirmError.message ?? t("errorCard")) : t("errorGeneric"));
      return;
    }

    // `processing` still advances: the webhook (and the reviews route's self-heal)
    // resolve the final status before a review can be written.
    if (paymentIntent?.status === "succeeded" || paymentIntent?.status === "processing") {
      onPaid();
      return;
    }
    setError(t("errorGeneric"));
  }

  async function handleCardSubmit(event: FormEvent) {
    event.preventDefault();
    setIsSubmitting(true);
    await confirm();
    setIsSubmitting(false);
  }

  const hasFailed = error !== null;

  return (
    <div className="mt-6 flex flex-col gap-4">
      {/* Apple Pay / Google Pay / Link — renders only where a wallet is available
          (HTTPS + supported device/browser, and Apple Pay domain registered). */}
      <ExpressCheckoutElement
        onReady={({ availablePaymentMethods }) => setWalletReady(Boolean(availablePaymentMethods))}
        onConfirm={() => void confirm()}
      />
      {walletReady ? (
        <div className="flex items-center gap-3 text-[10px] uppercase tracking-widest text-neutral-400">
          <span className="h-px flex-1 bg-neutral-200" />
          {t("otherOptions")}
          <span className="h-px flex-1 bg-neutral-200" />
        </div>
      ) : null}

      <form onSubmit={handleCardSubmit} className="flex flex-col gap-4">
        <PaymentElement options={{ layout: "tabs" }} />
        {error ? (
          <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-600">
            {error}
          </p>
        ) : null}
        <button
          type="submit"
          disabled={!stripe || isSubmitting}
          className="w-full rounded-xl bg-[var(--color-accent)] py-4 text-center font-semibold text-white transition-colors hover:bg-[var(--color-accent-dark)] disabled:opacity-40"
        >
          {isSubmitting ? t("processing") : hasFailed ? t("retryButton") : t("payButton")}
        </button>
        <p className="text-center text-xs text-neutral-400">🔒 {t("processingNote")}</p>
      </form>
    </div>
  );
}

export function CardPayment({
  slug,
  tipId,
  clientSecret,
  amount,
  onPaid,
  onBack,
}: {
  slug: string;
  tipId: string;
  clientSecret: string;
  amount: number;
  onPaid: () => void;
  onBack: () => void;
}) {
  const t = useTranslations("payment");
  const tc = useTranslations("common");

  return (
    <div className="flex flex-1 flex-col pb-10">
      <header className="flex items-start justify-between px-5 pt-5">
        <button type="button" onClick={onBack} aria-label={tc("back")} className="text-3xl leading-none text-neutral-400">
          ‹
        </button>
        <LogoBadge />
      </header>

      <div className="px-6 pt-4">
        <h1 className="text-2xl font-bold uppercase tracking-wide">{t("heading")}</h1>
        <div className="mt-4 rounded-2xl border border-neutral-200 p-6 text-center">
          <p className="text-4xl font-bold">¥{amount.toLocaleString()}</p>
          <p className="mt-1 text-xs text-neutral-400">{t("amountLabel")}</p>
        </div>

        {stripePromise ? (
          <Elements stripe={stripePromise} options={{ clientSecret, appearance: { theme: "stripe" } }}>
            <PaymentInner slug={slug} tipId={tipId} onPaid={onPaid} />
          </Elements>
        ) : (
          <p className="mt-6 text-sm text-red-600">{t("notConfigured")}</p>
        )}
      </div>
    </div>
  );
}
