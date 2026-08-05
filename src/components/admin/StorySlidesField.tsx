"use client";

import { ArrowDown, ArrowUp, GripVertical, ImagePlus, Plus, Trash2 } from "lucide-react";
import { LOCALES, type Locale } from "@/i18n/messages";
import { downscaleImage } from "@/lib/image-resize";
import { cleanLocaleText, hasAnyText, type LocaleText, LOCALE_LABELS } from "@/lib/story";

export type StorySlideDraft = { title: LocaleText; body: LocaleText; imageUrl: string | null };

/** Per-slide validation messages (from the parent's Yup schema). */
export type SlideError = { title?: string; body?: string };

// A slide being edited: the persisted values plus a locally-picked `file` that
// isn't uploaded until save, with `previewUrl` (object URL) to show it.
export type StorySlideState = StorySlideDraft & { file: File | null; previewUrl: string | null };

export const EMPTY_STORY_SLIDE: StorySlideState = {
  title: {},
  body: {},
  imageUrl: null,
  file: null,
  previewUrl: null,
};
export const MAX_STORY_SLIDES = 8;

export function toStorySlideState(draft: StorySlideDraft): StorySlideState {
  return { ...draft, file: null, previewUrl: null };
}

/** Upload one image for a store and return its public URL. Downscales first. */
export async function uploadStoreImage(storeId: string, file: File): Promise<string> {
  const optimized = await downscaleImage(file);
  const form = new FormData();
  form.append("file", optimized);
  form.append("storeId", storeId);
  const res = await fetch("/api/admin/upload", { method: "POST", body: form });
  if (!res.ok) throw new Error("upload_failed");
  const { url } = (await res.json()) as { url: string };
  return url;
}

/**
 * Upload any newly-picked slide photos for the given store, then return the
 * cleaned slide list (locales trimmed, fully-empty slides dropped). Uploads run
 * in parallel so multiple new photos don't wait on each other.
 */
export async function uploadStorySlides(
  storeId: string,
  slides: StorySlideState[],
): Promise<StorySlideDraft[]> {
  const uploaded = await Promise.all(
    slides.map((slide) => (slide.file ? uploadStoreImage(storeId, slide.file) : Promise.resolve(null))),
  );

  const resolved: StorySlideDraft[] = [];
  slides.forEach((slide, index) => {
    let imageUrl = slide.imageUrl;
    if (slide.file) {
      imageUrl = uploaded[index];
      if (slide.previewUrl) URL.revokeObjectURL(slide.previewUrl);
    }
    const title = cleanLocaleText(slide.title);
    const body = cleanLocaleText(slide.body);
    if (hasAnyText(title) || hasAnyText(body) || imageUrl) {
      resolved.push({ title, body, imageUrl });
    }
  });
  return resolved;
}

/**
 * Controlled editor for the "Our Story" slides. Each slide has a title, body,
 * and optional photo; title/body are entered per language via the tab bar
 * (empty languages fall back to another on the guest side). Picking a photo only
 * previews it locally; the parent uploads on save (see uploadStorySlides).
 */
