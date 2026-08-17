/**
 * Omikuji (fortune draw) shown after a tip of OMIKUJI_MIN_AMOUNT or more.
 * 大吉 wins a prize, 中吉 may win a small one, 吉 wins none. The draw is done
 * server-side and recorded on the Tip (see /api/omikuji/draw) so it can't be
 * re-rolled and the store can verify a winner before handing over a prize.
 *
 * This module is import-safe on the client (no node-only imports), so the guest
 * flow can share the threshold and tier types.
 */
export const OMIKUJI_TIERS = ["daikichi", "chukichi", "kichi"] as const;
export type OmikujiTier = (typeof OMIKUJI_TIERS)[number];

// Minimum tip that earns an omikuji draw. Edit OMIKUJI_MIN_DOLLARS to change it.
export const OMIKUJI_MIN_DOLLARS = 5;
export const OMIKUJI_MIN_AMOUNT = OMIKUJI_MIN_DOLLARS * 100; // cents (Stripe/USD)

// Draw odds out of 100. The client set the tiers but not the odds — tune freely.
// ponytail: flat table, revisit only if per-store odds are ever needed.
const WEIGHTS: Record<OmikujiTier, number> = {
  daikichi: 5,
  chukichi: 25,
  kichi: 70,
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
 * a small bias in a 5/25/70 split can't be exploited to force 大吉.
 */
export function drawOmikuji(): OmikujiTier {
  let roll = Math.random() * TOTAL_WEIGHT;
  for (const tier of OMIKUJI_TIERS) {
    roll -= WEIGHTS[tier];
    if (roll < 0) return tier;
  }
  return "kichi"; // unreachable (weights sum to TOTAL_WEIGHT); satisfies the type
}
