"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import { REVIEW_EVENT, TIP_EVENT, storeChannelName } from "@/lib/realtime";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

/**
 * Keeps the server-rendered dashboard live: on a new tip/review broadcast it
 * re-fetches the page (router.refresh) and plays a short chime so staff notice.
 */
export function DashboardLive({ storeId }: { storeId: string }) {
  const router = useRouter();
  const chimeRef = useRef<(() => void) | null>(null);

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
        // Autoplay policy or no audio device — the refresh still lands.
      }
    };
  }, []);

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    const channel = supabase
      .channel(storeChannelName(storeId))
      .on("broadcast", { event: TIP_EVENT }, () => {
        chimeRef.current?.();
        router.refresh();
      })
      .on("broadcast", { event: REVIEW_EVENT }, () => router.refresh())
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [storeId, router]);

  return null;
}
