"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { SUPPORT_EVENT, supportChannelName } from "@/lib/realtime";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

/**
 * Live-updates the open support thread: subscribes to the thread's Realtime topic
 * and refreshes the server-rendered messages when the other party replies. No push
 * — support conversations are delivered only to whoever has the thread open. Also
 * keeps the message pane pinned to the latest message on open and on new messages.
 */
export function SupportThreadRealtime({ threadId }: { threadId: string }) {
  const router = useRouter();

  useEffect(() => {
    let cancelled = false;
    const scroller = document.getElementById("support-thread-scroll");
    const scrollToBottom = () => {
      if (scroller) scroller.scrollTop = scroller.scrollHeight;
    };
    // Show the latest message when a thread opens (after layout settles).
    requestAnimationFrame(scrollToBottom);
    // Follow new messages (own send or realtime refresh) down to the bottom.
    const observer = scroller ? new MutationObserver(scrollToBottom) : null;
    observer?.observe(scroller as Node, { childList: true, subtree: true });

    // Mark read once, on genuine open (this effect only re-runs when threadId
    // changes — not on realtime refreshes), then refresh badges. The endpoint
    // broadcasts so the other side's sent messages flip to read.
    void fetch(`/api/admin/support/threads/${threadId}/read`, { method: "POST" })
      .then(() => {
        if (!cancelled) router.refresh();
      })
      .catch(() => {});

    const supabase = createSupabaseBrowserClient();
    let channel: ReturnType<typeof supabase.channel> | null = null;

    void (async () => {
      // Authenticate the socket so delivery works under Realtime Authorization
      // (see AdminToaster for why store-operator sockets need this).
      const { data } = await supabase.auth.getSession();
      if (cancelled) return;
      if (data.session?.access_token) supabase.realtime.setAuth(data.session.access_token);

      channel = supabase
        .channel(supportChannelName(threadId))
        .on("broadcast", { event: SUPPORT_EVENT }, () => router.refresh())
        .subscribe();
    })();

    return () => {
      cancelled = true;
      observer?.disconnect();
      if (channel) void supabase.removeChannel(channel);
    };
  }, [threadId, router]);

  return null;
}
