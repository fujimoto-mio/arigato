"use client";

import { ArrowDown, ArrowUp, GripVertical, ImagePlus, Plus, Trash2 } from "lucide-react";

export type StorySlideDraft = { title: string; body: string; imageUrl: string | null };

// A slide being edited: the persisted `imageUrl` plus a locally-picked `file`
// that isn't uploaded until save, with `previewUrl` (object URL) to show it.
export type StorySlideState = StorySlideDraft & { file: File | null; previewUrl: string | null };

export const EMPTY_STORY_SLIDE: StorySlideState = { title: "", body: "", imageUrl: null, file: null, previewUrl: null };
export const MAX_STORY_SLIDES = 8;

export function toStorySlideState(draft: StorySlideDraft): StorySlideState {
  return { ...draft, file: null, previewUrl: null };
}

/** Upload one image for a store and return its public URL. */
export async function uploadStoreImage(storeId: string, file: File): Promise<string> {
  const form = new FormData();
  form.append("file", file);
  form.append("storeId", storeId);
  const res = await fetch("/api/admin/upload", { method: "POST", body: form });
  if (!res.ok) throw new Error("upload_failed");
  const { url } = (await res.json()) as { url: string };
  return url;
}

/**
 * Upload any newly-picked slide photos for the given store, then return the
 * cleaned slide list (fully-empty slides dropped). Throws if an upload fails.
 */
export async function uploadStorySlides(
  storeId: string,
  slides: StorySlideState[],
): Promise<StorySlideDraft[]> {
  const resolved: StorySlideDraft[] = [];
  for (const slide of slides) {
    let imageUrl = slide.imageUrl;
    if (slide.file) {
      imageUrl = await uploadStoreImage(storeId, slide.file);
      if (slide.previewUrl) URL.revokeObjectURL(slide.previewUrl);
    }
    resolved.push({ title: slide.title.trim(), body: slide.body.trim(), imageUrl });
  }
  return resolved.filter((slide) => slide.title || slide.body || slide.imageUrl);
}

/**
 * Controlled editor for the "Our Story" slides — title, body, and an optional
 * photo per slide, in display order. Picking a photo only previews it locally;
 * the parent uploads on save (see uploadStorySlides). Used by both the store
 * editor and the new-store page.
 */
export function StorySlidesField({
  slides,
  onChange,
}: {
  slides: StorySlideState[];
  onChange: (slides: StorySlideState[]) => void;
}) {
  function update(index: number, patch: Partial<StorySlideState>) {
    onChange(slides.map((slide, i) => (i === index ? { ...slide, ...patch } : slide)));
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
                {/* Image */}
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

                {/* Text */}
                <div className="flex min-w-0 flex-1 flex-col gap-3">
                  <label className="block text-sm font-medium text-neutral-700">
                    タイトル
                    <input
                      value={slide.title}
                      onChange={(event) => update(index, { title: event.target.value })}
                      maxLength={120}
                      placeholder="例：おもてなしの心"
                      className="mt-1 w-full rounded-lg border border-neutral-300 p-2.5 text-sm"
                    />
                  </label>
                  <label className="block text-sm font-medium text-neutral-700">
                    本文
                    <textarea
                      value={slide.body}
                      onChange={(event) => update(index, { body: event.target.value })}
                      maxLength={2000}
                      rows={4}
                      placeholder="お店の想いやこだわりをお書きください。"
                      className="mt-1 w-full resize-y rounded-lg border border-neutral-300 p-2.5 text-sm leading-relaxed"
                    />
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
