"use client";

import { useTranslations } from "next-intl";
import Image from "next/image";
import { type ReactNode, useState } from "react";
import {
  FacebookIcon,
  GoogleIcon,
  InstagramIcon,
  LogoBadge,
  Wordmark,
} from "@/components/flow/brand";
import { CardPayment } from "@/components/flow/CardPayment";
import { LanguageMenu } from "@/components/flow/LanguageMenu";
import { useLocaleSwitcher } from "@/i18n/LocaleProvider";
import { TIP_STEP } from "@/lib/tip";

export type GuestStore = {
  slug: string;
  name: string;
  logoUrl: string | null;
  googlePlaceId: string | null;
  instagramUrl: string | null;
  facebookUrl: string | null;
};

type Step = "landing" | "story" | "support" | "payment" | "review" | "thankyou" | "connect";

// Stock imagery stands in for per-store story photos until stores upload their own.
const STORY_IMAGES = ["/lp/izakaya-interior.jpg", "/lp/restaurant-lanterns.jpg", "/lp/phone-payment.jpg"];

function googleMapsUrl(placeId: string) {
  return `https://www.google.com/maps/place/?q=place_id:${placeId}`;
}

/* ---------- Header + shared controls ---------- */

// Language selection is available on every screen: the back button (when
// present) and the language switcher share the header's left side.
function Header({ onBack }: { onBack?: () => void }) {
  return (
    <header className="flex items-start justify-between px-5 pt-5">
      <div className="flex min-h-11 items-center gap-3">
        {onBack ? <BackButton onClick={onBack} /> : null}
        <LanguageMenu />
      </div>
      <LogoBadge />
    </header>
  );
}

function BackButton({ onClick }: { onClick: () => void }) {
  const tc = useTranslations("common");
  return (
    <button type="button" onClick={onClick} aria-label={tc("back")} className="text-3xl leading-none text-neutral-400">
      ‹
    </button>
  );
}

function AccentButton({
  children,
  onClick,
  disabled,
}: {
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="w-full rounded-2xl bg-[var(--color-accent)] py-4 text-center font-bold text-white transition-colors hover:bg-[var(--color-accent-dark)] disabled:opacity-40"
    >
      {children}
    </button>
  );
}

/* ---------- Orchestrator ---------- */

export function GuestFlow({
  store,
  tableLabel,
  resumeTipId = null,
}: {
  store: GuestStore;
  tableLabel: string | null;
  // Set after a card returns from a 3-D Secure redirect (?paid=<tipId>): the tip
  // is already paid, so resume straight at the review step.
  resumeTipId?: string | null;
}) {
  const { locale } = useLocaleSwitcher();
  const [step, setStep] = useState<Step>(resumeTipId ? "review" : "landing");
  const [amount, setAmount] = useState(0);
  const [payByCard, setPayByCard] = useState(false);
  const [tipId, setTipId] = useState<string | null>(resumeTipId);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Set when the just-submitted review qualifies for the store's Google review
  // page (rating high enough + store has a Place ID); offered on Stay Connected.
  const [googleReviewUrl, setGoogleReviewUrl] = useState<string | null>(null);

  function reset() {
    setAmount(0);
    setPayByCard(false);
    setTipId(null);
    setClientSecret(null);
    setError(null);
    setGoogleReviewUrl(null);
    setStep("landing");
  }

  async function startCheckout() {
    setIsSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug: store.slug,
          amount,
          locale,
          tableLabel: tableLabel ?? undefined,
          paymentMethod: payByCard ? "card" : "cash",
        }),
      });
      if (!res.ok) throw new Error("checkout_failed");
      const data = (await res.json()) as { tipId: string; mode: "cash" | "card"; clientSecret?: string };
      setTipId(data.tipId);
      if (data.mode === "card" && data.clientSecret) {
        setClientSecret(data.clientSecret);
        setStep("payment");
      } else {
        setStep("review");
      }
    } catch {
      setError("support");
    } finally {
      setIsSubmitting(false);
    }
  }

  function goReviews() {
    if (store.googlePlaceId) window.open(googleMapsUrl(store.googlePlaceId), "_blank");
    else setStep("connect");
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col bg-white">
      {step === "landing" && <Landing store={store} onStart={() => setStep("story")} />}
      {step === "story" && <Story onNext={() => setStep("support")} />}
      {step === "support" && (
        <Support
          amount={amount}
          setAmount={setAmount}
          payByCard={payByCard}
          setPayByCard={setPayByCard}
          onNext={startCheckout}
          onBack={() => setStep("story")}
          isSubmitting={isSubmitting}
          hasError={error === "support"}
        />
      )}
      {step === "payment" && clientSecret && tipId && (
        <CardPayment
          slug={store.slug}
          tipId={tipId}
          clientSecret={clientSecret}
          amount={amount}
          locale={locale}
          onPaid={() => setStep("review")}
          onBack={() => setStep("support")}
        />
      )}
      {step === "review" && tipId && (
        <Review
          tipId={tipId}
          onDone={(reviewUrl) => {
            setGoogleReviewUrl(reviewUrl);
            setStep("thankyou");
          }}
          onBack={() => setStep("support")}
        />
      )}
      {step === "thankyou" && <ThankYou onHome={reset} onReviews={() => setStep("connect")} />}
      {step === "connect" && (
        <Connect
          store={store}
          reviewUrl={googleReviewUrl}
          onBack={() => setStep("thankyou")}
          onHome={reset}
          onStory={() => setStep("story")}
          onReviews={goReviews}
          onSupport={() => setStep("support")}
        />
      )}
    </div>
  );
}

