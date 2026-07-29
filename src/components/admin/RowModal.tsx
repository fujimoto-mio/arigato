"use client";

import { X } from "lucide-react";
import { type ReactNode, useEffect, useState } from "react";
import { createPortal } from "react-dom";

/**
 * A clickable table row that opens a detail modal (rendered in a portal so it
 * escapes the table). Used to give DataTable rows the same tap-for-details
 * behaviour as the notifications list.
 */
export function RowModal({
  cells,
  title,
  children,
  className = "",
}: {
  cells: ReactNode;
  title: string;
  children: ReactNode;
  className?: string;
}) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <>
      <tr
        onClick={() => setOpen(true)}
        className={`cursor-pointer border-b border-neutral-50 transition hover:bg-neutral-50 ${className}`}
      >
        {cells}
      </tr>
      {open
        ? createPortal(
            <div
              className="fixed inset-0 z-[60] flex items-center justify-center p-4"
              role="dialog"
              aria-modal="true"
              onClick={() => setOpen(false)}
            >
              <div className="absolute inset-0 bg-black/40" />
              <div
                className="relative z-10 max-h-[85vh] w-full max-w-md overflow-y-auto rounded-2xl bg-white p-6 shadow-xl"
                onClick={(event) => event.stopPropagation()}
              >
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  aria-label="閉じる"
                  className="absolute right-3 top-3 rounded-full p-1.5 text-neutral-400 transition hover:bg-neutral-100 hover:text-neutral-700"
                >
                  <X className="h-5 w-5" />
                </button>
                <h3 className="text-lg font-bold">{title}</h3>
                <div className="mt-4">{children}</div>
              </div>
            </div>,
            document.body,
          )
        : null}
    </>
  );
}

/** One label/value line for a detail modal body. */
export function DetailRow({
  label,
  value,
  children,
}: {
  label: string;
  value?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-3 py-2.5">
      <dt className="shrink-0 text-neutral-500">{label}</dt>
      <dd className="min-w-0 text-right font-medium text-neutral-900">{children ?? value}</dd>
    </div>
  );
}
