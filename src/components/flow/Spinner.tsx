/** Small spinning circle shown inside submit buttons while an action is running. */
export function Spinner({ className = "" }: { className?: string }) {
  return (
    <span
      role="status"
      aria-label="loading"
      className={`inline-block h-5 w-5 shrink-0 animate-spin rounded-full border-2 border-white/40 border-t-white ${className}`}
    />
  );
}
