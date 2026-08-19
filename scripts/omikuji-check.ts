import assert from "node:assert";
import {
  OMIKUJI_MIN_AMOUNT,
  OMIKUJI_TIERS,
  drawOmikuji,
  fortuneIndex,
  isOmikujiEligible,
  omikujiWinsPrize,
} from "@/lib/omikuji";
import { FORTUNES, OMIKUJI_LABEL_EN } from "@/lib/omikuji-fortunes";

// Eligibility boundary.
assert(!isOmikujiEligible(OMIKUJI_MIN_AMOUNT - 1), "below threshold must be ineligible");
assert(isOmikujiEligible(OMIKUJI_MIN_AMOUNT), "exactly threshold must be eligible");

// Only 大吉 wins a prize.
assert(omikujiWinsPrize("daikichi"), "daikichi wins");
assert(!omikujiWinsPrize("chukichi") && !omikujiWinsPrize("suekichi"), "others do not win");

// Every tier has exactly 3 fortune variations and a blessing label.
for (const tier of OMIKUJI_TIERS) {
  assert(FORTUNES[tier].length === 3, `${tier} must have 3 fortunes`);
  assert(OMIKUJI_LABEL_EN[tier], `${tier} must have an English label`);
}

// fortuneIndex is stable and in range.
assert(fortuneIndex("abc", 3) === fortuneIndex("abc", 3), "index must be stable");
assert(fortuneIndex("abc", 3) < 3, "index must be in range");

// Distribution: every tier reachable, and daikichi is rare.
const counts: Record<string, number> = Object.fromEntries(OMIKUJI_TIERS.map((t) => [t, 0]));
for (let i = 0; i < 50_000; i++) counts[drawOmikuji()]++;
for (const tier of OMIKUJI_TIERS) assert(counts[tier] > 0, `${tier} must appear`);
assert(counts.daikichi < counts.kichi, "大吉 must be rarer than 吉");

console.log("omikuji-check OK", counts);
