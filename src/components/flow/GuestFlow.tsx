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
import { LOCALES } from "@/i18n/messages";
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

function Header({ left }: { left?: ReactNode }) {
  return (
    <header className="flex items-start justify-between px-5 pt-5">
      <div className="min-h-11 min-w-11">{left}</div>
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

const FLAGS: Record<(typeof LOCALES)[number], string> = { ja: "🇯🇵", en: "🇺🇸", ko: "🇰🇷", zh: "🇨🇳" };
const LANG_LABEL: Record<(typeof LOCALES)[number], "japanese" | "english" | "korean" | "chinese"> = {
  ja: "japanese",
  en: "english",
  ko: "korean",
  zh: "chinese",
};

/** Language picker kept off the main visuals — a globe on the landing, the ☰ menu on Our Story. */
function LanguageMenu({ variant }: { variant: "globe" | "menu" }) {
  const t = useTranslations("language");
  const { locale, setLocale } = useLocaleSwitcher();
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label="Language"
        className={
          variant === "menu"
            ? "text-2xl leading-none text-neutral-700"
            : "flex items-center gap-1 text-neutral-500"
        }
      >
        {variant === "menu" ? "☰" : <><span className="text-lg">🌐</span><span className="text-xs font-semibold uppercase">{locale}</span></>}
      </button>
      {open ? (
        <ul className="absolute left-0 top-10 z-30 w-36 overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-lg">
          {LOCALES.map((code) => (
            <li key={code}>
              <button
                type="button"
                onClick={() => {
                  setLocale(code);
                  setOpen(false);
                }}
                className={`flex w-full items-center gap-2 px-3 py-2 text-sm ${code === locale ? "bg-neutral-50 font-semibold" : ""}`}
              >
                <span>{FLAGS[code]}</span>
                {t(LANG_LABEL[code])}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
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
      className="w-full rounded-xl bg-[var(--color-accent)] py-4 text-center font-semibold text-white transition-colors hover:bg-[var(--color-accent-dark)] disabled:opacity-40"
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

  function reset() {
    setAmount(0);
    setPayByCard(false);
    setTipId(null);
    setClientSecret(null);
    setError(null);
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
          onPaid={() => setStep("review")}
          onBack={() => setStep("support")}
        />
      )}
      {step === "review" && tipId && (
        <Review tipId={tipId} onDone={() => setStep("thankyou")} onBack={() => setStep("support")} />
      )}
      {step === "thankyou" && <ThankYou onHome={reset} onReviews={goReviews} />}
      {step === "connect" && (
        <Connect
          store={store}
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
      <Header left={<LanguageMenu variant="globe" />} />
      <div className="px-8 pt-6 text-center">
        <Wordmark className="text-4xl tracking-tight" />
        <p className="mx-auto mt-5 max-w-[16rem] text-xs font-semibold uppercase leading-relaxed tracking-[0.14em] text-neutral-800">
          {t("tagline")}
        </p>
        <p className="mt-2 text-sm font-semibold uppercase tracking-wide text-[var(--color-accent)]">
          {t("takeALook")}
        </p>
      </div>
      <div className="relative mx-6 mt-6 aspect-[5/3] overflow-hidden rounded-2xl bg-neutral-100">
        <Image src={STORY_IMAGES[0]} alt={store.name} fill sizes="(max-width: 448px) 100vw, 448px" className="object-cover" />
      </div>
      <div className="mt-auto px-6 pb-8 pt-8">
        <AccentButton onClick={onStart}>
          <span className="flex items-center justify-center gap-2">
            {t("cta")} <span className="text-lg">›</span>
          </span>
        </AccentButton>
        <p className="mt-4 text-center text-[10px] tracking-wide text-neutral-400">{t("poweredBy")}</p>
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
      <Header left={<LanguageMenu variant="menu" />} />
      <div className="px-6 pt-4">
        <h2 className="inline-block border-b-2 border-[var(--color-accent)] pb-1 text-lg font-bold uppercase tracking-wide text-neutral-900">
          {t("heading")}
        </h2>
      </div>

      <div
        className="mt-4 flex-1 cursor-pointer select-none"
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
        <div className="relative mx-6 aspect-[4/3] overflow-hidden rounded-2xl bg-neutral-100">
          <Image
            src={STORY_IMAGES[index % STORY_IMAGES.length]}
            alt={slide.title}
            fill
            sizes="(max-width: 448px) 100vw, 448px"
            className="object-cover"
          />
        </div>
        <div className="px-6 pt-6">
          <h3 className="text-2xl font-bold">{slide.title}</h3>
          <p className="mt-3 text-sm leading-relaxed text-neutral-600">{slide.body}</p>
        </div>
      </div>

      <div className="flex justify-center gap-2 py-7">
        {slides.map((s, i) => (
          <button
            key={s.title}
            type="button"
            aria-label={`Slide ${i + 1}`}
            onClick={(e) => {
              e.stopPropagation();
              setIndex(i);
            }}
            className={`h-2 rounded-full transition-all ${i === index ? "w-6 bg-[var(--color-accent)]" : "w-2 bg-neutral-300"}`}
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
      <Header left={<BackButton onClick={onBack} />} />
      <div className="px-6 pt-4">
        <h1 className="text-2xl font-bold uppercase tracking-wide">{t("heading")}</h1>
        <p className="mt-2 max-w-xs text-sm text-neutral-500">{t("intro")}</p>
      </div>

      <div className="mx-6 mt-6 rounded-2xl border border-neutral-100 p-6 shadow-[0_2px_16px_rgba(0,0,0,0.06)]">
        <div className="text-center">
          <p className="text-5xl font-bold text-neutral-900">¥{amount.toLocaleString()}</p>
          <p className="mt-1 text-xs text-neutral-400">{t("amountLabel")}</p>
        </div>
        <hr className="my-5 border-neutral-200" />
        <div className="flex items-center justify-between">
          <button
            type="button"
            aria-label="decrease"
            disabled={amount <= 0}
            onClick={() => setAmount((prev) => Math.max(0, prev - TIP_STEP))}
            className="flex h-12 w-12 items-center justify-center rounded-full border border-neutral-300 text-3xl leading-none text-neutral-500 disabled:opacity-30"
          >
            −
          </button>
          <span className="text-2xl font-semibold">{amount.toLocaleString()}</span>
          <button
            type="button"
            onClick={() => setAmount((prev) => prev + TIP_STEP)}
            className="rounded-full bg-[var(--color-accent)] px-5 py-3 text-sm font-bold text-white"
          >
            +¥{TIP_STEP}
          </button>
        </div>
      </div>
      <div className="mt-4 text-center text-xs leading-relaxed text-neutral-400">
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
        <p className="mt-4 text-center text-xs text-neutral-400">🔒 {t("secure")}</p>
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
  onDone: () => void;
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
      if (redirectUrl) {
        window.location.href = redirectUrl;
        return;
      }
      onDone();
    } catch {
      setError(t("errorGeneric"));
      setIsSubmitting(false);
    }
  }

  return (
    <div className="flex flex-1 flex-col pb-8">
      <Header left={<BackButton onClick={onBack} />} />
      <div className="px-6 pt-4">
        <h1 className="text-2xl font-bold uppercase tracking-wide">{t("heading")}</h1>
        <p className="mt-2 text-sm text-neutral-500">{t("question")}</p>

        <div className="mt-4 flex gap-2" onMouseLeave={() => setHover(0)}>
          {[1, 2, 3, 4, 5].map((star) => {
            const active = star <= (hover || rating);
            return (
              <button
                key={star}
                type="button"
                aria-label={`${star} star`}
                onClick={() => setRating(star)}
                onMouseEnter={() => setHover(star)}
                className="text-4xl leading-none text-[var(--color-accent)]"
              >
                {active ? "★" : "☆"}
              </button>
            );
          })}
        </div>

        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder={`${t("commentLabel")} ${t("commentOptional")}`}
          rows={4}
          className="mt-6 w-full rounded-xl border border-neutral-300 p-3 text-sm"
        />

        <p className="mt-5 text-sm font-medium text-neutral-700">{t("photoLabel")}</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {photoUrls.map((url) => (
            <div key={url} className="relative h-16 w-16 overflow-hidden rounded-lg bg-neutral-100">
              <Image src={url} alt="review" fill sizes="64px" className="object-cover" />
            </div>
          ))}
          <label className="flex h-16 w-16 cursor-pointer items-center justify-center rounded-lg border border-neutral-300 text-2xl text-neutral-400">
            {uploading ? "…" : "📷"}
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
        <p className="mt-3 text-center text-xs text-neutral-400">{t("helper")}</p>
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
        <div className="mb-2 flex items-end gap-1.5 text-[var(--color-accent)]">
          <span className="h-3 w-0.5 -rotate-[25deg] rounded bg-current" />
          <span className="h-4 w-0.5 rounded bg-current" />
          <span className="h-3 w-0.5 rotate-[25deg] rounded bg-current" />
        </div>
        <span className="flex h-24 w-24 items-center justify-center rounded-full bg-[var(--color-accent)] text-5xl text-white">
          ♥
        </span>
        <h1 className="mt-6 text-3xl font-bold">{t("title")}</h1>
        <p className="mt-4 max-w-[15rem] text-sm leading-relaxed text-neutral-500">{t("subtitle")}</p>

        <div className="mt-10 w-full max-w-xs">
          <button
            type="button"
            onClick={onHome}
            className="w-full rounded-xl border border-[var(--color-accent)] py-4 text-center font-semibold text-[var(--color-accent)]"
          >
            {t("backToTop")}
          </button>
          <button type="button" onClick={onReviews} className="mt-5 text-sm font-semibold text-[var(--color-accent)]">
            {t("viewReviews")} ›
          </button>
        </div>
      </div>
    </div>
  );
}

/* ---------- Screen 6: Stay Connected ---------- */

function Connect({
  store,
  onBack,
  onHome,
  onStory,
  onReviews,
  onSupport,
}: {
  store: GuestStore;
  onBack: () => void;
  onHome: () => void;
  onStory: () => void;
  onReviews: () => void;
  onSupport: () => void;
}) {
  const t = useTranslations("connect");
  const links = [
    store.instagramUrl
      ? { key: "instagram", label: t("instagram"), href: store.instagramUrl, icon: <InstagramIcon /> }
      : null,
    store.facebookUrl ? { key: "facebook", label: t("facebook"), href: store.facebookUrl, icon: <FacebookIcon /> } : null,
    store.googlePlaceId
      ? { key: "google", label: t("google"), href: googleMapsUrl(store.googlePlaceId), icon: <GoogleIcon /> }
      : null,
  ].filter(Boolean) as { key: string; label: string; href: string; icon: ReactNode }[];

  return (
    <div className="flex flex-1 flex-col pb-20">
      <Header left={<BackButton onClick={onBack} />} />
      <div className="px-6 pt-4">
        <h1 className="text-2xl font-bold uppercase tracking-wide">{t("heading")}</h1>
        <p className="mt-2 text-sm text-neutral-500">{t("subtitle")}</p>

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
                className="flex items-center justify-between rounded-xl border border-neutral-200 px-4 py-3.5 text-sm font-medium hover:bg-neutral-50"
              >
                <span className="flex items-center gap-3">
                  {link.icon}
                  {link.label}
                </span>
                <span className="text-neutral-300">›</span>
              </a>
            ))
          )}
        </div>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-2 px-6">
        <div className="relative aspect-square overflow-hidden rounded-xl bg-neutral-100">
          <Image src={STORY_IMAGES[0]} alt={store.name} fill sizes="224px" className="object-cover" />
        </div>
        <div className="relative aspect-square overflow-hidden rounded-xl bg-neutral-100">
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
  const items: { key: "home" | "story" | "reviews" | "support"; label: string; icon: string; go: () => void }[] = [
    { key: "home", label: t("home"), icon: "⌂", go: onHome },
    { key: "story", label: t("story"), icon: "▤", go: onStory },
    { key: "reviews", label: t("reviews"), icon: "☆", go: onReviews },
    { key: "support", label: t("support"), icon: "♡", go: onSupport },
  ];
  return (
    <nav className="fixed inset-x-0 bottom-0 mx-auto flex max-w-md items-center justify-around border-t border-neutral-200 bg-white py-2">
      {items.map((item) => (
        <button
          key={item.key}
          type="button"
          onClick={item.go}
          className={`flex flex-1 flex-col items-center gap-0.5 py-1 text-[10px] ${
            item.key === active ? "text-[var(--color-accent)]" : "text-neutral-400"
          }`}
        >
          <span className="text-base leading-none">{item.icon}</span>
          {item.label}
        </button>
      ))}
    </nav>
  );
}
