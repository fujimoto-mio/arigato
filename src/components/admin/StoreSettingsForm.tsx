"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";
import { ConfirmModal } from "@/components/admin/ConfirmModal";

/** Store name → URL-safe slug: lowercase, non-alphanumerics become hyphens. */
function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function StoreSettingsForm({
  initialName,
  initialSlug,
  initialGooglePlaceId,
  initialLogoUrl,
  initialInstagramUrl,
  initialFacebookUrl,
  onSavingChange,
  onSaved,
}: {
  initialName: string;
  initialSlug: string;
  initialGooglePlaceId: string | null;
  initialLogoUrl: string | null;
  initialInstagramUrl: string | null;
  initialFacebookUrl: string | null;
  // Let a parent mirror the save into the QR preview (spinner + new URL).
  onSavingChange?: (saving: boolean) => void;
  onSaved?: (store: { name: string; slug: string }) => void;
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
  const [logoUrl, setLogoUrl] = useState(initialLogoUrl);
  const [status, setStatus] = useState<"idle" | "saving" | "saved">("idle");
  const [error, setError] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const slugChanged = slug !== savedSlug;

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
      const res = await fetch("/api/admin/settings", {
        method: "PATCH",
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
        throw new Error("保存できませんでした。もう一度お試しください。");
      }
      setSavedSlug(slug.trim());
      setConfirmOpen(false);
      setStatus("saved");
      onSaved?.({ name: name.trim(), slug: slug.trim() });
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

  async function handleLogo(file: File) {
    setError(null);
    try {
      const form = new FormData();
      form.append("file", file);
      const uploadRes = await fetch("/api/admin/upload", { method: "POST", body: form });
      if (!uploadRes.ok) throw new Error("upload_failed");
      const { url } = (await uploadRes.json()) as { url: string };

      const res = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ logoUrl: url }),
      });
      if (!res.ok) throw new Error("save_failed");
      setLogoUrl(url);
      router.refresh();
    } catch {
      setError("ロゴをアップロードできませんでした。もう一度お試しください。");
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
        店舗ロゴ
        <div className="mt-2 flex items-center gap-3">
          <div className="relative h-16 w-16 overflow-hidden rounded-lg bg-neutral-100">
            {logoUrl ? (
              <Image src={logoUrl} alt="Store logo" fill sizes="64px" className="object-cover" />
            ) : (
              <span className="flex h-full w-full items-center justify-center text-xl">🏠</span>
            )}
          </div>
          <label className="cursor-pointer rounded-full border border-neutral-300 px-4 py-2 text-xs font-medium hover:bg-neutral-100">
            アップロード
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="sr-only"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) void handleLogo(file);
                event.target.value = "";
              }}
            />
          </label>
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
