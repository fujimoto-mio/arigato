"use client";

import { AlertTriangle } from "lucide-react";
import type { ReactNode } from "react";

/**
 * Reusable confirm dialog — a styled replacement for window.confirm(). Controlled
 * via `open`; the parent owns the state and runs the action in onConfirm. The
 * backdrop is intentionally non-dismissing so a destructive action is only
 * cancelled via the explicit Cancel button.
 */
export function ConfirmModal({
  open,
  title,
  description,
  confirmLabel = "OK",
  cancelLabel = "キャンセル",
  tone = "default",
  busy = false,
  onConfirm,
  onClose,
}: {
  open: boolean;
  title: string;
  description: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: "default" | "danger";
  busy?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}) {
  if (!open) return null;

  const accent =
    tone === "danger"
      ? { chip: "bg-red-50 text-red-600", button: "bg-red-600 hover:bg-red-700" }
      : {
          chip: "bg-[var(--color-accent)]/10 text-[var(--color-accent)]",
          button: "bg-[var(--color-accent)] hover:bg-[var(--color-accent-dark)]",
        };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/40" />
      <div className="relative z-10 w-full max-w-sm rounded-2xl bg-white p-6 text-center shadow-xl">
        <span className={`mx-auto flex h-14 w-14 items-center justify-center rounded-full ${accent.chip}`}>
          <AlertTriangle className="h-7 w-7" strokeWidth={1.75} />
        </span>
        <h3 className="mt-4 text-lg font-bold">{title}</h3>
        <p className="mt-2 text-sm leading-relaxed text-neutral-500">{description}</p>

        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-center">
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            className="w-full rounded-full border border-neutral-300 py-3 text-sm font-medium text-neutral-700 transition hover:bg-neutral-100 disabled:opacity-50 sm:w-auto sm:px-6"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={busy}
            className={`w-full rounded-full py-3 text-sm font-semibold text-white transition-colors disabled:opacity-50 sm:w-auto sm:px-6 ${accent.button}`}
          >
            {busy ? "処理中…" : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
