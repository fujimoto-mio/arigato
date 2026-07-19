"use client";

const STARS = [1, 2, 3, 4, 5] as const;

export function StarRating({ value, onChange }: { value: number; onChange: (value: number) => void }) {
  return (
    <div className="flex justify-center gap-2">
      {STARS.map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onChange(star)}
          aria-label={`${star} star`}
          aria-pressed={star <= value}
          className="text-4xl leading-none"
        >
          <span className={star <= value ? "text-amber-400" : "text-neutral-300"}>★</span>
        </button>
      ))}
    </div>
  );
}
