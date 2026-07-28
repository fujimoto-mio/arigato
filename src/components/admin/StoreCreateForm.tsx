"use client";

import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";

/** Store name → URL-safe slug: lowercase, non-alphanumerics become hyphens. */
function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** "Add store" — a toggleable inline form that creates a store and opens its editor. */
export function StoreCreateForm() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugEdited, setSlugEdited] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function reset() {
    setName("");
    setSlug("");
    setSlugEdited(false);
    setError(null);
  }

  async function handleSubmit(event: FormEvent) {
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
      // Open the new store's editor to finish setting it up.
      router.push(`/admin/stores/${store.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "店舗を作成できませんでした。");
      setBusy(false);
    }
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 rounded-full bg-neutral-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-neutral-800"
      >
        <Plus className="h-4 w-4" />
        新規店舗を追加
      </button>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-4 rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm"
    >
      <h2 className="text-base font-bold">新規店舗を追加</h2>

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

      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="submit"
          disabled={busy || !name.trim() || !slug.trim()}
          className="rounded-full bg-neutral-900 px-6 py-2.5 text-sm font-semibold text-white disabled:opacity-40"
        >
          {busy ? "作成中…" : "作成して編集"}
        </button>
        <button
          type="button"
          onClick={() => {
            setOpen(false);
            reset();
          }}
          disabled={busy}
          className="rounded-full px-4 py-2.5 text-sm font-medium text-neutral-500 hover:text-neutral-800"
        >
          キャンセル
        </button>
      </div>
    </form>
  );
}