/* ---------- Screen 1: Landing ---------- */

function Landing({ store, onStart }: { store: GuestStore; onStart: () => void }) {
  const t = useTranslations("story");
  return (
    <div className="flex flex-1 flex-col">
      <Header />
      <div className="px-8 pt-6 text-center">
        <Wordmark className="text-5xl tracking-tight" />
        <p className="mx-auto mt-7 max-w-[15rem] text-[15px] font-semibold uppercase leading-relaxed tracking-[0.1em] text-neutral-800">
          {t("tagline")}
        </p>
        <p className="mt-3 text-[15px] font-semibold uppercase tracking-[0.1em] text-[var(--color-accent)]">
          {t("takeALook")}
        </p>
      </div>
      <div className="relative mt-10 aspect-[4/3] overflow-hidden bg-neutral-100">
        <Image src={STORY_IMAGES[0]} alt={store.name} fill sizes="(max-width: 448px) 100vw, 448px" className="object-cover" />
      </div>
      <div className="mt-auto px-6 pb-8 pt-8">
        <AccentButton onClick={onStart}>
          <span className="flex items-center justify-center gap-2">
            {t("cta")} <span className="text-lg">›</span>
          </span>
        </AccentButton>
        <p className="mt-4 text-center text-xs tracking-wide text-neutral-400">
          {t("poweredByPrefix")} <span className="font-bold text-neutral-600">ARIGATO TiP</span>
        </p>
      </div>
    </div>
  );
}

/* ---------- Screen 2: Our Story (swipe carousel) ---------- */

function Story({ onNext }: { onNext: () => void }) {
  const t = useTranslations("story");
  const slides = t.raw("slides") as { title: string; body: string }[];
  const [index, setIndex] = useState(0);
  const [touchX, setTouchX] = useState<number | null>(null);
  const slide = slides[index];

  function advance() {
    if (index < slides.length - 1) setIndex((i) => i + 1);
    else onNext();
  }
  function back() {
    if (index > 0) setIndex((i) => i - 1);
  }

  return (
    <div className="flex flex-1 flex-col">
      <Header />
      <div className="px-6 pt-2">
        <h2 className="text-2xl font-bold uppercase tracking-wide text-neutral-900">{t("heading")}</h2>
        <div className="mt-1.5 h-1 w-12 rounded-full bg-[var(--color-accent)]" />
      </div>

      <div
        className="mt-5 flex-1 cursor-pointer select-none"
        onClick={advance}
        onTouchStart={(e) => setTouchX(e.changedTouches[0].clientX)}
        onTouchEnd={(e) => {
          if (touchX === null) return;
          const dx = e.changedTouches[0].clientX - touchX;
          if (dx < -40) advance();
          else if (dx > 40) back();
          setTouchX(null);
        }}
      >
        <div className="relative aspect-[4/3] overflow-hidden bg-neutral-100">
          <Image
            src={STORY_IMAGES[index % STORY_IMAGES.length]}
            alt={slide.title}
            fill
            sizes="(max-width: 448px) 100vw, 448px"
            className="object-cover"
          />
        </div>
        <div className="px-6 pt-7">
          <h3 className="text-3xl font-bold">{slide.title}</h3>
          <p className="mt-4 text-lg leading-loose text-neutral-500">{slide.body}</p>
        </div>
      </div>

      <div className="flex justify-center gap-2.5 py-8">
        {slides.map((s, i) => (
          <button
            key={s.title}
            type="button"
            aria-label={`Slide ${i + 1}`}
            onClick={(e) => {
              e.stopPropagation();
              setIndex(i);
            }}
            className={`h-2.5 w-2.5 rounded-full transition-colors ${i === index ? "bg-[var(--color-accent)]" : "bg-neutral-200"}`}
          />
        ))}
      </div>
    </div>
  );
}

