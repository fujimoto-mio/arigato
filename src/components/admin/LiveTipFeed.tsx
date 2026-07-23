"use client";

import { useEffect, useRef, useState } from "react";
import { formatTokyoTime, formatUsdApprox, formatYen } from "@/lib/admin/period";
import {
  REVIEW_EVENT,
  TIP_EVENT,
  type ReviewEvent,
  type TipEvent,
  storeChannelName,
} from "@/lib/realtime";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

export type FeedTip = {
  tipId: string;
  amount: number;
  tableLabel: string | null;
  paymentMethod: "cash" | "card";
  locale: string;
  createdAt: string;
  rating: number | null;
  comment: string | null;
  photoUrls: string[];
};

type ConnectionState = "connecting" | "live" | "error";

function Stars({ rating }: { rating: number }) {
  return (
    <span aria-label={`${rating} out of 5`} className="text-sm text-amber-500">
      {"★".repeat(rating)}
      <span className="text-neutral-300">{"★".repeat(5 - rating)}</span>
    </span>
  );
}

export function LiveTipFeed({ storeId, initialTips }: { storeId: string; initialTips: FeedTip[] }) {
  const [tips, setTips] = useState<FeedTip[]>(initialTips);
  const [connection, setConnection] = useState<ConnectionState>("connecting");
  const [freshIds, setFreshIds] = useState<Set<string>>(() => new Set());
  const audioRef = useRef<(() => void) | null>(null);

  useEffect(() => {
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
              amount: tip.amount,
              tableLabel: tip.tableLabel,
              paymentMethod: tip.paymentMethod,
              locale: tip.locale,
              createdAt: tip.createdAt,
              rating: null,
              comment: null,
              photoUrls: [],
            },
            ...current,
          ].slice(0, 50);
        });
        setFreshIds((current) => new Set(current).add(tip.tipId));
        audioRef.current?.();
      })
      .on("broadcast", { event: REVIEW_EVENT }, ({ payload }) => {
        // A review lands after its tip — merge it into the matching row.
        const review = payload as ReviewEvent;
        setTips((current) =>
          current.map((tip) =>
            tip.tipId === review.tipId
              ? { ...tip, rating: review.rating, comment: review.comment, photoUrls: review.photoUrls }
              : tip,
          ),
        );
        setFreshIds((current) => new Set(current).add(review.tipId));
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
        <h2 className="text-lg font-bold">Recent tips &amp; reviews</h2>
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
          No tips yet. This list updates the moment a tip is submitted.
        </p>
      ) : (
        <ul className="mt-4 flex flex-col gap-2">
          {tips.map((tip) => (
            <li
              key={tip.tipId}
              className={`rounded-xl border p-4 transition ${
                freshIds.has(tip.tipId) ? "border-green-300 bg-green-50" : "border-neutral-200 bg-white"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs text-neutral-500">
                    {tip.tableLabel ? `Table ${tip.tableLabel} · ` : ""}
                    {formatTokyoTime(tip.createdAt)} · {tip.locale.toUpperCase()} ·{" "}
                    {tip.paymentMethod === "card" ? "Card" : "Cash"}
                  </p>
                  {tip.rating ? (
                    <div className="mt-1">
                      <Stars rating={tip.rating} />
                    </div>
                  ) : null}
                  {tip.comment ? <p className="mt-1 text-sm text-neutral-800">{tip.comment}</p> : null}
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold">{formatYen(tip.amount)}</p>
                  <p className="text-xs text-neutral-400">{formatUsdApprox(tip.amount)}</p>
                </div>
              </div>
              {tip.photoUrls.length > 0 ? (
                <div className="mt-3 flex flex-wrap gap-2">
                  {tip.photoUrls.map((url) => (
                    // Guest-uploaded Supabase URLs; plain img avoids remote-loader config.
                    // eslint-disable-next-line @next/next/no-img-element
                    <img key={url} src={url} alt="review" className="h-16 w-16 rounded-lg object-cover" />
                  ))}
                </div>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
