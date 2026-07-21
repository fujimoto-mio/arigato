import type { Locale } from "@/i18n/messages";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export type TipEvent = {
  tipId: string;
  staffId: string;
  staffName: string;
  amount: number;
  locale: Locale | string;
  createdAt: string;
};

export const TIP_EVENT = "tip";

/** Realtime topic a store's admin dashboard subscribes to. */
export function storeChannelName(storeId: string) {
  return `store:${storeId}`;
}

/**
 * Broadcast a succeeded tip to the store's dashboard.
 *
 * Uses Realtime's HTTP broadcast endpoint rather than a websocket channel: the
 * Stripe webhook is a short-lived serverless invocation, so there is no
 * connection worth keeping open (and `channel.subscribe()` would race the
 * response). Failures are logged, never thrown — a missed notification must not
 * cause Stripe to retry a webhook whose payment already succeeded.
 */
export async function broadcastTip(storeId: string, payload: TipEvent) {
  if (!supabaseUrl || !serviceRoleKey) {
    console.error("broadcastTip: Supabase env vars are not set");
    return;
  }

  try {
    const res = await fetch(`${supabaseUrl}/realtime/v1/api/broadcast`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: serviceRoleKey,
        Authorization: `Bearer ${serviceRoleKey}`,
      },
      body: JSON.stringify({
        messages: [{ topic: storeChannelName(storeId), event: TIP_EVENT, payload }],
      }),
    });

    if (!res.ok) {
      console.error("broadcastTip failed", res.status, await res.text());
    }
  } catch (error) {
    console.error("broadcastTip threw", error);
  }
}
