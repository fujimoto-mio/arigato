const TOKYO_OFFSET_MS = 9 * 60 * 60 * 1000;

/**
 * Timestamps are stored as JST (GMT+9) wall-clock in the DB (naive `timestamp`),
 * so Prisma reads a Date whose UTC components already hold the JST time. These
 * helpers therefore work in that "naive JST" space:
 *  - display: format the UTC components as-is (timeZone: "UTC").
 *  - boundaries: return the JST-day midnight as a naive-JST Date, which lines up
 *    with the stored values for comparisons and filters.
 */

/** Start of the current Asia/Tokyo (JST) calendar day, as a naive-JST Date. */
export function startOfTokyoDay(instant: Date = new Date()): Date {
  // `instant` is a real UTC moment; shift to the JST wall-clock, then take its
  // date at midnight (kept as naive-JST, i.e. no offset subtracted back off).
  const shifted = new Date(instant.getTime() + TOKYO_OFFSET_MS);
  return new Date(Date.UTC(shifted.getUTCFullYear(), shifted.getUTCMonth(), shifted.getUTCDate()));
}

/** Start of the Tokyo day `days` days before today (JST has no DST → fixed 24h). */
export function startOfTokyoDaysAgo(days: number, instant: Date = new Date()): Date {
  const start = startOfTokyoDay(instant);
  return new Date(start.getTime() - days * 24 * 60 * 60 * 1000);
}

export function formatYen(amount: number): string {
  return `¥${amount.toLocaleString("ja-JP")}`;
}

// Fixed reference rate for the dashboard's ≈USD hint (the mockup shows ¥2,000 ≈
// $13.50). Display-only — not used for any charge — so a static rate is fine.
const JPY_PER_USD = 150;

export function formatUsdApprox(yen: number): string {
  return `≈ $${(yen / JPY_PER_USD).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function formatTokyoTime(value: Date | string): string {
  // Stored value is already JST wall-clock (naive) — show its UTC components.
  return new Date(value).toLocaleString("ja-JP", {
    timeZone: "UTC",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}
