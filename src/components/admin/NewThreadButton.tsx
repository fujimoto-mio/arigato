"use client";

import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { type FormEvent, useEffect, useState } from "react";

/** Operator control to open a new support thread with the platform. */
export function NewThreadButton() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape" && !busy) setOpen(false);
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, busy]);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/support/threads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject: subject.trim(), message: message.trim() }),
      });
      if (!res.ok) throw new Error("failed");
      const { threadId } = (await res.json()) as { threadId: string };
      router.push(`/admin/support/${threadId}`);
    } catch {
      setError("送信できませんでした。もう一度お試しください。");
      setBusy(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 rounded-full bg-[var(--color-accent)] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[var(--color-accent-dark)]"
      >
        <Plus className="h-4 w-4" />
        新しい問い合わせ
      </button>

      {open ? (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4" role="dialog" aria-modal="true">
          <div className="absolute inset-0 bg-black/40" />
          <form
            onSubmit={submit}
            className="relative z-10 flex w-full max-w-md flex-col gap-4 rounded-2xl bg-white p-6 shadow-xl"
          >
            <h3 className="text-lg font-bold">新しい問い合わせ</h3>
            <label className="block text-sm font-medium text-neutral-700">
              件名
              <input
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                required
                maxLength={120}
                placeholder="例：チップの振込について"
                className="mt-1 w-full rounded-lg border border-neutral-300 p-3 text-sm"
              />
            </label>
            <label className="block text-sm font-medium text-neutral-700">
              内容
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                required
                maxLength={4000}
                rows={5}
                placeholder="お問い合わせ内容をご記入ください。"
                className="mt-1 w-full rounded-lg border border-neutral-300 p-3 text-sm"
              />
            </label>
            {error ? <p className="text-sm text-red-600">{error}</p> : null}
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setOpen(false)}
                disabled={busy}
                className="rounded-full border border-neutral-300 px-5 py-2.5 text-sm font-medium text-neutral-700 disabled:opacity-50"
              >
                キャンセル
              </button>
              <button
                type="submit"
                disabled={busy || !subject.trim() || !message.trim()}
                className="rounded-full bg-[var(--color-accent)] px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-40"
              >
                {busy ? "送信中…" : "送信"}
              </button>
            </div>
          </form>
        </div>
      ) : null}
    </>
  );
}
