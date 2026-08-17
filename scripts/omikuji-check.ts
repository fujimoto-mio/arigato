import assert from "node:assert";
import {
  OMIKUJI_MIN_AMOUNT,
  drawOmikuji,
  isOmikujiEligible,
  omikujiWinsPrize,
} from "@/lib/omikuji";

// Eligibility boundary.
assert(!isOmikujiEligible(OMIKUJI_MIN_AMOUNT - 1), "below threshold must be ineligible");
assert(isOmikujiEligible(OMIKUJI_MIN_AMOUNT), "exactly threshold must be eligible");

// Only 大吉 wins a prize.
assert(omikujiWinsPrize("daikichi"), "daikichi wins");
assert(!omikujiWinsPrize("chukichi") && !omikujiWinsPrize("kichi"), "others do not win");

// Distribution: every tier reachable, and daikichi is the rarest (weights 5/25/70).
const counts: Record<string, number> = { daikichi: 0, chukichi: 0, kichi: 0 };
for (let i = 0; i < 50_000; i++) counts[drawOmikuji()]++;
assert(counts.daikichi > 0 && counts.chukichi > 0 && counts.kichi > 0, "all tiers must appear");
assert(counts.daikichi < counts.chukichi && counts.chukichi < counts.kichi, "odds order 大<中<吉");

console.log("omikuji-check OK", counts);
