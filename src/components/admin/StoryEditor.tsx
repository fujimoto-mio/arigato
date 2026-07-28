"use client";

import { ArrowDown, ArrowUp, GripVertical, ImagePlus, Plus, Trash2 } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";

export type StorySlideDraft = { title: string; body: string; imageUrl: string | null };

/** Blank slide seeded when the store has no story yet, so the editor is usable. */
const EMPTY_SLIDE: StorySlideDraft = { title: "", body: "", imageUrl: null };
const MAX_SLIDES = 8;

/**
 * Per-store "Our Story" editor. Edits the slides guests read on the QR landing:
 * a title, a paragraph, and an optional photo per slide, in display order. Saves
 * the whole list at once (replace-all) to `/api/admin/story` for the store the
 * top-bar switcher has selected.
 */
export function StoryEditor({
  storeId,
  initialSlides,
}: {
  storeId: string;
  initialSlides: StorySlideDraft[];
}) {
  const router = useRouter();
  const [slides, setSlides] = useState<StorySlideDraft[]>(
    initialSlides.length > 0 ? initialSlides : [EMPTY_SLIDE],
  );
  const [status, setStatus] = useState<"idle" | "saving" | "saved">("idle");
  const [error, setError] = useState<string | null>(null);
  const [uploadingIndex, setUploadingIndex] = useState<number | null>(null);

  function update(index: number, patch: Partial<StorySlideDraft>) {
    setSlides((prev) => prev.map((slide, i) => (i === index ? { ...slide, ...patch } : slide)));
  }

  function addSlide() {
    setSlides((prev) => (prev.length >= MAX_SLIDES ? prev : [...prev, { ...EMPTY_SLIDE }]));
  }

  function removeSlide(index: number) {
    setSlides((prev) => prev.filter((_, i) => i !== index));
  }

  function move(index: number, direction: -1 | 1) {
    setSlides((prev) => {
      const next = [...prev];
      const target = index + direction;
      if (target < 0 || target >= next.length) return prev;
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }

  async function uploadImage(index: number, file: File) {
    setUploadingIndex(index);
    setError(null);
    try {
      const form = new FormData();
      form.append("file", file);
      form.append("storeId", storeId);
      const res = await fetch("/api/admin/upload", { method: "POST", body: form });
      if (!res.ok) throw new Error("upload_failed");
      const { url } = (await res.json()) as { url: string };
      update(index, { imageUrl: url });
    } catch {
      setError("画像をアップロードできませんでした。もう一度お試しください。");
    } finally {
      setUploadingIndex(null);
    }
  }

  async function save() {
    // Drop fully-empty trailing slides so an accidental blank card isn't saved.
    const cleaned = slides
      .map((slide) => ({ ...slide, title: slide.title.trim(), body: slide.body.trim() }))
      .filter((slide) => slide.title || slide.body || slide.imageUrl);

    if (cleaned.some((slide) => !slide.title || !slide.body)) {
      setError("各スライドにタイトルと本文を入力してください。");
      return;
    }

    setStatus("saving");
    setError(null);
    try {
      const res = await fetch("/api/admin/story", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ storeId, slides: cleaned }),
      });
      if (!res.ok) throw new Error("save_failed");
      setSlides(cleaned.length > 0 ? cleaned : [{ ...EMPTY_SLIDE }]);
      setStatus("saved");
      router.refresh();
      setTimeout(() => setStatus("idle"), 2000);
    } catch {
      setError("保存できませんでした。もう一度お試しください。");
      setStatus("idle");
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-5">
        {slides.map((slide, index) => (
          <div
            key={index}
            className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm sm:p-5"
          >
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
                  {slide.imageUrl ? (
                    <Image src={slide.imageUrl} alt="" fill sizes="160px" className="object-cover" />
                  ) : (
                    <span className="flex h-full w-full items-center justify-center text-neutral-300">
                      <ImagePlus className="h-8 w-8" strokeWidth={1.5} />
                    </span>
                  )}
                </div>
                <label className="mt-2 flex cursor-pointer items-center justify-center gap-1.5 rounded-full border border-neutral-300 px-3 py-2 text-xs font-medium hover:bg-neutral-100">
                  {uploadingIndex === index ? "アップロード中…" : slide.imageUrl ? "画像を変更" : "画像を追加"}
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="sr-only"
                    disabled={uploadingIndex !== null}
                    onChange={(event) => {
                      const file = event.target.files?.[0];
                      if (file) void uploadImage(index, file);
                      event.target.value = "";
                    }}
                  />
                </label>
                {slide.imageUrl ? (
                  <button
                    type="button"
                    onClick={() => update(index, { imageUrl: null })}
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
        ))}
      </div>

      {slides.length < MAX_SLIDES ? (
        <button
          type="button"
          onClick={addSlide}
          className="flex items-center justify-center gap-2 rounded-2xl border border-dashed border-neutral-300 py-3 text-sm font-medium text-neutral-500 transition hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]"
        >
          <Plus className="h-4 w-4" />
          スライドを追加
        </button>
      ) : (
        <p className="text-center text-xs text-neutral-400">スライドは最大 {MAX_SLIDES} 枚までです。</p>
      )}

      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={save}
          disabled={status === "saving"}
          className="w-full rounded-full bg-neutral-900 px-6 py-3 text-sm font-semibold text-white disabled:opacity-40 sm:w-auto"
        >
          {status === "saving" ? "保存中…" : "保存"}
        </button>
        {status === "saved" ? <span className="text-sm text-green-600">保存しました</span> : null}
      </div>
    </div>
  );
}
