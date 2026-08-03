"use client";

import { useTranslations } from "next-intl";
import { Dancing_Script } from "next/font/google";
import Image from "next/image";
import { type ReactNode, useEffect, useState } from "react";

// Script face for the "Thank you" hero on the final screen (latin only; CJK
// falls back gracefully).
const scriptFont = Dancing_Script({ subsets: ["latin"], weight: "700", display: "swap" });
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
import { downscaleImage } from "@/lib/image-resize";
import { type LocaleText, pickLocaleText } from "@/lib/story";
import { CARD_MIN_AMOUNT, TIP_MAX, TIP_STEP } from "@/lib/tip";

export type StorySlideContent = { title: LocaleText; body: LocaleText; imageUrl: string | null };

// A review photo held on the Support screen before the tip exists: kept as the
// picked file plus an object-URL preview, uploaded once the tip has an id.
type ReviewPhoto = { file: File; preview: string };

export type GuestStore = {
  slug: string;
  name: string;
  // Landing cover/intro image; falls back to the first story slide, then stock.
  coverImageUrl: string | null;
  googlePlaceId: string | null;
  instagramUrl: string | null;
  facebookUrl: string | null;
  // Per-store "Our Story" slides; empty falls back to the stock story text.
  storySlides: StorySlideContent[];
};

type Step = "landing" | "support" | "payment" | "thankyou";

// Forward order of the flow — used to pick the slide direction between screens.
// Three guest-facing pages: the main page (cover + tip + story), the tip/review
// page (Support: rating + comment + photos), and Thank You. The review is
// captured on Support and submitted after the tip succeeds; the card payment is
// a sub-step of Support, not a separate page.
const STEP_ORDER: Step[] = ["landing", "support", "payment", "thankyou"];

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
      <div className="flex min-h-11 items-center gap-2">
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
    <button
      type="button"
      onClick={onClick}
      aria-label={tc("back")}
      className="-ml-1.5 flex h-9 w-9 items-center justify-center rounded-full text-neutral-500 transition hover:bg-neutral-100"
    >
      <svg
        viewBox="0 0 24 24"
        className="h-6 w-6"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M15 18l-6-6 6-6" />
      </svg>
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

/** Tip amount card: big amount, minus/plus in $1 steps ($0 floor). Shared by the
 *  TOP page (leads above the story) and the Support screen (confirm + pay). The
 *  amount is a shared state so both stay in sync. */
