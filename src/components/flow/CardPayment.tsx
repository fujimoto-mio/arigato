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
import { LanguageMenu } from "@/components/flow/LanguageMenu";
import { stripePromise } from "@/lib/stripeClient";

function PaymentInner({
  slug,
  tipId,
  preferredWallet,
  onPaid,
}: {
  slug: string;
  tipId: string;
  // The wallet the guest picked on the tip screen; the payment screen leads with
  // it and hides the card form until we learn it isn't available.
  preferredWallet: "applepay" | "googlepay" | null;
  onPaid: () => void;
}) {
  const t = useTranslations("payment");
  const stripe = useStripe();
  const elements = useElements();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // null while the Express element is still checking availability. Apple Pay /
  // Google Pay only render where the browser + device (and Stripe account)
  // support them; when a specific wallet was chosen and it isn't available, we
  // fall back to the card form.
  const [walletShown, setWalletShown] = useState<boolean | null>(preferredWallet ? null : false);
  const [forceCard, setForceCard] = useState(false);

  const showCard = !preferredWallet || walletShown === false || forceCard;
  const walletOnly = Boolean(preferredWallet) && walletShown === true && !forceCard;

  async function confirm() {
    if (!stripe || !elements) return;

    setIsSubmitting(true);
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
      setIsSubmitting(false);
      return;
    }

    // `processing` still advances: the webhook (and the reviews route's self-heal)
    // resolve the final status before a review can be written.
    if (paymentIntent?.status === "succeeded" || paymentIntent?.status === "processing") {
      onPaid();
      return;
    }
    setError(t("errorGeneric"));
    setIsSubmitting(false);
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    await confirm();
  }

  const hasFailed = error !== null;

  return (
    <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
      {/* Apple Pay / Google Pay buttons. When the guest chose a specific wallet,
          only that one is offered; Link is disabled so no "stripe"/Link branding
          appears. */}
      <ExpressCheckoutElement
        onConfirm={() => void confirm()}
        onReady={({ availablePaymentMethods }) => {
          if (process.env.NODE_ENV !== "production") {
            // Debug: shows which wallets Stripe reports as available on this device.
            console.log("[express-checkout] availablePaymentMethods:", availablePaymentMethods);
          }
          setWalletShown(Boolean(availablePaymentMethods));
        }}
        options={{
          paymentMethods: {
            applePay: preferredWallet === "googlepay" ? "never" : "auto",
            googlePay: preferredWallet === "applepay" ? "never" : "auto",
            link: "never",
            amazonPay: "never",
            paypal: "never",
          },
        }}
      />
      {showCard && walletShown === true ? (
        <div className="flex items-center gap-3 text-[10px] font-medium uppercase tracking-[0.16em] text-neutral-400">
          <span className="h-px flex-1 bg-neutral-200" />
          {t("otherOptions")}
          <span className="h-px flex-1 bg-neutral-200" />
        </div>
      ) : null}
      {showCard ? (
        <>
          {/* Card entry. Wallets are handled by the Express element above, so keep
              them off here to avoid a duplicate button. */}
          <PaymentElement options={{ layout: "tabs", wallets: { applePay: "never", googlePay: "never" } }} />
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
        </>
      ) : walletOnly ? (
        <button
          type="button"
          onClick={() => setForceCard(true)}
          className="py-1 text-center text-sm font-medium text-[var(--color-accent)]"
        >
          {t("payByCardInstead")}
        </button>
      ) : null}
      <p className="flex items-center justify-center gap-1.5 text-center text-xs text-neutral-400">
        <svg
          viewBox="0 0 24 24"
          className="h-4 w-4 shrink-0"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <rect x="5" y="11" width="14" height="9" rx="2" />
          <path d="M8 11V8a4 4 0 0 1 8 0v3" />
        </svg>
        {t("processingNote")}
      </p>
    </form>
  );
}

export function CardPayment({
  slug,
  tipId,
  clientSecret,
  amount,
  locale,
  preferredWallet,
  onPaid,
  onBack,
}: {
  slug: string;
  tipId: string;
  clientSecret: string;
  amount: number;
  locale: "ja" | "en" | "ko" | "zh";
  preferredWallet: "applepay" | "googlepay" | null;
  onPaid: () => void;
  onBack: () => void;
}) {
  const t = useTranslations("payment");
  const tc = useTranslations("common");

  return (
    <div className="flex flex-1 flex-col pb-10">
      <header className="flex items-start justify-between px-5 pt-5">
        <div className="flex min-h-11 items-center gap-2">
          <button
            type="button"
            onClick={onBack}
            aria-label={tc("back")}
            className="-ml-1.5 flex h-9 w-9 items-center justify-center rounded-full text-neutral-500 transition hover:bg-neutral-100"
          >
            <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>
          <LanguageMenu />
        </div>
        <LogoBadge />
      </header>

      <div className="px-6 pt-4">
        <h1 className="text-2xl font-bold uppercase tracking-wide">{t("heading")}</h1>
        <div className="mt-4 rounded-2xl border border-neutral-200 p-6 text-center">
          <p className="text-4xl font-bold">¥{amount.toLocaleString()}</p>
          <p className="mt-1 text-xs text-neutral-400">{t("amountLabel")}</p>
        </div>

        {stripePromise ? (
          <Elements
            stripe={stripePromise}
            options={{
              clientSecret,
              locale,
              appearance: {
                theme: "stripe",
                variables: {
                  colorPrimary: "#b0895a",
                  colorText: "#171717",
                  colorDanger: "#dc2626",
                  borderRadius: "12px",
                  fontFamily: "system-ui, -apple-system, sans-serif",
                },
              },
            }}
          >
            <PaymentInner slug={slug} tipId={tipId} preferredWallet={preferredWallet} onPaid={onPaid} />
          </Elements>
        ) : (
          <p className="mt-6 text-sm text-red-600">{t("notConfigured")}</p>
        )}
      </div>
    </div>
  );
}
