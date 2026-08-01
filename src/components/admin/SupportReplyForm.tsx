"use client";

import { ImagePlus, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";

/** Message composer for a support thread — text + optional image attachment. */
export function SupportReplyForm({ threadId, storeId }: { threadId: string; storeId: string }) {
  const router = useRouter();
  const [body, setBody] = useState("");
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function uploadImage(file: File) {
    setUploading(true);
    setError(null);
    try {
      const form = new FormData();
      form.append("file", file);
      form.append("storeId", storeId);
      const res = await fetch("/api/admin/upload", { method: "POST", body: form });
      if (!res.ok) throw new Error("upload_failed");
      const { url } = (await res.json()) as { url: string };
      setImageUrl(url);
    } catch {
      setError("画像をアップロードできませんでした。");
    } finally {
      setUploading(false);
    }
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!body.trim()) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/support/threads/${threadId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: body.trim(), imageUrl: imageUrl ?? undefined }),
      });
      if (!res.ok) throw new Error("failed");
      setBody("");
      setImageUrl(null);
      router.refresh();
    } catch {
      setError("送信できませんでした。もう一度お試しください。");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit}>
      {imageUrl ? (
        <div className="relative mb-2 inline-block">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={imageUrl} alt="添付画像" className="max-h-28 rounded-lg" />
          <button
            type="button"
            aria-label="添付を削除"
            onClick={() => setImageUrl(null)}
            className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-black/55 text-white"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      ) : null}

      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        rows={3}
        maxLength={4000}
        placeholder="メッセージを入力してください…"
        className="w-full resize-none rounded-lg border border-neutral-200 p-3 text-sm focus:border-[var(--color-accent)] focus:outline-none"
      />

      {error ? <p className="mt-1 text-sm text-red-600">{error}</p> : null}

      <div className="mt-2 flex items-center justify-between gap-2">
        <label className="flex cursor-pointer items-center gap-1.5 rounded-full border border-neutral-300 px-3 py-1.5 text-xs font-medium text-neutral-600 hover:bg-neutral-100">
          <ImagePlus className="h-4 w-4" />
          {uploading ? "アップロード中…" : "画像を添付"}
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="sr-only"
            disabled={uploading}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void uploadImage(file);
              e.target.value = "";
            }}
          />
        </label>
        <button
          type="submit"
          disabled={busy || uploading || !body.trim()}
          className="rounded-full bg-[var(--color-accent)] px-6 py-2 text-sm font-semibold text-white disabled:opacity-40"
        >
          {busy ? "送信中…" : "送信"}
        </button>
      </div>
    </form>
  );
}