function TipCounter({
  amount,
  setAmount,
}: {
  amount: number;
  setAmount: (updater: (prev: number) => number) => void;
}) {
  const t = useTranslations("support");
  // Amounts are USD cents; the counter moves in whole dollars.
  const dollars = (amount / 100).toLocaleString("en-US");

  // Manual entry — whole dollars only, capped at TIP_MAX.
  function onInput(event: React.ChangeEvent<HTMLInputElement>) {
    const digits = event.target.value.replace(/[^0-9]/g, "");
    const value = digits === "" ? 0 : Math.min(Number(digits), TIP_MAX / 100);
    setAmount(() => value * 100);
  }

  return (
    <div className="rounded-2xl border border-neutral-100 p-6 shadow-[0_2px_16px_rgba(0,0,0,0.06)]">
      <div className="text-center">
        <p className="text-5xl font-bold text-neutral-900">${dollars}</p>
        <p className="mt-2 text-sm text-neutral-400">{t("amountLabel")}</p>
      </div>
      <hr className="my-5 border-neutral-200" />
      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          aria-label="decrease"
          disabled={amount <= 0}
          onClick={() => setAmount((prev) => Math.max(0, prev - TIP_STEP))}
          className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border border-neutral-200 text-[var(--color-accent)] disabled:opacity-30"
        >
          <span className="h-0.5 w-4 rounded-full bg-current" />
        </button>
        <div className="flex min-w-0 flex-1 items-center justify-center gap-0.5">
          <span className="text-3xl font-bold text-neutral-900">$</span>
          <input
            type="text"
            inputMode="numeric"
            value={amount === 0 ? "" : String(amount / 100)}
            onChange={onInput}
            placeholder="0"
            aria-label={t("amountLabel")}
            className="w-full max-w-[7rem] border-b-2 border-neutral-200 bg-transparent text-center text-3xl font-bold text-neutral-900 focus:border-[var(--color-accent)] focus:outline-none"
          />
        </div>
        <button
          type="button"
          onClick={() => setAmount((prev) => Math.min(TIP_MAX, prev + TIP_STEP))}
          className="shrink-0 rounded-full bg-[var(--color-accent)] px-5 py-3 text-base font-bold text-white"
        >
          +${TIP_STEP / 100}
        </button>
      </div>
    </div>
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
  // is already paid. Card redirects are disabled, so this is a rare fallback —
  // the review draft is gone on reload, so resume straight at Thank You.
  resumeTipId?: string | null;
}) {
  const { locale } = useLocaleSwitcher();
  const [step, setStep] = useState<Step>(resumeTipId ? "thankyou" : "landing");
  // +1 when moving forward through the flow, -1 when going back — drives the
  // slide direction so a section transition reads like a real phone swipe.
  const [direction, setDirection] = useState(1);

  function goToStep(next: Step) {
    setDirection(STEP_ORDER.indexOf(next) >= STEP_ORDER.indexOf(step) ? 1 : -1);
    setStep(next);
  }

  // Each screen remounts on step change but the window keeps the previous
  // screen's scroll offset — so a tall new screen would open mid-page. Reset to
  // the top whenever the step changes.
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [step]);
  // Tip starts at $1 (the counter leads the TOP page); the guest can lower it to
  // $0 (review-only) or raise it in $1 steps.
  const [amount, setAmount] = useState(TIP_STEP);
  // Default is cash (settled at the register); the guest opts into online pay.
  const [payByCard, setPayByCard] = useState(false);
  const [tipId, setTipId] = useState<string | null>(resumeTipId);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // The store's Google review page (when it has a Place ID), offered on Stay
  // Connected after any review.
  const [googleReviewUrl, setGoogleReviewUrl] = useState<string | null>(null);
  // Whether to show the follow/review buttons on Stay Connected — always on now
  // (every rating is offered Google / Facebook / Instagram).
  const [promote, setPromote] = useState(true);

  // Review draft — captured on the Support screen alongside the tip, submitted
  // once the tip has succeeded (after payment for card). Photos are held as
  // deferred files (with object-URL previews) since the upload needs a tip id.
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [photos, setPhotos] = useState<{ file: File; preview: string }[]>([]);

  function reset() {
    setAmount(TIP_STEP);
    setPayByCard(false);
    setTipId(null);
    setClientSecret(null);
    setError(null);
    setGoogleReviewUrl(null);
    setPromote(true);
    setRating(0);
    setComment("");
    for (const p of photos) URL.revokeObjectURL(p.preview);
    setPhotos([]);
    goToStep("landing");
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
        // Card: pay first, then submit the review once the charge succeeds.
        setClientSecret(data.clientSecret);
        goToStep("payment");
      } else {
        // Cash: the tip is already recorded — submit the review now.
        await finishWithReview(data.tipId);
      }
    } catch {
      setError("support");
    } finally {
      setIsSubmitting(false);
    }
  }

  // Finish the interaction, then continue to Thank You. If the guest left a
  // rating, upload the deferred photos (they need the now-existing tip id) and
  // submit the review — that call also notifies the admin. Without a rating the
  // review is skipped, so notify the admin of the tip on its own. The tip is
  // already recorded, so any hiccup here still lands on Thank You.
  async function finishWithReview(tid: string) {
    try {
      if (rating > 0) {
        // Downscale + upload all photos in parallel so submit doesn't stall.
        const uploads = await Promise.all(
          photos.map(async ({ file }) => {
            const form = new FormData();
            form.append("file", await downscaleImage(file));
            form.append("tipId", tid);
            const res = await fetch("/api/reviews/photo", { method: "POST", body: form });
            if (!res.ok) return null;
            const { url } = (await res.json()) as { url: string };
            return url;
          }),
        );
        const photoUrls = uploads.filter((u): u is string => u != null);
        const res = await fetch("/api/reviews", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            tipId: tid,
            rating,
            comment: comment.trim() || undefined,
            photoUrls: photoUrls.length ? photoUrls : undefined,
          }),
        });
        if (res.ok) {
          const { redirectUrl } = (await res.json()) as { redirectUrl: string | null };
          setGoogleReviewUrl(redirectUrl);
        }
      } else {
        // Tip without a review — still alert the admin / register.
        await fetch("/api/tips/notify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ tipId: tid }),
        });
      }
    } catch {
      // Best effort — the tip is recorded regardless; fall through to Thank You.
    } finally {
      setPromote(true);
      goToStep("thankyou");
    }
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col overflow-hidden bg-white">
      {/* Keyed on `step` so each section remounts and plays the slide-in; the
          direction class makes it feel like swiping forward/back on a phone. */}
      <div key={step} className={`flex flex-1 flex-col ${direction >= 0 ? "flow-screen-fwd" : "flow-screen-back"}`}>
        {step === "landing" && (
          <Landing store={store} amount={amount} setAmount={setAmount} onStart={() => goToStep("support")} />
        )}
      {step === "support" && (
        <Support
          amount={amount}
          setAmount={setAmount}
          payByCard={payByCard}
          setPayByCard={setPayByCard}
          rating={rating}
          setRating={setRating}
          comment={comment}
          setComment={setComment}
          photos={photos}
          setPhotos={setPhotos}
          onNext={startCheckout}
          onBack={() => goToStep("landing")}
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
          preferredWallet={null}
          onPaid={() => finishWithReview(tipId)}
          onBack={() => goToStep("support")}
        />
      )}
      {step === "thankyou" && (
        <ThankYou store={store} reviewUrl={googleReviewUrl} promote={promote} onHome={reset} />
      )}
      </div>
    </div>
  );
}

