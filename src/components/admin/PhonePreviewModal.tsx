"use client";

import { type ReactNode, useEffect } from "react";

/**
 * Reusable phone-framed preview modal: a dark backdrop, a phone-shaped frame that
 * holds any content (a live-page iframe, a draft render, …), and a 閉じる button.
 * Controlled via `open`; the parent owns the state. Used anywhere a store page
 * needs an in-admin preview.
 */
export function PhonePreviewModal({
  open,
  onClose,
  children,
  ariaLabel = "プレビュー",
  closeLabel = "閉じる",
}: {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  ariaLabel?: string;
  closeLabel?: string;
}) {
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[130] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label={ariaLabel}
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/60" />
      <div className="relative z-10 flex flex-col items-center gap-3" onClick={(e) => e.stopPropagation()}>
        <div className="h-[720px] max-h-[82vh] w-[380px] max-w-full overflow-hidden rounded-[2.2rem] border-[6px] border-neutral-900 bg-white shadow-2xl">
          {children}
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-full bg-white px-6 py-2 text-sm font-medium text-neutral-700 shadow"
        >
          {closeLabel}
        </button>
      </div>
    </div>
  );
}
