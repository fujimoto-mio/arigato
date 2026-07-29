"use client";

import { Eye, ImagePlus } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";
import { StoreQrCard } from "@/components/admin/StoreQrCard";
import { StoryPreview } from "@/components/admin/StoryPreview";
import {
  EMPTY_STORY_SLIDE,
  type StorySlideState,
  StorySlidesField,
  uploadStoreImage,
  uploadStorySlides,
} from "@/components/admin/StorySlidesField";
import { DEFAULT_LOCALE, type Locale } from "@/i18n/messages";
import { storeTipUrl } from "@/lib/qr";
import { hasAnyText } from "@/lib/story";

/** Store name → URL-safe slug: lowercase, non-alphanumerics become hyphens. */
function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * New-store page. Mirrors the edit page — store info, intro image, live QR, and
 * story — but nothing is saved until 作成: the store is created, its images
 * uploaded, and its story written, then its editor opens. (Deleting a store is
 * the only edit action that has no meaning before it exists.)
 */
export function StoreCreateForm({ origin }: { origin: string }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugEdited, setSlugEdited] = useState(false);
  const [googlePlaceId, setGooglePlaceId] = useState("");
  const [instagramUrl, setInstagramUrl] = useState("");
  const [facebookUrl, setFacebookUrl] = useState("");
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [slides, setSlides] = useState<StorySlideState[]>([{ ...EMPTY_STORY_SLIDE }]);
  const [storyLocale, setStoryLocale] = useState<Locale>(DEFAULT_LOCALE);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);

  function selectCover(file: File) {
    if (coverPreview) URL.revokeObjectURL(coverPreview);
    setCoverFile(file);
    setCoverPreview(URL.createObjectURL(file));
  }

  function clearCover() {
    if (coverPreview) URL.revokeObjectURL(coverPreview);
    setCoverFile(null);
    setCoverPreview(null);
  }

  async function handleCreate(event: FormEvent) {
    event.preventDefault();

    // Validate the story before creating anything, so a half-filled slide doesn't
    // leave a store behind.
    const storyToSave = slides.filter((s) => hasAnyText(s.title) || hasAnyText(s.body) || s.file || s.imageUrl);
    if (storyToSave.some((s) => !hasAnyText(s.title))) {
      setError("ストーリーの各スライドに、いずれかの言語でタイトルを入力してください。");
      return;
    }

    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/stores", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          slug: slug.trim(),
          googlePlaceId: googlePlaceId.trim(),
          instagramUrl: instagramUrl.trim(),
          facebookUrl: facebookUrl.trim(),
        }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as { error?: string } | null;
        if (body?.error === "slug_taken") throw new Error("この店舗URLは既に使われています。別のURLを入力してください。");
        if (body?.error === "invalid_slug")
          throw new Error("店舗URLは半角の英小文字・数字・ハイフンのみ使用できます（例：sushi-hana）。");
        throw new Error("店舗を作成できませんでした。もう一度お試しください。");
      }
      const { store } = (await res.json()) as { store: { id: string } };

      // Upload the intro image (if picked) and attach it.
      if (coverFile) {
        const url = await uploadStoreImage(store.id, coverFile);
        await fetch(`/api/admin/stores/${store.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ coverImageUrl: url }),
        });
      }

      // Upload story photos and save the slides.
      const cleaned = await uploadStorySlides(store.id, slides);
      if (cleaned.length > 0) {
        await fetch("/api/admin/story", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ storeId: store.id, slides: cleaned }),
        });
      }

      router.push(`/admin/stores/${store.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "作成できませんでした。");
      setBusy(false);
    }
  }

  const previewSlides = slides.map((s) => ({
    title: s.title,
    body: s.body,
    imageUrl: s.previewUrl ?? s.imageUrl,
  }));

  return (
    <form onSubmit={handleCreate} className="flex flex-col gap-6">
      {/* Store info + QR */}
      <section className="rounded-2xl border border-neutral-200 bg-white p-5 sm:p-6">
        <h2 className="text-lg font-bold">店舗情報</h2>
        <p className="mb-4 text-sm text-neutral-500">お客様の画面に表示されます。</p>

        <div className="flex flex-col gap-6 lg:flex-row lg:gap-8">
          <div className="flex min-w-0 flex-col gap-5 lg:flex-[7]">
            <label className="block text-sm font-medium text-neutral-700">
              店舗名
              <input
                value={name}
                onChange={(event) => {
                  const next = event.target.value;
                  setName(next);
                  if (!slugEdited) {
                    const derived = slugify(next);
                    if (derived) setSlug(derived);
                  }
                }}
                required
                maxLength={80}
                placeholder="例：寿司はな"
                className="mt-1 w-full rounded-lg border border-neutral-300 p-3 text-sm"
              />
            </label>

            <label className="block text-sm font-medium text-neutral-700">
              店舗URL（slug）
              <div className="mt-1 flex items-center overflow-hidden rounded-lg border border-neutral-300">
                <span className="shrink-0 border-r border-neutral-200 bg-neutral-50 px-3 py-3 font-mono text-xs text-neutral-400">
                  /s/
                </span>
                <input
                  value={slug}
                  onChange={(event) => {
                    setSlugEdited(true);
                    setSlug(event.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""));
                  }}
                  required
                  maxLength={50}
                  placeholder="sushi-hana"
                  className="w-full px-3 py-3 font-mono text-sm outline-none"
                />
              </div>
              <span className="mt-1 block text-xs font-normal text-neutral-500">
                お客様のQRコードのURLになります。半角英小文字・数字・ハイフンのみ。
              </span>
            </label>

            <label className="block text-sm font-medium text-neutral-700">
              Google Place ID
              <input
                value={googlePlaceId}
                onChange={(event) => setGooglePlaceId(event.target.value)}
                placeholder="ChIJ..."
                className="mt-1 w-full rounded-lg border border-neutral-300 p-3 font-mono text-sm"
              />
            </label>

            <label className="block text-sm font-medium text-neutral-700">
              Instagram URL
              <input
                value={instagramUrl}
                onChange={(event) => setInstagramUrl(event.target.value)}
                placeholder="https://instagram.com/yourstore"
                className="mt-1 w-full rounded-lg border border-neutral-300 p-3 text-sm"
              />
            </label>

            <label className="block text-sm font-medium text-neutral-700">
              Facebook URL
              <input
                value={facebookUrl}
                onChange={(event) => setFacebookUrl(event.target.value)}
                placeholder="https://facebook.com/yourstore"
                className="mt-1 w-full rounded-lg border border-neutral-300 p-3 text-sm"
              />
            </label>

            <div className="text-sm font-medium text-neutral-700">
              紹介画像
              <p className="mt-0.5 text-xs font-normal text-neutral-500">
                お客様のQR画面のトップに大きく表示されます（横4：縦3）。未設定の場合はストーリー1枚目の画像が使われます。
              </p>
              <div className="mt-2 max-w-xs">
                <div className="relative aspect-[4/3] w-full overflow-hidden rounded-xl bg-neutral-100">
                  {coverPreview ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={coverPreview} alt="紹介画像" className="absolute inset-0 h-full w-full object-cover" />
                  ) : (
                    <span className="flex h-full w-full items-center justify-center text-neutral-300">
                      <ImagePlus className="h-8 w-8" strokeWidth={1.5} />
                    </span>
                  )}
                </div>
                <div className="mt-2 flex items-center gap-3">
                  <label className="cursor-pointer rounded-full border border-neutral-300 px-4 py-2 text-xs font-medium hover:bg-neutral-100">
                    {coverPreview ? "画像を変更" : "アップロード"}
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      className="sr-only"
                      onChange={(event) => {
                        const file = event.target.files?.[0];
                        if (file) selectCover(file);
                        event.target.value = "";
                      }}
                    />
                  </label>
                  {coverPreview ? (
                    <button
                      type="button"
                      onClick={clearCover}
                      className="text-xs font-medium text-neutral-400 hover:text-red-500"
                    >
                      削除
                    </button>
                  ) : null}
                </div>
                {coverFile ? <p className="mt-1 text-[11px] text-neutral-400">保存時にアップロードされます</p> : null}
              </div>
            </div>
          </div>

          {/* QR — generated live from the slug you type. */}
          <div className="border-t border-neutral-200 pt-6 lg:min-w-0 lg:flex-[5] lg:border-l lg:border-t-0 lg:pl-8 lg:pt-0">
            <h3 className="text-base font-bold">店舗QRコード</h3>
            <p className="mb-4 text-sm text-neutral-500">
              印刷して店内に置いてください。読み取るとお客様のチップ画面が開きます。
            </p>
            <StoreQrCard
              storeName={name.trim() || "店舗名"}
              tipUrl={storeTipUrl(origin, slug || "")}
              downloadName={`arigato-qr-${slug || "store"}.png`}
              loading={busy}
            />
          </div>
        </div>
      </section>

      {/* Story */}
      <section className="rounded-2xl border border-neutral-200 bg-white p-5 sm:p-6">
        <h2 className="text-lg font-bold">ストーリー</h2>
        <p className="mb-5 text-sm text-neutral-500">
          QRコードから開くお客様の画面に表示される「Our Story」です。未設定の場合は標準のストーリーが表示されます。
        </p>
        <StorySlidesField
          slides={slides}
          onChange={setSlides}
          activeLocale={storyLocale}
          onLocaleChange={setStoryLocale}
        />
        <button
          type="button"
          onClick={() => setPreviewOpen(true)}
          className="mt-5 flex w-full items-center justify-center gap-2 rounded-full border border-neutral-300 px-6 py-3 text-sm font-semibold text-neutral-700 transition hover:bg-neutral-100 sm:w-auto"
        >
          <Eye className="h-4 w-4" />
          プレビュー
        </button>
      </section>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="submit"
          disabled={busy || !name.trim() || !slug.trim()}
          className="rounded-full bg-neutral-900 px-6 py-3 text-sm font-semibold text-white disabled:opacity-40"
        >
          {busy ? "作成中…" : "作成して開く"}
        </button>
        <Link
          href="/admin/stores"
          className="rounded-full px-4 py-3 text-sm font-medium text-neutral-500 hover:text-neutral-800"
        >
          キャンセル
        </Link>
      </div>

      <StoryPreview
        open={previewOpen}
        slides={previewSlides}
        storeName={name.trim() || "店舗"}
        coverImageUrl={coverPreview}
        initialLocale={storyLocale}
        onClose={() => setPreviewOpen(false)}
      />
    </form>
  );
}