/* ---------- Screen 1: Main (cover + tip + story) ---------- */

/** Resolve the store's story slides to the guest's language, falling back to the
 *  stock story text (and stock photos) when the store hasn't set its own. */
function useResolvedSlides(store: GuestStore) {
  const t = useTranslations("story");
  const { locale } = useLocaleSwitcher();
  const stockSlides = t.raw("slides") as { title: string; body: string }[];
  return store.storySlides.length > 0
    ? store.storySlides.map((slide) => ({
        title: pickLocaleText(slide.title, locale),
        body: pickLocaleText(slide.body, locale),
        imageUrl: slide.imageUrl,
      }))
    : stockSlides.map((slide) => ({ title: slide.title, body: slide.body, imageUrl: null }));
}

// The main page: cover, the tip counter that leads the flow, then the story.
// "Next" moves on to the tip/review page.
function Landing({
  store,
  amount,
  setAmount,
  onStart,
}: {
  store: GuestStore;
  amount: number;
  setAmount: (updater: (prev: number) => number) => void;
  onStart: () => void;
}) {
  const t = useTranslations("story");
  const tc = useTranslations("common");
  const ts = useTranslations("support");
  const slides = useResolvedSlides(store);
  // Cover: the store's intro image if set, else the first slide's photo, else stock.
  const coverImage = store.coverImageUrl ?? slides[0]?.imageUrl ?? STORY_IMAGES[0];
  return (
    <div className="flex flex-1 flex-col pb-10">
      <Header />

      {/* Hero */}
      <div className="px-8 pt-8 text-center">
        <Wordmark className="text-[52px] leading-none tracking-tight" />
        <p className="mx-auto mt-6 max-w-[16rem] text-[13px] font-semibold uppercase leading-relaxed tracking-[0.18em] text-neutral-700">
          {t("tagline")}
        </p>
      </div>

      {/* Cover — full-bleed with a soft gradient foot */}
      <div className="relative mt-8 aspect-[4/3] overflow-hidden bg-neutral-100">
        <Image
          src={coverImage}
          alt={store.name}
          fill
          sizes="(max-width: 448px) 100vw, 448px"
          className="object-cover"
          priority
        />
        <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/25 to-transparent" />
      </div>

      {/* Tip — leads the flow. Starts at $1 (adjustable, $0 allowed); the amount
          carries through to the Support screen where payment is chosen. */}
      <div className="mt-10 px-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold uppercase tracking-wide text-neutral-900">{ts("heading")}</h2>
          <p className="mx-auto mt-2 max-w-[18rem] text-[14px] leading-relaxed text-neutral-500">{ts("intro")}</p>
        </div>
        <div className="mt-5">
          <TipCounter amount={amount} setAmount={setAmount} />
        </div>
        <div className="mt-3 text-center text-sm leading-relaxed text-neutral-400">
          <p>{ts("addNote")}</p>
          <p>{ts("addNoteSub")}</p>
        </div>
        {/* A gentle, reassuring line — tipping is never expected. */}
        <div className="mt-4 flex justify-center">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--color-accent)]/[0.07] px-4 py-2 text-xs font-medium tracking-wide text-[var(--color-accent)]">
            <Heart filled className="h-3 w-3 shrink-0" />
            {ts("zeroOk")}
          </span>
        </div>
      </div>

      {/* Our Story — below the tip, read by scrolling down. */}
      <div className="px-8 pt-16 text-center">
        <h2 className="text-2xl font-bold uppercase tracking-[0.12em] text-neutral-900">{t("heading")}</h2>
        <div className="mx-auto mt-3 h-1 w-10 rounded-full bg-[var(--color-accent)]" />
      </div>

      <div className="mt-9 flex flex-col gap-16">
        {slides.map((slide, i) => (
          <section key={`${i}-${slide.title}`} className="px-6">
            <div className="relative aspect-[4/3] overflow-hidden rounded-3xl bg-neutral-100 shadow-[0_12px_34px_rgba(0,0,0,0.09)]">
              <Image
                src={slide.imageUrl ?? STORY_IMAGES[(i + 1) % STORY_IMAGES.length]}
                alt={slide.title}
                fill
                sizes="(max-width: 448px) 100vw, 448px"
                className="object-cover"
              />
              <span className="absolute left-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-sm font-bold text-[var(--color-accent)] shadow-md backdrop-blur">
                {String(i + 1).padStart(2, "0")}
              </span>
            </div>
            <div className="px-1 pt-6 text-center">
              <h3 className="text-[26px] font-bold leading-tight text-neutral-900">{slide.title}</h3>
              <p className="mx-auto mt-3 max-w-[21rem] text-[15px] leading-loose text-neutral-500">{slide.body}</p>
            </div>
          </section>
        ))}
      </div>

      {/* Closing + Next → tip / review page */}
      <div className="mt-16 px-6">
        <div className="mx-auto mb-9 h-px w-16 bg-neutral-200" />
        <AccentButton onClick={onStart}>
          <span className="flex items-center justify-center gap-2">
            {tc("next")} <span className="text-lg">›</span>
          </span>
        </AccentButton>
        <p className="mt-4 text-center text-xs tracking-wide text-neutral-400">
          {t("poweredByPrefix")} <span className="font-bold text-neutral-600">ARIGATO TiP</span>
        </p>
      </div>
    </div>
  );
}

