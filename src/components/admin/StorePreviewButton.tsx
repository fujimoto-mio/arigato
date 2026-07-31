"use client";

import { Eye } from "lucide-react";
import { useEffect, useState } from "react";

/**
 * Preview the store's live guest page (the QR destination) in a phone frame,
 * without leaving the admin. Loads `/s/<slug>` in an iframe so it always reflects
 * the current store info / story.
 */
export function StorePreviewButton({ url }: { url: string }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 rounded-full border border-neutral-300 px-4 py-1.5 text-xs font-semibold text-neutral-700 transition hover:bg-neutral-100"
      >
        <Eye className="h-3.5 w-3.5" />
        プレビュー
      </button>

      {open ? (
        <div
          className="fixed inset-0 z-[130] flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          onClick={() => setOpen(false)}
        >
          <div className="absolute inset-0 bg-black/60" />
          <div className="relative z-10 flex flex-col items-center gap-3" onClick={(e) => e.stopPropagation()}>
            <div className="h-[720px] max-h-[82vh] w-[380px] max-w-full overflow-hidden rounded-[2.2rem] border-[6px] border-neutral-900 bg-white shadow-2xl">
              <iframe src={url} title="お客様用ページのプレビュー" className="h-full w-full border-0" />
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-full bg-white px-6 py-2 text-sm font-medium text-neutral-700 shadow"
            >
              閉じる
            </button>
          </div>
        </div>
      ) : null}
    </>
  );
}
