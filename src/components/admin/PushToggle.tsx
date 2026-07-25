"use client";

import { Bell, BellRing } from "lucide-react";
import { useEffect, useState } from "react";

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  const output = new Uint8Array(new ArrayBuffer(raw.length));
  for (let i = 0; i < raw.length; i += 1) output[i] = raw.charCodeAt(i);
  return output;
}

/**
 * "Enable notifications" control — subscribes this admin device to Web Push so
 * new tips/reviews notify the admin even when the panel is closed.
 */
export function PushToggle({ variant = "button" }: { variant?: "button" | "switch" }) {
  const [supported, setSupported] = useState(false);
  const [subscribed, setSubscribed] = useState(false);
  const [denied, setDenied] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const ok =
      "serviceWorker" in navigator && "PushManager" in window && "Notification" in window && Boolean(VAPID_PUBLIC_KEY);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSupported(ok);
    if (!ok) return;
    if (Notification.permission === "denied") {
      setDenied(true);
    }
    navigator.serviceWorker.ready
      .then((reg) => reg.pushManager.getSubscription())
      .then((sub) => setSubscribed(Boolean(sub)))
      .catch(() => {});
  }, []);

  async function enable() {
    if (!VAPID_PUBLIC_KEY) return;
    setBusy(true);
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setDenied(permission === "denied");
        return;
      }
      setDenied(false);
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      });
      await fetch("/api/admin/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(sub),
      });
      setSubscribed(true);
    } catch {
      // permission dismissed or subscribe failed — leave the toggle off.
    } finally {
      setBusy(false);
    }
  }

  async function disable() {
    setBusy(true);
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        await fetch("/api/admin/push/subscribe", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ endpoint: sub.endpoint }),
        });
        await sub.unsubscribe();
      }
      setSubscribed(false);
    } catch {
      // ignore
    } finally {
      setBusy(false);
    }
  }

  if (!supported) return null;

  if (variant === "switch") {
    return (
      <div className="flex items-start justify-between gap-4 rounded-2xl border border-neutral-200 bg-white p-4">
        <div className="min-w-0">
          <p className="text-sm font-medium text-neutral-900">プッシュ通知</p>
          <p className="mt-0.5 text-xs text-neutral-500">
            {subscribed ? "この端末で通知を受け取ります。" : "オンにすると新着を通知します。"}
          </p>
          {denied ? (
            <p className="mt-1 text-[11px] text-red-500">ブラウザの設定で通知がブロックされています。</p>
          ) : null}
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={subscribed}
          aria-label="プッシュ通知"
          onClick={subscribed ? disable : enable}
          disabled={busy || (denied && !subscribed)}
          className={`relative h-6 w-11 shrink-0 rounded-full transition-colors disabled:opacity-50 ${
            subscribed ? "bg-[var(--color-accent)]" : "bg-neutral-300"
          }`}
        >
          <span
            className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${
              subscribed ? "left-[1.375rem]" : "left-0.5"
            }`}
          />
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-start gap-1">
      {subscribed ? (
        <button
          type="button"
          onClick={disable}
          disabled={busy}
          className="flex items-center gap-1.5 rounded-full bg-[var(--color-accent)]/10 px-3 py-1.5 text-xs font-medium text-[var(--color-accent)] disabled:opacity-50"
        >
          <BellRing className="h-4 w-4" strokeWidth={1.75} />
          通知オン（タップでオフ）
        </button>
      ) : (
        <button
          type="button"
          onClick={enable}
          disabled={busy || denied}
          className="flex items-center gap-1.5 rounded-full border border-[var(--color-accent)] px-3 py-1.5 text-xs font-medium text-[var(--color-accent)] transition hover:bg-[var(--color-accent)]/10 disabled:opacity-50"
        >
          <Bell className="h-4 w-4" strokeWidth={1.75} />
          {busy ? "設定中…" : "通知をオンにする"}
        </button>
      )}
      {denied ? (
        <p className="text-[11px] text-red-500">ブラウザの設定で通知がブロックされています。設定から許可してください。</p>
      ) : null}
    </div>
  );
}
