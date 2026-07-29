"use client";

import { X } from "lucide-react";
import { useEffect } from "react";
import { LogoBadge, Wordmark } from "@/components/flow/brand";
import type { StorySlideDraft } from "@/components/admin/StorySlidesField";

// Same stock fallbacks the guest landing uses when a slide has no photo, so the
// preview matches what customers actually see.
const STORY_IMAGES = ["/lp/izakaya-interior.jpg", "/lp/restaurant-lanterns.jpg", "/lp/phone-payment.jpg"];

// Default (English) guest copy shown on the QR landing's first screen.
const TAGLINE = "Discover the story behind our restaurant.";
const TAKE_A_LOOK = "Take a look!";

/**
 * Phone-framed preview of the store's QR landing first screen as guests see it:
 * the hero, cover, and the "Our Story" slides. Renders the current (unsaved)
 * draft — including locally-picked photos — so edits show live.
 */
export function StoryPreview({
  open,
  slides,
  storeName,
  coverImageUrl,
  onClose,
}: {
  open: boolean;
  slides: StorySlideDraft[];
  storeName: string;
  coverImageUrl: string | null;
  onClose: () => void;
}) {
  useEffect(() => {
    if (!open) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const filled = slides
    .map((slide) => ({ title: slide.title.trim(), body: slide.body.trim(), imageUrl: slide.imageUrl }))
    .filter((slide) => slide.title || slide.body || slide.imageUrl);
  const coverImage = coverImageUrl ?? filled[0]?.imageUrl ?? STORY_IMAGES[0];

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4"
      role="dialog"
      aria-modal="true"
      aria-label="ストーリーのプレビュー"
      onClick={onClose}
    >
      <div
        className="relative flex max-h-[90vh] w-full max-w-[26rem] flex-col overflow-hidden rounded-[2.2rem] border-[6px] border-neutral-900 bg-white shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="閉じる"
          className="absolute right-3 top-3 z-20 flex h-9 w-9 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur transition hover:bg-black/70"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="overflow-y-auto pb-2">
          {/* Header (logo only; the live page also has a language switcher) */}
          <header className="flex items-start justify-between px-5 pt-5">
            <span className="min-h-9" />
            <LogoBadge />
          </header>

          {/* Hero */}
          <div className="px-8 pt-6 text-center">
            <Wordmark className="text-[52px] leading-none tracking-tight" />
            <p className="mx-auto mt-6 max-w-[16rem] text-[13px] font-semibold uppercase leading-relaxed tracking-[0.18em] text-neutral-700">
              {TAGLINE}
            </p>
            <p className="mt-3 text-[13px] font-semibold uppercase tracking-[0.22em] text-[var(--color-accent)]">
              {TAKE_A_LOOK}
            </p>
          </div>

          {/* Cover */}
          <div className="relative mt-8 aspect-[4/3] overflow-hidden bg-neutral-100">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={coverImage} alt={storeName} className="absolute inset-0 h-full w-full object-cover" />
            <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/25 to-transparent" />
          </div>

          {/* Scroll hint */}
          <div className="flex justify-center pt-6 text-[var(--color-accent)]">
            <svg
              viewBox="0 0 24 24"
              className="h-6 w-6 animate-bounce"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M6 9l6 6 6-6" />
            </svg>
          </div>

          {/* Our Story heading */}
          <div className="px-8 pt-6 text-center">
            <h2 className="text-2xl font-bold uppercase tracking-[0.12em] text-neutral-900">Our Story</h2>
            <div className="mx-auto mt-3 h-1 w-10 rounded-full bg-[var(--color-accent)]" />
          </div>

          {filled.length === 0 ? (
            <div className="px-8 py-12 text-center text-sm text-neutral-400">
              スライドが未設定です。お客様には標準のストーリーが表示されます。
            </div>
          ) : (
            <div className="mt-9 flex flex-col gap-14">
              {filled.map((slide, i) => (
                <section key={i} className="px-6">
                  <div className="relative aspect-[4/3] overflow-hidden rounded-3xl bg-neutral-100 shadow-[0_12px_34px_rgba(0,0,0,0.09)]">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={slide.imageUrl ?? STORY_IMAGES[(i + 1) % STORY_IMAGES.length]}
                      alt={slide.title || `スライド ${i + 1}`}
                      className="absolute inset-0 h-full w-full object-cover"
                    />
                    <span className="absolute left-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-sm font-bold text-[var(--color-accent)] shadow-md backdrop-blur">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                  </div>
                  <div className="px-1 pt-6 text-center">
                    <h3 className="text-[26px] font-bold leading-tight text-neutral-900">
                      {slide.title || "（タイトル未入力）"}
                    </h3>
                    <p className="mx-auto mt-3 max-w-[21rem] whitespace-pre-line text-[15px] leading-loose text-neutral-500">
                      {slide.body || "（本文未入力）"}
                    </p>
                  </div>
                </section>
              ))}
            </div>
          )}

          {/* Closing + Next (the live page's tip button) */}
          <div className="mt-16 px-6">
            <div className="mx-auto mb-9 h-px w-16 bg-neutral-200" />
            <div className="w-full rounded-2xl bg-[var(--color-accent)] py-4 text-center font-bold text-white">
              <span className="flex items-center justify-center gap-2">
                Next <span className="text-lg">›</span>
              </span>
            </div>
            <p className="mt-4 text-center text-xs tracking-wide text-neutral-400">
              Powered by <span className="font-bold text-neutral-600">ARIGATO TiP</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
