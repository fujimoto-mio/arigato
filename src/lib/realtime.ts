import type { Locale } from "@/i18n/messages";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export type TipEvent = {
  tipId: string;
  amount: number;
  locale: Locale | string;
  tableLabel: string | null;
  paymentMethod: "cash" | "card";
  createdAt: string;
};

export type ReviewEvent = {
  tipId: string;
  rating: number;
  comment: string | null;
  photoUrls: string[];
  createdAt: string;
};

export const TIP_EVENT = "tip";
export const REVIEW_EVENT = "review";

/** Realtime topic a store's admin dashboard subscribes to. */
export function storeChannelName(storeId: string) {
  return `store:${storeId}`;
}

async function broadcast(storeId: string, event: string, payload: unknown) {
  if (!supabaseUrl || !serviceRoleKey) {
    console.error("realtime broadcast: Supabase env vars are not set");
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
        messages: [{ topic: storeChannelName(storeId), event, payload }],
      }),
    });

    if (!res.ok) {
      console.error("realtime broadcast failed", event, res.status, await res.text());
    }
  } catch (error) {
    console.error("realtime broadcast threw", event, error);
  }
}

/**
 * Notify the store's dashboard/register that a tip landed.
 *
 * Uses Realtime's HTTP broadcast endpoint rather than a websocket channel: the
 * caller is a short-lived serverless invocation, so there is no connection worth
 * keeping open. Failures are logged, never thrown — a missed notification must
 * not fail the request that recorded a tip that already happened.
 */
export function broadcastTip(storeId: string, payload: TipEvent) {
  return broadcast(storeId, TIP_EVENT, payload);
}

/** Notify the dashboard that a review was attached to an existing tip. */
export function broadcastReview(storeId: string, payload: ReviewEvent) {
  return broadcast(storeId, REVIEW_EVENT, payload);
}
