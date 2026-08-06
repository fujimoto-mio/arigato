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

/** Billing statuses with a current Stripe subscription (trial or paid). */
export function isSubscriptionLive(status: SubscriptionStatus): boolean {
  return status === "trialing" || status === "active";
}

/**
 * Whether the guest tip page (QR target) accepts tips.
 * Driven by Store.status only — admin ログイン発行 (pending→active) opens the
 * page. Trial (初月無料) is billing-only and does not gate the tip URL.
 */
export function isStoreAcceptingTips(status: string): boolean {
  return status === "active";
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

/**
 * Resolve the period-end / first-charge instant from a Stripe Subscription.
 * Newer Stripe API versions put `current_period_end` on each item (not the
 * subscription root); during trial, `trial_end` is the paid-start date.
 */
export function stripeSubscriptionPeriodEnd(subscription: {
  trial_end?: number | null;
  items?: { data?: Array<{ current_period_end?: number }> };
  /** Legacy top-level field on older Stripe API responses. */
  current_period_end?: number;
}): Date | null {
  const fromItem = subscription.items?.data?.[0]?.current_period_end;
  const seconds = fromItem ?? subscription.trial_end ?? subscription.current_period_end ?? null;
  return typeof seconds === "number" ? new Date(seconds * 1000) : null;
}

/**
 * Display date for the stores 「次回更新日」column.
 * Trialing with a missing Stripe sync → estimate from consent + trial days
 * (有料購読の開始日).
 */
export function nextBillingDisplayDate(input: {
  subscriptionStatus: SubscriptionStatus;
  subscriptionCurrentPeriodEnd: Date | null;
  termsAgreedAt?: Date | null;
}): Date | null {
  if (input.subscriptionCurrentPeriodEnd) return input.subscriptionCurrentPeriodEnd;
  if (input.subscriptionStatus === "trialing" && input.termsAgreedAt) {
    return new Date(input.termsAgreedAt.getTime() + PLAN.trialDays * 24 * 60 * 60 * 1000);
  }
  return null;
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
