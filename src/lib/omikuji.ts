/**
 * Omikuji (fortune draw) shown after a tip of OMIKUJI_MIN_AMOUNT or more.
 * Five tiers (client's 15-slip set, 3 variations each — see omikuji-fortunes).
 * 大吉 wins a prize. The draw runs server-side and the tier is recorded on the
 * Tip (see /api/omikuji/draw) so it can't be re-rolled and the store can verify
 * a winner; the variation is derived from the tip id so it's stable too.
 *
 * This module is import-safe on the client (no node-only imports), so the guest
 * flow can share the threshold and tier types.
 */
export const OMIKUJI_TIERS = ["daikichi", "chukichi", "shokichi", "kichi", "suekichi"] as const;
export type OmikujiTier = (typeof OMIKUJI_TIERS)[number];

// Minimum tip that earns an omikuji draw. Edit OMIKUJI_MIN_DOLLARS to change it.
export const OMIKUJI_MIN_DOLLARS = 5;
export const OMIKUJI_MIN_AMOUNT = OMIKUJI_MIN_DOLLARS * 100; // cents (Stripe/USD)

// Draw odds out of 100. The client set the tiers but not the odds — tune freely.
// 大吉 kept rare since it wins a prize. ponytail: flat table, per-store odds later.
const WEIGHTS: Record<OmikujiTier, number> = {
  daikichi: 8,
  chukichi: 17,
  shokichi: 25,
  kichi: 30,
  suekichi: 20,
};

const TOTAL_WEIGHT = Object.values(WEIGHTS).reduce((sum, w) => sum + w, 0);

export function isOmikujiEligible(amount: number): boolean {
  return amount >= OMIKUJI_MIN_AMOUNT;
}

export function isOmikujiTier(value: unknown): value is OmikujiTier {
  return typeof value === "string" && (OMIKUJI_TIERS as readonly string[]).includes(value);
}

/** True when this tier wins a physical prize (大吉 only — see spec). */
export function omikujiWinsPrize(tier: OmikujiTier): boolean {
  return tier === "daikichi";
}

/**
 * Weighted random draw. Math.random is fine here: the anti-cheat is that the
 * draw runs server-side and is persisted once (no re-roll), not RNG quality —
 * a small bias in the split can't be exploited to force 大吉.
 */
export function drawOmikuji(): OmikujiTier {
  let roll = Math.random() * TOTAL_WEIGHT;
  for (const tier of OMIKUJI_TIERS) {
    roll -= WEIGHTS[tier];
    if (roll < 0) return tier;
  }
  return "kichi"; // unreachable (weights sum to TOTAL_WEIGHT); satisfies the type
}

/**
 * Which of a tier's fortune variations to show, derived from the tip id so it's
 * stable across re-fetches without persisting an extra column.
 */
export function fortuneIndex(tipId: string, count: number): number {
  let hash = 0;
  for (let i = 0; i < tipId.length; i += 1) hash = (hash * 31 + tipId.charCodeAt(i)) >>> 0;
  return count > 0 ? hash % count : 0;
}
