"use client";

import { BellRing } from "lucide-react";
import { useEffect, useState } from "react";
import { isPushSubscribed, pushSupported, subscribePush } from "@/lib/pushClient";

const DISMISS_KEY = "arigato-push-prompt-dismissed";

/**
 * Shown once when the admin opens the panel and notifications are off — invites
 * them to turn on push. Dismissing it (or enabling) stops it from reappearing.
 */
export function PushPrompt() {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!pushSupported()) return;
    if (localStorage.getItem(DISMISS_KEY) === "1") return;
    if (Notification.permission === "denied") return;
    // Only prompt when this device isn't subscribed yet.
    isPushSubscribed().then((subscribed) => {
      if (!subscribed) setOpen(true);
    });
  }, []);

  function dismiss() {
    try {
      localStorage.setItem(DISMISS_KEY, "1");
    } catch {
      // ignore
    }
    setOpen(false);
  }

  async function enable() {
    setBusy(true);
    try {
      await subscribePush();
    } finally {
      setBusy(false);
      dismiss();
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" />
      <div className="relative z-10 w-full max-w-sm rounded-2xl bg-white p-6 text-center shadow-xl">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[var(--color-accent)]/10 text-[var(--color-accent)]">
          <BellRing className="h-7 w-7" strokeWidth={1.75} />
        </span>
        <h3 className="mt-4 text-lg font-bold">通知をオンにしませんか？</h3>
        <p className="mt-2 text-sm leading-relaxed text-neutral-500">
          新しいチップ・口コミが届いたときに、この端末へお知らせします。アプリを開いていなくても受け取れます。
        </p>

        <div className="mt-6 flex flex-col gap-2">
          <button
            type="button"
            onClick={enable}
            disabled={busy}
            className="w-full rounded-full bg-[var(--color-accent)] py-3 text-sm font-semibold text-white transition-colors hover:bg-[var(--color-accent-dark)] disabled:opacity-50"
          >
            {busy ? "設定中…" : "通知をオンにする"}
          </button>
          <button type="button" onClick={dismiss} className="w-full py-2 text-sm font-medium text-neutral-500">
            後で
          </button>
        </div>
      </div>
    </div>
  );
}