/* ---------- Screen 3: Support (tip counter + card checkbox) ---------- */

function Support({
  amount,
  setAmount,
  payByCard,
  setPayByCard,
  onNext,
  onBack,
  isSubmitting,
  hasError,
}: {
  amount: number;
  setAmount: (updater: (prev: number) => number) => void;
  payByCard: boolean;
  setPayByCard: (value: boolean) => void;
  onNext: () => void;
  onBack: () => void;
  isSubmitting: boolean;
  hasError: boolean;
}) {
  const t = useTranslations("support");
  const canSubmit = !isSubmitting && (payByCard ? amount >= TIP_STEP : true);

  return (
    <div className="flex flex-1 flex-col pb-8">
      <Header onBack={onBack} />
      <div className="px-6 pt-4">
        <h1 className="text-2xl font-bold uppercase tracking-wide">{t("heading")}</h1>
        <p className="mt-3 max-w-[17rem] text-[15px] leading-relaxed text-neutral-600">{t("intro")}</p>
      </div>

      <div className="mx-6 mt-6 rounded-2xl border border-neutral-100 p-6 shadow-[0_2px_16px_rgba(0,0,0,0.06)]">
        <div className="text-center">
          <p className="text-5xl font-bold text-neutral-900">¥{amount.toLocaleString()}</p>
          <p className="mt-2 text-sm text-neutral-400">{t("amountLabel")}</p>
        </div>
        <hr className="my-5 border-neutral-200" />
        <div className="flex items-center justify-between">
          <button
            type="button"
            aria-label="decrease"
            disabled={amount <= 0}
            onClick={() => setAmount((prev) => Math.max(0, prev - TIP_STEP))}
            className="flex h-14 w-14 items-center justify-center rounded-full border border-neutral-200 text-[var(--color-accent)] disabled:opacity-30"
          >
            <span className="h-0.5 w-4 rounded-full bg-current" />
          </button>
          <span className="text-3xl font-bold text-neutral-900">{amount.toLocaleString()}</span>
          <button
            type="button"
            onClick={() => setAmount((prev) => prev + TIP_STEP)}
            className="rounded-full bg-[var(--color-accent)] px-5 py-3 text-base font-bold text-white"
          >
            +¥{TIP_STEP}
          </button>
        </div>
      </div>
      <div className="mt-4 text-center text-sm leading-relaxed text-neutral-400">
        <p>{t("addNote")}</p>
        <p>{t("addNoteSub")}</p>
      </div>

      <label className="mx-6 mt-5 flex cursor-pointer items-start gap-3 rounded-xl border border-neutral-200 p-4">
        <input
          type="checkbox"
          checked={payByCard}
          onChange={(e) => setPayByCard(e.target.checked)}
          className="mt-0.5 h-5 w-5 accent-[var(--color-accent)]"
        />
        <span className="text-sm">
          <span className="font-semibold">{t("cardCheckbox")}</span>
          <span className="mt-0.5 block text-xs text-neutral-500">{payByCard ? t("cardHint") : t("cashHint")}</span>
        </span>
      </label>

      {hasError ? <p className="mt-4 px-6 text-center text-sm text-red-600">{t("errorGeneric")}</p> : null}

      <div className="mt-auto px-6 pt-8">
        <AccentButton onClick={onNext} disabled={!canSubmit}>
          {t("next")}
        </AccentButton>
        <p className="mt-4 flex items-center justify-center gap-1.5 text-xs text-neutral-400">
          <svg
            viewBox="0 0 24 24"
            className="h-4 w-4"
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
          {t("secure")}
        </p>
      </div>
    </div>
  );
}

