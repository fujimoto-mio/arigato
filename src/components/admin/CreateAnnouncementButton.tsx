"use client";

import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Select } from "@/components/admin/Select";

/** Platform-admin control to publish an announcement (全店舗 or one store). */
export function CreateAnnouncementButton({ stores }: { stores: { id: string; name: string }[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [audience, setAudience] = useState(""); // "" = all stores
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const options = [{ value: "", label: "全店舗" }, ...stores.map((s) => ({ value: s.id, label: s.name }))];

  async function submit(status: "draft" | "published") {
    if (!title.trim() || !body.trim()) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/announcements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: title.trim(), body: body.trim(), storeId: audience || null, status }),
      });
      if (!res.ok) throw new Error("failed");
      setOpen(false);
      setTitle("");
      setBody("");
      setAudience("");
      router.refresh();
    } catch {
      setError("保存できませんでした。もう一度お試しください。");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 rounded-full bg-neutral-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-neutral-800"
      >
        <Plus className="h-4 w-4" />
        お知らせを配信
      </button>

      {open ? (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4" role="dialog" aria-modal="true">
          <div className="absolute inset-0 bg-black/40" />
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void submit("published");
            }}
            className="relative z-10 flex w-full max-w-md flex-col gap-4 rounded-2xl bg-white p-6 shadow-xl"
          >
            <h3 className="text-lg font-bold">お知らせを配信</h3>
            <label className="block text-sm font-medium text-neutral-700">
              配信先
              <div className="mt-1">
                <Select value={audience} onChange={setAudience} options={options} ariaLabel="配信先" className="w-full" />
              </div>
            </label>
            <label className="block text-sm font-medium text-neutral-700">
              タイトル
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                maxLength={120}
                className="mt-1 w-full rounded-lg border border-neutral-300 p-3 text-sm"
              />
            </label>
            <label className="block text-sm font-medium text-neutral-700">
              内容
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                required
                maxLength={4000}
                rows={5}
                className="mt-1 w-full rounded-lg border border-neutral-300 p-3 text-sm"
              />
            </label>
            {error ? <p className="text-sm text-red-600">{error}</p> : null}
            <div className="flex flex-wrap justify-end gap-2">
              <button
                type="button"
                onClick={() => setOpen(false)}
                disabled={busy}
                className="rounded-full border border-neutral-300 px-5 py-2.5 text-sm font-medium text-neutral-700 disabled:opacity-50"
              >
                キャンセル
              </button>
              <button
                type="button"
                onClick={() => void submit("draft")}
                disabled={busy || !title.trim() || !body.trim()}
                className="rounded-full border border-neutral-300 px-5 py-2.5 text-sm font-semibold text-neutral-700 disabled:opacity-40"
              >
                下書き保存
              </button>
              <button
                type="submit"
                disabled={busy || !title.trim() || !body.trim()}
                className="rounded-full bg-neutral-900 px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-40"
              >
                {busy ? "処理中…" : "公開して配信"}
              </button>
            </div>
          </form>
        </div>
      ) : null}
    </>
  );
}
