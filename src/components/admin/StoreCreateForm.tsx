"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";
import { StoreQrCard } from "@/components/admin/StoreQrCard";
import { storeTipUrl } from "@/lib/qr";

/** Store name → URL-safe slug: lowercase, non-alphanumerics become hyphens. */
function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * New-store page for the platform admin. Adding a store only needs a name and a
 * URL (slug) — the store's details (info, cover, QR usage, story) are filled in
 * later by the store operator from their own 店舗設定. After creation the store's
 * management page opens.
 */
export function StoreCreateForm({ origin }: { origin: string }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugEdited, setSlugEdited] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleCreate(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/stores", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), slug: slug.trim() }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as { error?: string } | null;
        if (body?.error === "slug_taken") throw new Error("この店舗URLは既に使われています。別のURLを入力してください。");
        if (body?.error === "invalid_slug")
          throw new Error("店舗URLは半角の英小文字・数字・ハイフンのみ使用できます（例：sushi-hana）。");
        throw new Error("店舗を作成できませんでした。もう一度お試しください。");
      }
      const { store } = (await res.json()) as { store: { id: string } };
      router.push(`/admin/stores/${store.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "作成できませんでした。");
      setBusy(false);
    }
  }

  return (
    <form onSubmit={handleCreate} className="flex flex-col gap-6">
      <section className="rounded-2xl border border-neutral-200 bg-white p-5 sm:p-6">
        <h2 className="text-lg font-bold">店舗を追加</h2>
        <p className="mb-4 text-sm text-neutral-500">
          店舗名とURLだけで作成できます。店舗情報・ストーリーなどは、作成後に店舗運営者が設定します。
        </p>

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
          </div>

          {/* Live QR preview generated from the slug. */}
          <div className="border-t border-neutral-200 pt-6 lg:min-w-0 lg:flex-[5] lg:border-l lg:border-t-0 lg:pl-8 lg:pt-0">
            <h3 className="text-base font-bold">店舗QRコード</h3>
            <p className="mb-4 text-sm text-neutral-500">読み取るとお客様のチップ画面が開きます。</p>
            <StoreQrCard
              storeName={name.trim() || "店舗名"}
              tipUrl={storeTipUrl(origin, slug || "")}
              downloadName={`arigato-qr-${slug || "store"}.png`}
              loading={busy}
            />
          </div>
        </div>
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
    </form>
  );
}