/* ---------- Screen 4: Review ---------- */

function Review({
  tipId,
  onDone,
  onBack,
}: {
  tipId: string;
  // googleReviewUrl is non-null when the rating qualifies for the store's Google
  // review page — offered later on the Stay Connected screen, not jumped to here.
  onDone: (googleReviewUrl: string | null) => void;
  onBack: () => void;
}) {
  const t = useTranslations("review");
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState("");
  const [photoUrls, setPhotoUrls] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function uploadPhoto(file: File) {
    setUploading(true);
    setError(null);
    try {
      const form = new FormData();
      form.append("file", file);
      form.append("tipId", tipId);
      const res = await fetch("/api/reviews/photo", { method: "POST", body: form });
      if (!res.ok) throw new Error("upload_failed");
      const { url } = (await res.json()) as { url: string };
      setPhotoUrls((prev) => [...prev, url].slice(0, 6));
    } catch {
      setError(t("errorGeneric"));
    } finally {
      setUploading(false);
    }
  }

  async function submit() {
    if (rating === 0) return;
    setIsSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tipId,
          rating,
          comment: comment.trim() || undefined,
          photoUrls: photoUrls.length ? photoUrls : undefined,
        }),
      });
      if (!res.ok) throw new Error("review_failed");
      const { redirectUrl } = (await res.json()) as { redirectUrl: string | null };
      // Always continue to Thank You / Stay Connected in-app; the Google review
      // link (if any) is offered as a button there, not an automatic redirect.
      onDone(redirectUrl);
    } catch {
      setError(t("errorGeneric"));
      setIsSubmitting(false);
    }
  }

  return (
    <div className="flex flex-1 flex-col pb-8">
      <Header onBack={onBack} />
      <div className="px-6 pt-4">
        <h1 className="text-2xl font-bold uppercase tracking-wide">{t("heading")}</h1>
        <p className="mt-3 text-[15px] text-neutral-600">{t("question")}</p>

        <div className="mx-auto mt-6 flex max-w-[19rem] justify-between" onMouseLeave={() => setHover(0)}>
          {[1, 2, 3, 4, 5].map((star) => {
            const active = star <= (hover || rating);
            return (
              <button
                key={star}
                type="button"
                aria-label={`${star} star`}
                onClick={() => setRating(star)}
                onMouseEnter={() => setHover(star)}
                className="text-[var(--color-accent)]"
              >
                <svg
                  viewBox="0 0 24 24"
                  className="h-12 w-12"
                  fill={active ? "currentColor" : "none"}
                  stroke="currentColor"
                  strokeWidth="1.25"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M12 3.2l2.6 5.28 5.83.85-4.22 4.11.996 5.81L12 16.9l-5.21 2.74.996-5.81-4.22-4.11 5.83-.85z" />
                </svg>
              </button>
            );
          })}
        </div>

        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder={`${t("commentLabel")} ${t("commentOptional")}`}
          rows={5}
          className="mt-7 w-full rounded-2xl border border-neutral-200 p-4 text-[15px] leading-relaxed placeholder:text-neutral-400 focus:border-[var(--color-accent)] focus:outline-none"
        />

        <p className="mt-6 text-sm font-medium text-neutral-700">{t("photoLabel")}</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {photoUrls.map((url) => (
            <div key={url} className="relative h-16 w-16 overflow-hidden rounded-xl bg-neutral-100">
              <Image src={url} alt="review" fill sizes="64px" className="object-cover" />
            </div>
          ))}
          <label className="flex h-16 w-16 cursor-pointer items-center justify-center rounded-xl bg-neutral-100 text-[var(--color-accent)]">
            {uploading ? (
              "…"
            ) : (
              <svg
                viewBox="0 0 24 24"
                className="h-7 w-7"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.7"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M4 7.5h3l1.4-2h7.2L17 7.5h3a1 1 0 0 1 1 1V18a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V8.5a1 1 0 0 1 1-1z" />
                <circle cx="12" cy="13" r="3.4" />
              </svg>
            )}
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="sr-only"
              disabled={uploading || photoUrls.length >= 6}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) void uploadPhoto(file);
                e.target.value = "";
              }}
            />
          </label>
        </div>

        {error ? <p className="mt-4 text-sm text-red-600">{error}</p> : null}
      </div>

      <div className="mt-auto px-6 pt-8">
        <AccentButton onClick={submit} disabled={rating === 0 || isSubmitting}>
          {t("submit")}
        </AccentButton>
        <p className="mt-4 text-center text-sm leading-relaxed text-neutral-500">
          {t("helperLine1")}
          <br />
          {t("helperLine2")}
        </p>
      </div>
    </div>
  );
}

