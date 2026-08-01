"use client";

import { Check } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export type AnnouncementItem = {
  id: string;
  title: string;
  body: string;
  audience: string;
  createdAt: string;
  read: boolean;
};

/**
 * Operator announcement list. Clicking a row opens a details modal and marks that
 * announcement as read (clearing its dot and the sidebar badge).
 */
export function AnnouncementList({ items: initial }: { items: AnnouncementItem[] }) {
  const router = useRouter();
  const [items, setItems] = useState(initial);
  const [selected, setSelected] = useState<AnnouncementItem | null>(null);

  useEffect(() => {
    if (!selected) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setSelected(null);
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [selected]);

  async function open(item: AnnouncementItem) {
    setSelected(item);
    if (item.read) return;
    // Optimistically clear the dot, then persist + refresh the sidebar badge.
    setItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, read: true } : i)));
    try {
      await fetch(`/api/admin/announcements/${item.id}/read`, { method: "POST" });
      router.refresh();
    } catch {
      // Leave it optimistically read; a refresh will reconcile.
    }
  }

  if (items.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-neutral-300 bg-neutral-50 p-10 text-center text-sm text-neutral-500">
        お知らせはありません。
      </div>
    );
  }

  return (
    <>
      <ul className="flex flex-col gap-3">
        {items.map((a) => (
          <li key={a.id}>
            <button
              type="button"
              onClick={() => open(a)}
              className={`flex w-full items-start gap-3 rounded-2xl border bg-white p-4 text-left shadow-sm transition hover:border-[var(--color-accent)]/40 hover:shadow-md sm:p-5 ${
                a.read ? "border-neutral-200" : "border-[var(--color-accent)]/40"
              }`}
            >
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="font-bold text-neutral-900">{a.title}</h2>
                  <span className="shrink-0 rounded-full bg-neutral-100 px-2 py-0.5 text-[10px] font-bold text-neutral-500">
                    {a.audience}
                  </span>
                </div>
                <p className="mt-1 line-clamp-2 text-sm text-neutral-500">{a.body}</p>
                <p className="mt-1 text-xs text-neutral-400">{a.createdAt}</p>
              </div>
              {/* Read / unread flag. */}
              <span
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                  a.read ? "bg-emerald-100 text-emerald-600" : "border border-neutral-300 text-transparent"
                }`}
                aria-label={a.read ? "既読" : "未読"}
                title={a.read ? "既読" : "未読"}
              >
                <Check className="h-5 w-5" strokeWidth={2.5} />
              </span>
            </button>
          </li>
        ))}
      </ul>

      {selected ? (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4" role="dialog" aria-modal="true">
          <div className="absolute inset-0 bg-black/40" onClick={() => setSelected(null)} />
          <div className="relative z-10 max-h-[85vh] w-full max-w-md overflow-y-auto rounded-2xl bg-white p-6 shadow-xl">
            <button
              type="button"
              onClick={() => setSelected(null)}
              aria-label="閉じる"
              className="absolute right-3 top-3 rounded-full p-1.5 text-neutral-400 transition hover:bg-neutral-100 hover:text-neutral-700"
            >
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M6 6l12 12M18 6L6 18" />
              </svg>
            </button>
            <span className="inline-block rounded-full bg-neutral-100 px-2 py-0.5 text-[10px] font-bold text-neutral-500">
              {selected.audience}
            </span>
            <h3 className="mt-2 text-lg font-bold text-neutral-900">{selected.title}</h3>
            <p className="mt-1 text-xs text-neutral-400">{selected.createdAt}</p>
            <p className="mt-4 whitespace-pre-line text-sm leading-relaxed text-neutral-700">{selected.body}</p>
          </div>
        </div>
      ) : null}
    </>
  );
}
