/**
 * Skeleton shown while any admin page's server data loads. Lives at the
 * (dashboard) route-group level, so it renders inside the persistent sidebar/
 * header for every admin page during navigation.
 */
export default function Loading() {
  return (
    <div className="flex animate-pulse flex-col gap-6" aria-hidden="true">
      {/* No title placeholder — static headings shouldn't be skeletonised. */}

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-2xl border border-neutral-200 bg-white p-4">
            <div className="flex items-center justify-between">
              <div className="h-3 w-16 rounded bg-neutral-200" />
              <div className="h-7 w-7 rounded-full bg-neutral-200" />
            </div>
            <div className="mt-3 h-6 w-20 rounded bg-neutral-200" />
          </div>
        ))}
      </div>

      {/* Content block (table / chart / list) */}
      <div className="rounded-2xl border border-neutral-200 bg-white p-4">
        <div className="flex flex-col gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-11 rounded-lg bg-neutral-100" />
          ))}
        </div>
      </div>
    </div>
  );
}