/* ---------- Screen 5: Thank You ---------- */

function ThankYou({ onHome, onReviews }: { onHome: () => void; onReviews: () => void }) {
  const t = useTranslations("thankYou");
  return (
    <div className="flex flex-1 flex-col">
      <Header />
      <div className="flex flex-1 flex-col items-center justify-center px-6 pb-16 text-center">
        <div className="relative text-[var(--color-accent)]">
          <span className="flex h-24 w-24 items-center justify-center rounded-full border-[3px] border-current">
            <svg viewBox="0 0 24 24" className="h-11 w-11" fill="currentColor" aria-hidden="true">
              <path d="M12 21.3s-7.6-4.6-10.2-9.4C.4 8.9 1.8 5.1 5.5 5.1c2.1 0 3.7 1.3 4.7 2.9 1-1.6 2.6-2.9 4.7-2.9 3.7 0 5.1 3.8 3.7 6.8-2.6 4.8-10.2 9.4-10.2 9.4z" />
            </svg>
          </span>
          <div className="absolute -right-1 -top-2 flex items-end gap-1">
            <span className="h-3.5 w-1 -rotate-[8deg] rounded-full bg-current" />
            <span className="h-4 w-1 rotate-[18deg] rounded-full bg-current" />
            <span className="h-3 w-1 rotate-[44deg] rounded-full bg-current" />
          </div>
        </div>
        <h1 className="mt-8 text-4xl font-bold uppercase tracking-tight">{t("title")}</h1>
        <p className="mt-5 max-w-[13rem] text-base leading-relaxed text-neutral-500">
          {t("subtitlePart1")}
          <br />
          {t("subtitlePart2")}
        </p>

        <div className="mt-12 w-full max-w-xs">
          <button
            type="button"
            onClick={onHome}
            className="w-full rounded-xl border border-[var(--color-accent)] py-4 text-center text-base font-semibold text-[var(--color-accent)]"
          >
            {t("backToTop")}
          </button>
          <button
            type="button"
            onClick={onReviews}
            className="mt-6 flex w-full items-center justify-center gap-1.5 text-base font-semibold text-[var(--color-accent)]"
          >
            {t("viewReviews")}
            <svg
              viewBox="0 0 24 24"
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M9 6l6 6-6 6" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}

/* ---------- Screen 6: Stay Connected ---------- */

function Connect({
  store,
  reviewUrl,
  onBack,
  onHome,
  onStory,
  onReviews,
  onSupport,
}: {
  store: GuestStore;
  // The store's Google "write a review" link when the guest just left a
  // qualifying rating; falls back to the general Maps listing otherwise.
  reviewUrl: string | null;
  onBack: () => void;
  onHome: () => void;
  onStory: () => void;
  onReviews: () => void;
  onSupport: () => void;
}) {
  const t = useTranslations("connect");
  const googleHref = reviewUrl ?? (store.googlePlaceId ? googleMapsUrl(store.googlePlaceId) : null);
  const links = [
    store.instagramUrl
      ? { key: "instagram", label: t("instagram"), href: store.instagramUrl, icon: <InstagramIcon size={30} /> }
      : null,
    store.facebookUrl
      ? { key: "facebook", label: t("facebook"), href: store.facebookUrl, icon: <FacebookIcon size={30} /> }
      : null,
    googleHref ? { key: "google", label: t("google"), href: googleHref, icon: <GoogleIcon size={30} /> } : null,
  ].filter(Boolean) as { key: string; label: string; href: string; icon: ReactNode }[];

  return (
    <div className="flex flex-1 flex-col pb-20">
      <Header onBack={onBack} />
      <div className="px-6 pt-4">
        <h1 className="text-2xl font-bold uppercase tracking-wide">{t("heading")}</h1>
        <p className="mt-2 text-base leading-snug text-neutral-500">
          {t("subtitleLine1")}
          <br />
          {t("subtitleLine2")}
        </p>

        <div className="mt-6 flex flex-col gap-3">
          {links.length === 0 ? (
            <p className="rounded-xl bg-neutral-50 p-4 text-center text-sm text-neutral-400">—</p>
          ) : (
            links.map((link) => (
              <a
                key={link.key}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between rounded-xl border border-neutral-200 px-4 py-3 text-sm font-medium hover:bg-neutral-50"
              >
                <span className="flex items-center gap-3">
                  {link.icon}
                  {link.label}
                </span>
                <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0 text-neutral-300" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 6l6 6-6 6" />
                </svg>
              </a>
            ))
          )}
        </div>
      </div>

      {/* Full-bleed, edge-to-edge — anchored just above the bottom nav. */}
      <div className="mt-auto grid grid-cols-2 gap-0.5">
        <div className="relative aspect-[4/3] overflow-hidden bg-neutral-100">
          <Image src={STORY_IMAGES[0]} alt={store.name} fill sizes="224px" className="object-cover" />
        </div>
        <div className="relative aspect-[4/3] overflow-hidden bg-neutral-100">
          <Image src={STORY_IMAGES[2]} alt={store.name} fill sizes="224px" className="object-cover" />
        </div>
      </div>

      <BottomNav active="home" onHome={onHome} onStory={onStory} onReviews={onReviews} onSupport={onSupport} />
    </div>
  );
}

/* ---------- Bottom nav (screen 6) ---------- */

function BottomNav({
  active,
  onHome,
  onStory,
  onReviews,
  onSupport,
}: {
  active: "home" | "story" | "reviews" | "support";
  onHome: () => void;
  onStory: () => void;
  onReviews: () => void;
  onSupport: () => void;
}) {
  const t = useTranslations("nav");
  const iconProps = {
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    className: "h-5 w-5",
  };
  const items: { key: "home" | "story" | "reviews" | "support"; label: string; icon: ReactNode; go: () => void }[] = [
    {
      key: "home",
      label: t("home"),
      go: onHome,
      icon: (
        <svg {...iconProps}>
          <path d="M3 11.5 12 4l9 7.5" />
          <path d="M5.5 10v9.5h13V10" />
        </svg>
      ),
    },
    {
      key: "story",
      label: t("story"),
      go: onStory,
      icon: (
        <svg {...iconProps}>
          <rect x="4" y="5" width="16" height="14" rx="2" />
          <circle cx="9" cy="10" r="1.4" />
          <path d="M4.5 16l4.5-3.5 3 2.5 3.5-4 4.5 5" />
        </svg>
      ),
    },
    {
      key: "reviews",
      label: t("reviews"),
      go: onReviews,
      icon: (
        <svg {...iconProps}>
          <path d="M12 4l2.5 5.1 5.6.8-4 3.9.9 5.6-5-2.6-5 2.6.9-5.6-4-3.9 5.6-.8z" />
        </svg>
      ),
    },
    {
      key: "support",
      label: t("support"),
      go: onSupport,
      icon: (
        <svg {...iconProps}>
          <path d="M4 6.5A2.5 2.5 0 0 1 6.5 4h11A2.5 2.5 0 0 1 20 6.5v7a2.5 2.5 0 0 1-2.5 2.5H9l-4 3v-3H6.5A2.5 2.5 0 0 1 4 13.5z" />
          <path d="M8 9h8M8 12.5h5" />
        </svg>
      ),
    },
  ];
  return (
    <nav className="fixed inset-x-0 bottom-0 mx-auto flex max-w-md items-center justify-around border-t border-neutral-200 bg-white py-2">
      {items.map((item) => (
        <button
          key={item.key}
          type="button"
          onClick={item.go}
          className={`flex flex-1 flex-col items-center gap-1 py-1 text-[10px] ${
            item.key === active ? "font-semibold text-[var(--color-accent)]" : "text-neutral-400"
          }`}
        >
          {item.icon}
          {item.label}
        </button>
      ))}
    </nav>
  );
}