export function StorySlidesField({
  slides,
  onChange,
  activeLocale,
  onLocaleChange,
  errors,
}: {
  slides: StorySlideState[];
  onChange: (slides: StorySlideState[]) => void;
  activeLocale: Locale;
  onLocaleChange: (locale: Locale) => void;
  errors?: (SlideError | undefined)[];
}) {
  // Which languages have any content, to hint on the tabs.
  const filled = new Set<Locale>();
  for (const slide of slides) {
    for (const locale of LOCALES) {
      if (slide.title[locale]?.trim() || slide.body[locale]?.trim()) filled.add(locale);
    }
  }

  function setText(index: number, field: "title" | "body", value: string) {
    onChange(
      slides.map((slide, i) =>
        i === index ? { ...slide, [field]: { ...slide[field], [activeLocale]: value } } : slide,
      ),
    );
  }

  function addSlide() {
    if (slides.length >= MAX_STORY_SLIDES) return;
    onChange([...slides, { ...EMPTY_STORY_SLIDE }]);
  }

  function removeSlide(index: number) {
    const gone = slides[index]?.previewUrl;
    if (gone) URL.revokeObjectURL(gone);
    onChange(slides.filter((_, i) => i !== index));
  }

  function move(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= slides.length) return;
    const next = [...slides];
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  }

  function selectImage(index: number, file: File) {
    const previewUrl = URL.createObjectURL(file);
    const old = slides[index]?.previewUrl;
    if (old) URL.revokeObjectURL(old);
    onChange(slides.map((slide, i) => (i === index ? { ...slide, file, previewUrl } : slide)));
  }

  function clearImage(index: number) {
    const old = slides[index]?.previewUrl;
    if (old) URL.revokeObjectURL(old);
    onChange(slides.map((slide, i) => (i === index ? { ...slide, imageUrl: null, file: null, previewUrl: null } : slide)));
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Language tabs */}
      <div>
        <div className="inline-flex flex-wrap gap-1 rounded-full border border-neutral-200 bg-neutral-50 p-1">
          {LOCALES.map((locale) => (
            <button
              key={locale}
              type="button"
              onClick={() => onLocaleChange(locale)}
              className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                activeLocale === locale
                  ? "bg-[var(--color-accent)] text-white"
                  : "text-neutral-500 hover:text-neutral-800"
              }`}
            >
              {LOCALE_LABELS[locale]}
              {filled.has(locale) ? (
                <span
                  className={`h-1.5 w-1.5 rounded-full ${activeLocale === locale ? "bg-white" : "bg-[var(--color-accent)]"}`}
                />
              ) : null}
            </button>
          ))}
        </div>
        <p className="mt-1.5 text-xs text-neutral-400">
          言語ごとに入力できます。未入力の言語は他の言語で表示されます。画像・並び順は全言語で共通です。
        </p>
      </div>

      <div className="flex flex-col gap-5">
        {slides.map((slide, index) => {
          const displayUrl = slide.previewUrl ?? slide.imageUrl;
          return (
            <div key={index} className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm sm:p-5">
              <div className="mb-3 flex items-center justify-between">
                <span className="flex items-center gap-2 text-sm font-bold text-neutral-500">
                  <GripVertical className="h-4 w-4 text-neutral-300" />
                  スライド {index + 1}
                </span>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => move(index, -1)}
                    disabled={index === 0}
                    aria-label="上へ移動"
                    className="rounded-lg p-1.5 text-neutral-500 transition hover:bg-neutral-100 disabled:opacity-30"
                  >
                    <ArrowUp className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => move(index, 1)}
                    disabled={index === slides.length - 1}
                    aria-label="下へ移動"
                    className="rounded-lg p-1.5 text-neutral-500 transition hover:bg-neutral-100 disabled:opacity-30"
                  >
                    <ArrowDown className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => removeSlide(index)}
                    aria-label="削除"
                    className="rounded-lg p-1.5 text-red-500 transition hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="flex flex-col gap-4 sm:flex-row">
                {/* Image (shared across languages) */}
                <div className="sm:w-40 sm:shrink-0">
                  <div className="relative aspect-[4/3] overflow-hidden rounded-xl bg-neutral-100">
                    {displayUrl ? (
                      // Local object URLs and Supabase URLs alike — a plain img avoids
                      // next/image's remote/blob constraints for this small thumbnail.
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={displayUrl} alt="" className="absolute inset-0 h-full w-full object-cover" />
                    ) : (
                      <span className="flex h-full w-full items-center justify-center text-neutral-300">
                        <ImagePlus className="h-8 w-8" strokeWidth={1.5} />
                      </span>
                    )}
                  </div>
                  <label className="mt-2 flex cursor-pointer items-center justify-center gap-1.5 rounded-full border border-neutral-300 px-3 py-2 text-xs font-medium hover:bg-neutral-100">
                    {displayUrl ? "画像を変更" : "画像を追加"}
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      className="sr-only"
                      onChange={(event) => {
                        const file = event.target.files?.[0];
                        if (file) selectImage(index, file);
                        event.target.value = "";
                      }}
                    />
                  </label>
                  {slide.file ? (
                    <p className="mt-1 text-center text-[11px] text-neutral-400">保存時にアップロードされます</p>
                  ) : null}
                  {displayUrl ? (
                    <button
                      type="button"
                      onClick={() => clearImage(index)}
                      className="mt-1 w-full text-center text-[11px] text-neutral-400 hover:text-red-500"
                    >
                      画像を削除
                    </button>
                  ) : null}
                </div>

                {/* Text for the active language */}
                <div className="flex min-w-0 flex-1 flex-col gap-3">
                  <label className="block text-sm font-medium text-neutral-700">
                    タイトル（{LOCALE_LABELS[activeLocale]}）
                    <input
                      value={slide.title[activeLocale] ?? ""}
                      onChange={(event) => setText(index, "title", event.target.value)}
                      maxLength={120}
                      placeholder="例：おもてなしの心"
                      className="mt-1 w-full rounded-lg border border-neutral-300 p-2.5 text-sm"
                    />
                    {errors?.[index]?.title ? (
                      <p className="mt-1 text-xs text-red-600">{errors[index]?.title}</p>
                    ) : null}
                  </label>
                  <label className="block text-sm font-medium text-neutral-700">
                    本文（{LOCALE_LABELS[activeLocale]}）
                    <textarea
                      value={slide.body[activeLocale] ?? ""}
                      onChange={(event) => setText(index, "body", event.target.value)}
                      maxLength={2000}
                      rows={4}
                      placeholder="お店の想いやこだわりをお書きください。"
                      className="mt-1 w-full resize-y rounded-lg border border-neutral-300 p-2.5 text-sm leading-relaxed"
                    />
                    {errors?.[index]?.body ? (
                      <p className="mt-1 text-xs text-red-600">{errors[index]?.body}</p>
                    ) : null}
                  </label>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {slides.length < MAX_STORY_SLIDES ? (
        <button
          type="button"
          onClick={addSlide}
          className="flex items-center justify-center gap-2 rounded-2xl border border-dashed border-neutral-300 py-3 text-sm font-medium text-neutral-500 transition hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]"
        >
          <Plus className="h-4 w-4" />
          スライドを追加
        </button>
      ) : (
        <p className="text-center text-xs text-neutral-400">スライドは最大 {MAX_STORY_SLIDES} 枚までです。</p>
      )}
    </div>
  );
}
