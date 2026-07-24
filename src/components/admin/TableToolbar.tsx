"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { useTableNav } from "@/components/admin/TableNav";

export type FilterDef = {
  /** URL query param this select drives. */
  param: string;
  /** Accessible label (also the "all" option usually encodes it). */
  label: string;
  options: { value: string; label: string }[];
};

/**
 * Search + filter bar for server-paginated tables. Every change rewrites the
 * URL query string (resetting to page 1); the page re-fetches server-side and
 * DataTable preserves these params across its pagination links.
 */
export function TableToolbar({
  searchParam,
  searchPlaceholder,
  filters = [],
}: {
  searchParam?: string;
  searchPlaceholder?: string;
  filters?: FilterDef[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();
  const nav = useTableNav();
  const urlTerm = searchParam ? (sp.get(searchParam) ?? "") : "";
  const [term, setTerm] = useState(urlTerm);

  // Re-sync the input when the URL param changes elsewhere (back button, clear)
  // by adjusting state during render — React's recommended alternative to an
  // effect for deriving state from props.
  const [lastUrlTerm, setLastUrlTerm] = useState(urlTerm);
  if (urlTerm !== lastUrlTerm) {
    setLastUrlTerm(urlTerm);
    setTerm(urlTerm);
  }

  function navigate(next: Record<string, string>) {
    const params = new URLSearchParams(sp.toString());
    for (const [key, value] of Object.entries(next)) {
      if (value) params.set(key, value);
      else params.delete(key);
    }
    params.delete("page"); // any search/filter change returns to the first page
    const qs = params.toString();
    const url = qs ? `${pathname}?${qs}` : pathname;
    // Prefer the shared table transition (drives the spinner overlay); fall back
    // to a plain push if this toolbar is used outside a TableNavProvider.
    if (nav) nav.navigate(url);
    else router.push(url);
  }

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      {searchParam ? (
        <form
          onSubmit={(event) => {
            event.preventDefault();
            navigate({ [searchParam]: term.trim() });
          }}
          className="flex flex-1 items-center gap-2 sm:max-w-md"
        >
          <div className="relative flex-1">
            <svg
              viewBox="0 0 24 24"
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <circle cx="11" cy="11" r="7" />
              <path d="M21 21l-4.3-4.3" />
            </svg>
            <input
              value={term}
              onChange={(event) => setTerm(event.target.value)}
              placeholder={searchPlaceholder ?? "検索"}
              className="w-full rounded-full border border-neutral-300 py-2 pl-9 pr-8 text-sm focus:border-[var(--color-accent)] focus:outline-none"
            />
            {term ? (
              <button
                type="button"
                onClick={() => {
                  setTerm("");
                  navigate({ [searchParam]: "" });
                }}
                aria-label="検索をクリア"
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-1 text-neutral-400 hover:text-neutral-700"
              >
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M6 6l12 12M18 6L6 18" />
                </svg>
              </button>
            ) : null}
          </div>
          <button
            type="submit"
            className="shrink-0 rounded-full bg-neutral-900 px-4 py-2 text-sm font-medium text-white"
          >
            検索
          </button>
        </form>
      ) : null}

      {filters.length > 0 ? (
        <div className="flex flex-wrap items-center gap-2">
          {filters.map((filter) => (
            <div key={filter.param} className="relative">
              <select
                value={sp.get(filter.param) ?? ""}
                onChange={(event) => navigate({ [filter.param]: event.target.value })}
                aria-label={filter.label}
                className="appearance-none rounded-full border border-neutral-300 py-2 pl-4 pr-9 text-sm focus:border-[var(--color-accent)] focus:outline-none"
              >
                {filter.options.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <svg
                viewBox="0 0 24 24"
                className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-500"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M6 9l6 6 6-6" />
              </svg>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
