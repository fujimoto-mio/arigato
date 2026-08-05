import type { SubscriptionStatus } from "@prisma/client";

/**
 * The store's monthly plan. The price itself lives in Stripe (STRIPE_PRICE_ID);
 * these are for display only — 初月無料 → 2か月目以降 ¥5,000/月（税抜）.
 */
export const PLAN = {
  monthlyLabel: "¥5,000",
  taxNote: "税抜",
  trialDays: 30,
} as const;

/** Statuses where the guest page (QR target) is live. */
export function isSubscriptionLive(status: SubscriptionStatus): boolean {
  return status === "trialing" || status === "active";
}

/** Map a Stripe subscription status string onto our enum. */
export function toSubscriptionStatus(stripeStatus: string): SubscriptionStatus {
  switch (stripeStatus) {
    case "trialing":
      return "trialing";
    case "active":
      return "active";
    case "past_due":
    case "unpaid":
      return "past_due";
    case "canceled":
    case "incomplete_expired":
      return "canceled";
    default:
      // incomplete / paused / anything unknown → treat as not live.
      return "none";
  }
}

/** Japanese label + badge tone for a subscription status (admin surfaces). */
export function subscriptionBadge(status: SubscriptionStatus): {
  label: string;
  tone: "emerald" | "amber" | "rose" | "neutral";
} {
  switch (status) {
    case "trialing":
      return { label: "トライアル中", tone: "amber" };
    case "active":
      return { label: "購読中", tone: "emerald" };
    case "past_due":
      return { label: "支払い遅延", tone: "rose" };
    case "canceled":
      return { label: "解約済み", tone: "neutral" };
    default:
      return { label: "未購読", tone: "neutral" };
  }
}
