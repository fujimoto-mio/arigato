"use client";

import { useFormik } from "formik";
import { Eye } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import * as Yup from "yup";
import { PhonePreviewModal } from "@/components/admin/PhonePreviewModal";
import { PreviewIframe } from "@/components/admin/PreviewIframe";
import {
  EMPTY_STORY_SLIDE,
  type SlideError,
  type StorySlideDraft,
  type StorySlideState,
  StorySlidesField,
  toStorySlideState,
  uploadStorySlides,
} from "@/components/admin/StorySlidesField";
import { DEFAULT_LOCALE, type Locale } from "@/i18n/messages";
import { hasAnyText, type LocaleText } from "@/lib/story";

export type { StorySlideDraft };

const schema = Yup.object({
  slides: Yup.array().of(
    Yup.object({
      title: Yup.mixed().test("title", "タイトルを入力してください", (v) => hasAnyText(v as LocaleText)),
      body: Yup.mixed().test("body", "本文を入力してください", (v) => hasAnyText(v as LocaleText)),
    }),
  ),
});

/**
 * Per-store, multi-language "Our Story" editor (Formik + Yup). Each slide must
 * have a title and body (in at least one language); a photo is optional. Titles/
 * bodies are entered per language; photos preview locally and upload on save.
 */
export function StoryEditor({
  storeId,
  slug,
  initialSlides,
}: {
  storeId: string;
  slug: string;
  initialSlides: StorySlideDraft[];
}) {
  const router = useRouter();
  const [locale, setLocale] = useState<Locale>(DEFAULT_LOCALE);
  const [status, setStatus] = useState<"idle" | "saving" | "saved">("idle");
  const [error, setError] = useState<string | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);

  const formik = useFormik<{ slides: StorySlideState[] }>({
    initialValues: {
      slides: initialSlides.length > 0 ? initialSlides.map(toStorySlideState) : [{ ...EMPTY_STORY_SLIDE }],
    },
    validationSchema: schema,
    onSubmit: async (values, { setFieldValue, setSubmitting }) => {
      setStatus("saving");
      setError(null);
      try {
        const cleaned = await uploadStorySlides(storeId, values.slides);
        const res = await fetch("/api/admin/story", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ storeId, slides: cleaned }),
        });
        if (!res.ok) throw new Error("save_failed");
        void setFieldValue(
          "slides",
          cleaned.length > 0 ? cleaned.map(toStorySlideState) : [{ ...EMPTY_STORY_SLIDE }],
        );
        setStatus("saved");
        router.refresh();
        setTimeout(() => setStatus("idle"), 2000);
      } catch {
        setError("保存できませんでした。もう一度お試しください。");
        setStatus("idle");
      } finally {
        setSubmitting(false);
      }
    },
  });

  const slides = formik.values.slides;
  // Show per-slide errors only after a save attempt.
  const slideErrors =
    formik.submitCount > 0 ? (formik.errors.slides as (SlideError | undefined)[] | undefined) : undefined;

  return (
    <form onSubmit={formik.handleSubmit} noValidate className="flex flex-col gap-5">
      <StorySlidesField
        slides={slides}
        onChange={(next) => void formik.setFieldValue("slides", next)}
        activeLocale={locale}
        onLocaleChange={setLocale}
        errors={slideErrors}
      />

      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="submit"
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
      <p className="text-xs text-neutral-400">※ プレビューは保存後の内容が表示されます。</p>

      {/* Live preview of the actual guest page (保存後の内容). */}
      <PhonePreviewModal
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        ariaLabel="お客様用ページのプレビュー"
      >
        <PreviewIframe src={`/s/${slug}`} title="お客様用ページのプレビュー" />
      </PhonePreviewModal>
    </form>
  );
}