/* ---------- Screen 3: Support (tip + review) ---------- */

// The tip page, now with the review (rating / comment / photos) on the same
// screen. On Next the tip is created and — after payment for card — the review
// is submitted (or a tip-only notification is sent when no rating was given).
function Support({
  amount,
  setAmount,
  payByCard,
  setPayByCard,
  rating,
  setRating,
  comment,
  setComment,
  photos,
  setPhotos,
  onNext,
  onBack,
  isSubmitting,
  hasError,
}: {
  amount: number;
  setAmount: (updater: (prev: number) => number) => void;
  payByCard: boolean;
  setPayByCard: (value: boolean) => void;
  rating: number;
  setRating: (value: number) => void;
  comment: string;
  setComment: (value: string) => void;
  photos: ReviewPhoto[];
  setPhotos: (updater: (prev: ReviewPhoto[]) => ReviewPhoto[]) => void;
  onNext: () => void;
  onBack: () => void;
  isSubmitting: boolean;
  hasError: boolean;
}) {
  const t = useTranslations("support");
  const tr = useTranslations("review");
  const [hover, setHover] = useState(0);
  // Submit stays disabled until the guest selects a star rating. The card path
  // additionally needs a chargeable amount ($1 min), since Stripe can't charge $0.
  const canSubmit = !isSubmitting && rating > 0 && (!payByCard || amount >= CARD_MIN_AMOUNT);

  function addPhoto(file: File) {
    setPhotos((prev) => (prev.length >= 6 ? prev : [...prev, { file, preview: URL.createObjectURL(file) }]));
  }
  function removePhoto(preview: string) {
    URL.revokeObjectURL(preview);
    setPhotos((prev) => prev.filter((p) => p.preview !== preview));
  }

  return (
    <div className="flex flex-1 flex-col pb-8">
      <Header onBack={onBack} />
      <div className="px-6 pt-4">
        <h1 className="text-2xl font-bold uppercase tracking-wide">{t("heading")}</h1>
        <p className="mt-3 max-w-[17rem] text-[15px] leading-relaxed text-neutral-600">{t("intro")}</p>
      </div>

      <div className="mx-6 mt-6">
        <TipCounter amount={amount} setAmount={setAmount} />
      </div>
      <div className="mt-4 text-center text-sm leading-relaxed text-neutral-400">
        <p>{t("addNote")}</p>
        <p>{t("addNoteSub")}</p>
      </div>
      {/* A gentle, reassuring line — tipping is never expected. */}
      <div className="mt-4 flex justify-center px-6">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--color-accent)]/[0.07] px-4 py-2 text-xs font-medium tracking-wide text-[var(--color-accent)]">
          <Heart filled className="h-3 w-3 shrink-0" />
          {t("zeroOk")}
        </span>
      </div>

      {/* Cash is the default; ticking this pays online (card / Apple Pay /
          Google Pay are offered on the next screen). */}
      <label className="mx-6 mt-5 flex cursor-pointer items-start gap-3 rounded-xl border border-neutral-200 p-4">
        <input
          type="checkbox"
          checked={payByCard}
          onChange={(e) => setPayByCard(e.target.checked)}
          className="mt-0.5 h-5 w-5 accent-[var(--color-accent)]"
        />
        <span className="text-sm">
          <span className="font-semibold">{t("cardCheckbox")}</span>
          <span className="mt-0.5 block text-xs leading-snug text-neutral-500">
            {payByCard ? t("cardHint") : t("cashHint")}
          </span>
        </span>
      </label>

      {/* Review — rating (required) plus optional comment and photos. */}
      <div className="mx-6 mt-8 border-t border-neutral-100 pt-6">
        <h2 className="text-lg font-bold">{tr("heading")}</h2>
        <p className="mt-1 text-sm text-neutral-600">{tr("question")}</p>

        <div className="mx-auto mt-5 flex max-w-[19rem] justify-between" onMouseLeave={() => setHover(0)}>
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
                  className="h-11 w-11"
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
          placeholder={`${tr("commentLabel")} ${tr("commentOptional")}`}
          rows={4}
          className="mt-6 w-full rounded-2xl border border-neutral-200 p-4 text-[15px] leading-relaxed placeholder:text-neutral-400 focus:border-[var(--color-accent)] focus:outline-none"
        />

        <p className="mt-5 text-sm font-medium text-neutral-700">{tr("photoLabel")}</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {photos.map((p) => (
            <div key={p.preview} className="relative h-16 w-16 overflow-hidden rounded-xl bg-neutral-100">
              {/* Local object-URL preview; the file uploads on submit. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={p.preview} alt="review" className="h-full w-full object-cover" />
              <button
                type="button"
                aria-label="remove photo"
                onClick={() => removePhoto(p.preview)}
                className="absolute right-0.5 top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-black/55 text-white"
              >
                <svg viewBox="0 0 24 24" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <path d="M6 6l12 12M18 6L6 18" />
                </svg>
              </button>
            </div>
          ))}
          {photos.length < 6 ? (
            <label className="flex h-16 w-16 cursor-pointer items-center justify-center rounded-xl bg-neutral-100 text-[var(--color-accent)]">
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
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="sr-only"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) addPhoto(file);
                  e.target.value = "";
                }}
              />
            </label>
          ) : null}
        </div>
      </div>

      {hasError ? <p className="mt-6 px-6 text-center text-sm text-red-600">{t("errorGeneric")}</p> : null}

      <div className="mt-8 px-6">
        <AccentButton onClick={onNext} disabled={!canSubmit}>
          {isSubmitting ? "…" : t("next")}
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

/* ---------- Screen 5: Thank You ---------- */

function ThankYou({
  store,
  reviewUrl,
  promote,
  onHome,
}: {
  store: GuestStore;
  // Store's Google "write a review" link when the rating qualified; else the
  // general Maps listing (resolved inside FollowMenu).
  reviewUrl: string | null;
  // A 1–3★ review keeps things private — no follow menu is shown.
  promote: boolean;
  onHome: () => void;
}) {
  const t = useTranslations("thankYou");
  return (
    <div className="relative flex flex-1 flex-col overflow-hidden bg-[#f7f4ec]">
      <Header />

      {/* Scattered cherry blossoms + falling petals */}
      <Sakura className="pointer-events-none absolute left-5 top-24 h-11 w-11 rotate-[16deg] text-pink-200" />
      <Sakura className="pointer-events-none absolute right-6 top-32 h-8 w-8 -rotate-6 text-pink-200" />
      <Sakura className="pointer-events-none absolute left-9 top-44 h-6 w-6 rotate-[26deg] text-pink-200/80" />
      <Sakura className="pointer-events-none absolute right-10 top-52 h-7 w-7 rotate-[8deg] text-pink-200/80" />
      <Petal className="pointer-events-none absolute left-16 top-36 h-4 w-4 rotate-[40deg] text-pink-200/80" />
      <Petal className="pointer-events-none absolute right-16 top-24 h-3.5 w-3.5 -rotate-[30deg] text-pink-200/70" />
      <Petal className="pointer-events-none absolute left-6 top-60 h-3 w-3 rotate-[70deg] text-pink-200/70" />

      {/* Heart accents */}
      <Heart className="pointer-events-none absolute right-9 top-[86px] h-6 w-6 -rotate-[14deg] text-red-500" />
      <Heart className="pointer-events-none absolute right-14 top-52 h-5 w-5 rotate-6 text-red-400" />
      <Heart filled className="pointer-events-none absolute left-12 top-[268px] h-5 w-5 text-pink-300" />

      <div className="relative z-10 flex flex-1 flex-col items-center px-6 pb-44 pt-4 text-center">
        {/* Hero */}
        <p className={`${scriptFont.className} mt-2 text-[64px] leading-none text-neutral-900`}>Thank you</p>
        <p className="mt-1 text-sm font-semibold uppercase tracking-[0.26em] text-neutral-800">For your visit!</p>
        <svg
          viewBox="0 0 120 10"
          className="mt-2 h-2.5 w-32 text-[#c8a256]"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M4 6 Q 60 -1 110 4" />
          <path d="M103 1 L113 4 L105 8" />
        </svg>

        {/* Body copy with a dotted, sakura-centred divider */}
        <p className="mt-7 max-w-[15rem] text-[15px] leading-relaxed text-neutral-600">{t("subtitlePart1")}</p>
        <div className="my-5 flex w-full max-w-[15rem] items-center gap-3 text-[#cbb07a]">
          <span className="h-0 flex-1 border-t border-dotted border-current" />
          <Sakura className="h-4 w-4 text-pink-300" />
          <span className="h-0 flex-1 border-t border-dotted border-current" />
        </div>
        <p className="max-w-[15rem] text-[15px] leading-relaxed text-neutral-600">{t("subtitlePart2")}</p>

        {/* Follow menu directly below the thank-you, for positive reviewers. */}
        {promote ? <FollowMenu store={store} reviewUrl={reviewUrl} className="mt-9 w-full max-w-xs" /> : null}

        <button
          type="button"
          onClick={onHome}
          className="mt-9 w-full max-w-xs rounded-xl border border-[var(--color-accent)] bg-white/60 py-4 text-center text-base font-semibold text-[var(--color-accent)]"
        >
          {t("backToTop")}
        </button>
      </div>

      {/* Gold Japan skyline artwork anchored to the bottom */}
      <Image
        src="/lp/skyline.png"
        alt=""
        width={889}
        height={345}
        className="pointer-events-none absolute inset-x-0 bottom-0 z-0 h-auto w-full"
      />
    </div>
  );
}

/* ---------- Thank-you decorations ---------- */

// A single cherry-blossom petal with the characteristic notched tip.
const PETAL_PATH = "M0 0C-6 -5 -7 -15 -2.6 -20L0 -16.5 2.6 -20C7 -15 6 -5 0 0Z";

/** Five-petal cherry blossom with a pale centre + stamens; colour via `text-*`. */
function Sakura({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="-24 -24 48 48" className={className} fill="currentColor" aria-hidden="true">
      {[0, 72, 144, 216, 288].map((a) => (
        <path key={a} transform={`rotate(${a})`} d={PETAL_PATH} />
      ))}
      <circle r="3" fill="#fff" opacity="0.7" />
      <g fill="#fff" opacity="0.85">
        {[0, 60, 120, 180, 240, 300].map((a) => (
          <circle key={a} transform={`rotate(${a}) translate(0 -4.6)`} r="0.9" />
        ))}
      </g>
    </svg>
  );
}

/** Single falling petal; colour via `text-*`. */
function Petal({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="-8 -22 16 24" className={className} fill="currentColor" aria-hidden="true">
      <path d={PETAL_PATH} />
    </svg>
  );
}

/** Heart accent — outline by default, solid when `filled`. Colour via `text-*`. */
function Heart({ className = "", filled = false }: { className?: string; filled?: boolean }) {
  return (
    <svg
      viewBox="0 0 32 29"
      className={className}
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth={filled ? 0 : 2.4}
      strokeLinejoin="round"
      strokeLinecap="round"
      aria-hidden="true"
    >
      {/* Smooth twin-lobe heart with a gentle dimple and a soft point. */}
      <path d="M16 27C16 27 2 18.6 2 9.6 2 5.4 5.3 2.4 9.2 2.4 12 2.4 14.6 4 16 6.6 17.4 4 20 2.4 22.8 2.4 26.7 2.4 30 5.4 30 9.6 30 18.6 16 27 16 27Z" />
    </svg>
  );
}

/* ---------- Follow menu (shown under Thank You) ---------- */

function FollowMenu({
  store,
  reviewUrl,
  className = "",
}: {
  store: GuestStore;
  reviewUrl: string | null;
  className?: string;
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

  if (links.length === 0) return null;

  return (
    <div className={className}>
      <div className="flex flex-col gap-3">
        {links.map((link) => (
          <a
            key={link.key}
            href={link.href}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between rounded-xl border border-neutral-200 px-4 py-3 text-left text-sm font-medium hover:bg-neutral-50"
          >
            <span className="flex items-center gap-3">
              {link.icon}
              {link.label}
            </span>
            <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0 text-neutral-300" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 6l6 6-6 6" />
            </svg>
          </a>
        ))}
      </div>
    </div>
  );
}
