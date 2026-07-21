const TOKYO_OFFSET_MS = 9 * 60 * 60 * 1000;

/**
 * Start of the given instant's Asia/Tokyo calendar day, as a UTC Date.
 * Stores read their numbers in JST, so "today" must not follow the server's zone.
 */
export function startOfTokyoDay(instant: Date = new Date()): Date {
  const shifted = new Date(instant.getTime() + TOKYO_OFFSET_MS);
  const midnightShifted = Date.UTC(
    shifted.getUTCFullYear(),
    shifted.getUTCMonth(),
    shifted.getUTCDate(),
  );
  return new Date(midnightShifted - TOKYO_OFFSET_MS);
}

/** Start of the Tokyo day `days` days before today. */
export function startOfTokyoDaysAgo(days: number, instant: Date = new Date()): Date {
  const start = startOfTokyoDay(instant);
  return new Date(start.getTime() - days * 24 * 60 * 60 * 1000);
}

export function formatYen(amount: number): string {
  return `¥${amount.toLocaleString("ja-JP")}`;
}

export function formatTokyoTime(value: Date | string): string {
  return new Date(value).toLocaleString("ja-JP", {
    timeZone: "Asia/Tokyo",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}
