"use client";

import { Eye } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { StoryPreview } from "@/components/admin/StoryPreview";
import {
  EMPTY_STORY_SLIDE,
  type StorySlideDraft,
  type StorySlideState,
  StorySlidesField,
  toStorySlideState,
  uploadStorySlides,
} from "@/components/admin/StorySlidesField";
import { DEFAULT_LOCALE, type Locale } from "@/i18n/messages";
import { hasAnyText } from "@/lib/story";

export type { StorySlideDraft };

/**
 * Per-store, multi-language "Our Story" editor. Title/body are entered per
 * language; picking a photo previews it locally and uploads on save, when the
 * whole list is written (replace-all) to `/api/admin/story`.
 */
export function StoryEditor({
  storeId,
  storeName,
  coverImageUrl,
  initialSlides,
}: {
  storeId: string;
  storeName: string;
  coverImageUrl: string | null;
  initialSlides: StorySlideDraft[];
}) {
  const router = useRouter();
  const [slides, setSlides] = useState<StorySlideState[]>(
    initialSlides.length > 0 ? initialSlides.map(toStorySlideState) : [{ ...EMPTY_STORY_SLIDE }],
  );
  const [locale, setLocale] = useState<Locale>(DEFAULT_LOCALE);
  const [status, setStatus] = useState<"idle" | "saving" | "saved">("idle");
  const [error, setError] = useState<string | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);

  async function save() {
    setStatus("saving");
    setError(null);
    try {
      const cleaned = await uploadStorySlides(storeId, slides);
      if (cleaned.some((slide) => !hasAnyText(slide.title))) {
        setError("各スライドに、いずれかの言語でタイトルを入力してください。");
        setStatus("idle");
        return;
      }

      const res = await fetch("/api/admin/story", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ storeId, slides: cleaned }),
      });
      if (!res.ok) throw new Error("save_failed");

      setSlides(cleaned.length > 0 ? cleaned.map(toStorySlideState) : [{ ...EMPTY_STORY_SLIDE }]);
      setStatus("saved");
      router.refresh();
      setTimeout(() => setStatus("idle"), 2000);
    } catch {
      setError("保存できませんでした。もう一度お試しください。");
      setStatus("idle");
    }
  }

  // Raw locale maps for the preview (which has its own language switcher), with
  // the locally-picked photo when present.
  const previewSlides = slides.map((slide) => ({
    title: slide.title,
    body: slide.body,
    imageUrl: slide.previewUrl ?? slide.imageUrl,
  }));

  return (
    <div className="flex flex-col gap-5">
      <StorySlidesField slides={slides} onChange={setSlides} activeLocale={locale} onLocaleChange={setLocale} />

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
        <button
          type="button"
          onClick={() => setPreviewOpen(true)}
          className="flex w-full items-center justify-center gap-2 rounded-full border border-neutral-300 px-6 py-3 text-sm font-semibold text-neutral-700 transition hover:bg-neutral-100 sm:w-auto"
        >
          <Eye className="h-4 w-4" />
          プレビュー
        </button>
        {status === "saved" ? <span className="text-sm text-green-600">保存しました</span> : null}
      </div>

      <StoryPreview
        open={previewOpen}
        slides={previewSlides}
        storeName={storeName}
        coverImageUrl={coverImageUrl}
        initialLocale={locale}
        onClose={() => setPreviewOpen(false)}
      />
    </div>
  );
}
