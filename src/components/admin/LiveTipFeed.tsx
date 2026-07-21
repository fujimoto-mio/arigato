"use client";

import { useEffect, useRef, useState } from "react";
import { formatTokyoTime, formatYen } from "@/lib/admin/period";
import { TIP_EVENT, type TipEvent, storeChannelName } from "@/lib/realtime";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

export type FeedTip = {
  tipId: string;
  staffName: string;
  amount: number;
  locale: string;
  createdAt: string;
};

type ConnectionState = "connecting" | "live" | "error";

export function LiveTipFeed({ storeId, initialTips }: { storeId: string; initialTips: FeedTip[] }) {
  const [tips, setTips] = useState<FeedTip[]>(initialTips);
  const [connection, setConnection] = useState<ConnectionState>("connecting");
  // Tips that arrived via Realtime this session, highlighted so staff can spot them.
  const [freshIds, setFreshIds] = useState<Set<string>>(() => new Set());
  const audioRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    // Short chime so staff notice a tip without watching the screen.
    audioRef.current = () => {
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
        // Autoplay policy or no audio device — the visual highlight still lands.
      }
    };
  }, []);

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    const channel = supabase
      .channel(storeChannelName(storeId))
      .on("broadcast", { event: TIP_EVENT }, ({ payload }) => {
        const tip = payload as TipEvent;
        setTips((current) => {
          if (current.some((existing) => existing.tipId === tip.tipId)) return current;
          return [
            {
              tipId: tip.tipId,
              staffName: tip.staffName,
              amount: tip.amount,
              locale: tip.locale,
              createdAt: tip.createdAt,
            },
            ...current,
          ].slice(0, 50);
        });
        setFreshIds((current) => new Set(current).add(tip.tipId));
        audioRef.current?.();
      })
      .subscribe((status) => {
        if (status === "SUBSCRIBED") setConnection("live");
        else if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") setConnection("error");
      });

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [storeId]);

  return (
    <section>
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold">Live tips</h2>
        <span className="flex items-center gap-2 text-xs text-neutral-500">
          <span
            className={`inline-block h-2 w-2 rounded-full ${
              connection === "live"
                ? "animate-pulse bg-green-500"
                : connection === "error"
                  ? "bg-red-500"
                  : "bg-neutral-300"
            }`}
          />
          {connection === "live" ? "Live" : connection === "error" ? "Disconnected" : "Connecting…"}
        </span>
      </div>

      {tips.length === 0 ? (
        <p className="mt-6 rounded-xl bg-neutral-50 p-6 text-center text-sm text-neutral-500">
          No tips yet. This list updates the moment a payment succeeds.
        </p>
      ) : (
        <ul className="mt-4 flex flex-col gap-2">
          {tips.map((tip) => (
            <li
              key={tip.tipId}
              className={`flex items-center justify-between rounded-xl border p-4 transition ${
                freshIds.has(tip.tipId)
                  ? "border-green-300 bg-green-50"
                  : "border-neutral-200 bg-white"
              }`}
            >
              <div>
                <p className="font-semibold">{tip.staffName}</p>
                <p className="text-xs text-neutral-500">
                  {formatTokyoTime(tip.createdAt)} · {tip.locale.toUpperCase()}
                </p>
              </div>
              <p className="text-lg font-bold">{formatYen(tip.amount)}</p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
