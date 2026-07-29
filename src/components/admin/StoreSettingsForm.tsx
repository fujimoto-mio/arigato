"use client";

import { ImagePlus } from "lucide-react";
import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";
import { ConfirmModal } from "@/components/admin/ConfirmModal";
import { uploadStoreImage } from "@/components/admin/StorySlidesField";

/** Store name → URL-safe slug: lowercase, non-alphanumerics become hyphens. */
function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function StoreSettingsForm({
  storeId,
  initialName,
  initialSlug,
  initialGooglePlaceId,
  initialCoverImageUrl,
  initialInstagramUrl,
  initialFacebookUrl,
  onSavingChange,
  onSaved,
}: {
  storeId: string;
  initialName: string;
  initialSlug: string;
  initialGooglePlaceId: string | null;
  initialCoverImageUrl: string | null;
  initialInstagramUrl: string | null;
  initialFacebookUrl: string | null;
  // Let a parent mirror the save into the QR preview (spinner + new URL).
  onSavingChange?: (saving: boolean) => void;
  onSaved?: (store: { name: string; slug: string; googlePlaceId: string }) => void;
}) {
  const router = useRouter();
  const [name, setName] = useState(initialName);
  const [slug, setSlug] = useState(initialSlug);
  // Baseline slug this form was last saved with — the QR-invalidation warning
  // and the confirm prompt key off a change from this, and it advances on save.
  const [savedSlug, setSavedSlug] = useState(initialSlug);
  // The slug auto-follows the store name until the owner customises it by hand.
  const [slugEdited, setSlugEdited] = useState(false);
  const [googlePlaceId, setGooglePlaceId] = useState(initialGooglePlaceId ?? "");
  const [instagramUrl, setInstagramUrl] = useState(initialInstagramUrl ?? "");
  const [facebookUrl, setFacebookUrl] = useState(initialFacebookUrl ?? "");
  // Intro image: the saved URL, plus a locally-picked file that isn't uploaded
  // until 保存, with an object URL to preview it and a "removed" flag.
  const [savedCover, setSavedCover] = useState(initialCoverImageUrl);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [coverRemoved, setCoverRemoved] = useState(false);
  const [status, setStatus] = useState<"idle" | "saving" | "saved">("idle");
  const [error, setError] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const slugChanged = slug !== savedSlug;
  const coverDisplay = coverPreview ?? (coverRemoved ? null : savedCover);

  function selectCover(file: File) {
    if (coverPreview) URL.revokeObjectURL(coverPreview);
    setCoverFile(file);
    setCoverPreview(URL.createObjectURL(file));
    setCoverRemoved(false);
    setError(null);
  }

  function removeCover() {
    if (coverPreview) URL.revokeObjectURL(coverPreview);
    setCoverFile(null);
    setCoverPreview(null);
    setCoverRemoved(true);
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    // The slug is printed on QR codes, so confirm before re-pointing it.
    if (slugChanged) {
      setConfirmOpen(true);
      return;
    }
    await save();
  }

  async function save() {
    setStatus("saving");
    setError(null);
    onSavingChange?.(true);

    try {
      // Resolve the intro image: upload a newly-picked file, or clear it. Only
      // included in the PATCH when it actually changed.
      const coverPatch: { coverImageUrl?: string | null } = {};
      let nextCover: string | null | undefined;
      if (coverFile) {
        try {
          nextCover = await uploadStoreImage(storeId, coverFile);
        } catch {
          throw new Error("紹介画像をアップロードできませんでした。もう一度お試しください。");
        }
        coverPatch.coverImageUrl = nextCover;
      } else if (coverRemoved) {
        nextCover = null;
        coverPatch.coverImageUrl = null;
      }

      const res = await fetch(`/api/admin/stores/${storeId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          slug: slug.trim(),
          googlePlaceId: googlePlaceId.trim(),
          instagramUrl: instagramUrl.trim(),
          facebookUrl: facebookUrl.trim(),
          ...coverPatch,
        }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as { error?: string } | null;
        if (body?.error === "slug_taken") throw new Error("この店舗URLは既に使われています。別のURLを入力してください。");
        if (body?.error === "invalid_slug")
          throw new Error("店舗URLは半角の英小文字・数字・ハイフンのみ使用できます（例：sushi-hana）。");
        throw new Error("保存できませんでした。もう一度お試しください。");
      }
      setSavedSlug(slug.trim());
      if (nextCover !== undefined) setSavedCover(nextCover);
      if (coverPreview) URL.revokeObjectURL(coverPreview);
      setCoverFile(null);
      setCoverPreview(null);
      setCoverRemoved(false);
      setConfirmOpen(false);
      setStatus("saved");
      onSaved?.({ name: name.trim(), slug: slug.trim(), googlePlaceId: googlePlaceId.trim() });
      router.refresh();
      setTimeout(() => setStatus("idle"), 2000);
    } catch (err) {
      setConfirmOpen(false);
      setError(err instanceof Error ? err.message : "保存できませんでした。もう一度お試しください。");
      setStatus("idle");
    } finally {
      onSavingChange?.(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <label className="block text-sm font-medium text-neutral-700">
        店舗名
        <input
          value={name}
          onChange={(event) => {
            const next = event.target.value;
            setName(next);
            // Keep the slug in sync with the name until it's been hand-edited.
            // Skip when slugify() is empty (e.g. a name with no ASCII letters),
            // so a Japanese-only name doesn't blank out a valid slug.
            if (!slugEdited) {
              const derived = slugify(next);
              if (derived) setSlug(derived);
            }
          }}
          required
          maxLength={80}
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
          {slugChanged ? (
            <span className="mt-1 block font-medium text-amber-600">
              ⚠ 変更すると印刷済みのQRコードは使えなくなります。保存後に新しいQRコードを印刷してください。
            </span>
          ) : null}
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
            {coverDisplay ? (
              // Local object URLs and Supabase URLs alike — a plain img avoids
              // next/image's remote/blob constraints for this preview.
              // eslint-disable-next-line @next/next/no-img-element
              <img src={coverDisplay} alt="紹介画像" className="absolute inset-0 h-full w-full object-cover" />
            ) : (
              <span className="flex h-full w-full flex-col items-center justify-center gap-1 text-neutral-300">
                <ImagePlus className="h-8 w-8" strokeWidth={1.5} />
              </span>
            )}
          </div>
          <div className="mt-2 flex items-center gap-3">
            <label className="cursor-pointer rounded-full border border-neutral-300 px-4 py-2 text-xs font-medium hover:bg-neutral-100">
              {coverDisplay ? "画像を変更" : "アップロード"}
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
            {coverDisplay ? (
              <button
                type="button"
                onClick={removeCover}
                className="text-xs font-medium text-neutral-400 hover:text-red-500"
              >
                削除
              </button>
            ) : null}
          </div>
          {coverFile ? <p className="mt-1 text-[11px] text-neutral-400">保存時にアップロードされます</p> : null}
        </div>
      </div>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="submit"
          disabled={status === "saving"}
          className="w-full rounded-full bg-neutral-900 px-6 py-3 text-sm font-semibold text-white disabled:opacity-40 sm:w-auto"
        >
          {status === "saving" ? "保存中…" : "保存"}
        </button>
        {status === "saved" ? <span className="text-sm text-green-600">保存しました</span> : null}
      </div>

      <ConfirmModal
        open={confirmOpen}
        tone="danger"
        title="店舗URLを変更しますか？"
        description="変更すると、いま印刷済みのQRコードは読み取れなくなります。変更後は新しいQRコードを印刷し直してください。"
        confirmLabel="変更して保存"
        cancelLabel="キャンセル"
        busy={status === "saving"}
        onConfirm={() => void save()}
        onClose={() => setConfirmOpen(false)}
      />
    </form>
  );
}
