/** Gold star rating display used across the admin panel. */
export function Stars({ rating }: { rating: number }) {
  const rounded = Math.round(rating);
  return (
    <span aria-label={`${rating} / 5`} className="whitespace-nowrap text-[var(--color-accent)]">
      {"★".repeat(rounded)}
      <span className="text-neutral-300">{"★".repeat(Math.max(0, 5 - rounded))}</span>
    </span>
  );
}
