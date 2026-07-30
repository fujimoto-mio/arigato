const TOKYO_OFFSET_MS = 9 * 60 * 60 * 1000;

/**
 * Start of the given instant's Asia/Tokyo calendar day.
 *
 * The Prisma connection is pinned to the Asia/Tokyo session (see @/lib/prisma),
 * so a stored timestamptz comes back as a JS Date whose UTC components are the
 * JST wall-clock. To stay in that same space, this returns JST midnight encoded
 * in UTC components — Prisma writes it back so the DB comparison lands on the
 * true JST day boundary. Display helpers read these Dates with timeZone "UTC".
 */
export function startOfTokyoDay(instant: Date = new Date()): Date {
  const shifted = new Date(instant.getTime() + TOKYO_OFFSET_MS);
  return new Date(
    Date.UTC(shifted.getUTCFullYear(), shifted.getUTCMonth(), shifted.getUTCDate()),
  );
}

/** Start of the Tokyo day `days` days before today. */
export function startOfTokyoDaysAgo(days: number, instant: Date = new Date()): Date {
  const start = startOfTokyoDay(instant);
  return new Date(start.getTime() - days * 24 * 60 * 60 * 1000);
}

/**
 * Format a USD-cents amount as dollars (e.g. 500 → "$5", 150 → "$1.5").
 * A zero amount renders as an em dash — admin surfaces show "—" for $0 tips
 * (review-only) and empty totals rather than "$0".
 */
export function formatUsd(cents: number): string {
  if (cents === 0) return "—";
  return `$${(cents / 100).toLocaleString("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`;
}

export function formatTokyoTime(value: Date | string): string {
  // The Date already carries the JST wall-clock in its UTC components (the
  // connection is pinned to Asia/Tokyo), so read it out with timeZone "UTC" —
  // converting again would double-count the +9 offset.
  return new Date(value).toLocaleString("ja-JP", {
    timeZone: "UTC",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}
