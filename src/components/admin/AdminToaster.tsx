"use client";

import { Coins, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { type ReviewEvent, REVIEW_EVENT, storeChannelName } from "@/lib/realtime";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

type Toast = { id: number; title: string; body: string };

/**
 * Global in-web notifications for the admin panel: on a new tip/review broadcast
 * it shows a toast, plays a chime, and refreshes server data. Mounted once in the
 * admin layout so toasts appear on every admin page in real time. Subscribes to
 * every store in view — one channel in a single-store view, all of them in the
 * all-stores view.
 */
export function AdminToaster({ storeIds }: { storeIds: string[] }) {
  const router = useRouter();
  const [toasts, setToasts] = useState<Toast[]>([]);
  const chimeRef = useRef<() => void>(() => {});
  const nextId = useRef(0);

  useEffect(() => {
    chimeRef.current = () => {
      try {
        const Ctor =
          window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
        if (!Ctor) return;
        const ctx = new Ctor();
        const oscillator = ctx.createOscillator();
        const gain = ctx.createGain();
        oscillator.connect(gain);
        gain.connect(ctx.destination);
        oscillator.frequency.value = 880;
        gain.gain.setValueAtTime(0.0001, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.2, ctx.currentTime + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.4);
        oscillator.start();
        oscillator.stop(ctx.currentTime + 0.42);
        oscillator.onended = () => void ctx.close();
      } catch {
        // Autoplay policy or no audio device — the toast still shows.
      }
    };
  }, []);

  function addToast(title: string, body: string) {
    const id = (nextId.current += 1);
    setToasts((prev) => [...prev, { id, title, body }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 5000);
  }

  function dismiss(id: number) {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }

  // Stable dependency so the effect only re-subscribes when the set of stores
  // actually changes (not on every render's new array identity).
  const storeIdsKey = storeIds.join(",");

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    const ids = storeIdsKey ? storeIdsKey.split(",") : [];
    const channels = ids.map((storeId) =>
      supabase
        .channel(storeChannelName(storeId))
        // One combined notification per interaction, fired after the review.
        .on("broadcast", { event: REVIEW_EVENT }, ({ payload }) => {
          const review = payload as ReviewEvent;
          chimeRef.current();
          addToast(
            "新しいチップ・口コミが届きました",
            `¥${Number(review.amount).toLocaleString("ja-JP")} ・ ★${Number(review.rating).toFixed(1)}${
              review.tableLabel ? ` ・ ${review.tableLabel}番` : ""
            }${review.comment ? `「${review.comment.slice(0, 30)}」` : ""}`,
          );
          router.refresh();
        })
        .subscribe(),
    );

    return () => {
      for (const channel of channels) void supabase.removeChannel(channel);
    };
  }, [storeIdsKey, router]);

  if (toasts.length === 0) return null;

  return (
    <div className="pointer-events-none fixed right-4 top-4 z-[100] flex w-[min(22rem,calc(100vw-2rem))] flex-col gap-2">
      {toasts.map((toast) => (
        <button
          key={toast.id}
          type="button"
          onClick={() => {
            dismiss(toast.id);
            router.push("/admin/notifications");
          }}
          style={{ animation: "toast-in 0.2s ease-out" }}
          className="pointer-events-auto flex items-start gap-3 rounded-2xl border border-neutral-200 bg-white p-4 text-left shadow-lg"
        >
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--color-accent)]/10 text-[var(--color-accent)]">
            <Coins className="h-5 w-5" strokeWidth={1.75} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold text-neutral-900">{toast.title}</p>
            <p className="mt-0.5 truncate text-sm text-neutral-600">{toast.body}</p>
          </div>
          <span
            role="button"
            aria-label="閉じる"
            onClick={(event) => {
              event.stopPropagation();
              dismiss(toast.id);
            }}
            className="shrink-0 rounded-full p-1 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700"
          >
            <X className="h-4 w-4" />
          </span>
        </button>
      ))}
    </div>
  );
}
