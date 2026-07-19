export const TIP_TIERS = [
  { amount: 1000, labelKey: "littleThanks" },
  { amount: 2000, labelKey: "littleThanks" },
  { amount: 3000, labelKey: "littleThanks" },
  { amount: 5000, labelKey: "generous" },
  { amount: 10000, labelKey: "veryGenerous" },
  { amount: 20000, labelKey: "special" },
] as const;

export type TipTierLabelKey = (typeof TIP_TIERS)[number]["labelKey"];

export const TIP_AMOUNTS: readonly number[] = TIP_TIERS.map((tier) => tier.amount);
