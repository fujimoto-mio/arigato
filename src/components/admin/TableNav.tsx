"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { createContext, type ReactNode, useContext, useTransition } from "react";

type TableNav = { isPending: boolean; navigate: (url: string) => void };

const TableNavContext = createContext<TableNav | null>(null);

/**
 * Shares one navigation transition between a table's toolbar and its pager so a
 * search/filter/page change keeps the current rows on screen (with a spinner
 * overlay) until the server sends the next page — instead of blanking the table.
 */
export function TableNavProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  function navigate(url: string) {
    startTransition(() => router.push(url));
  }
  return <TableNavContext.Provider value={{ isPending, navigate }}>{children}</TableNavContext.Provider>;
}

export function useTableNav() {
  return useContext(TableNavContext);
}

/**
 * Table body that swaps the data rows for a centered spinner row while a page
 * loads, so the header and pagination stay put but the rows clear out.
 */
export function TableBody({ colSpan, children }: { colSpan: number; children: ReactNode }) {
  const nav = useContext(TableNavContext);
  if (nav?.isPending) {
    return (
      <tbody>
        <tr>
          <td colSpan={colSpan} className="py-20">
            <div className="flex flex-col items-center justify-center gap-3">
              <svg
                className="h-8 w-8 animate-spin text-[var(--color-accent)]"
                viewBox="0 0 24 24"
                fill="none"
                role="status"
                aria-label="読み込み中"
              >
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-90" fill="currentColor" d="M4 12a8 8 0 0 1 8-8V0C5.37 0 0 5.37 0 12h4z" />
              </svg>
              <p className="text-sm text-neutral-500">読み込み中…</p>
            </div>
          </td>
        </tr>
      </tbody>
    );
  }
  return <tbody>{children}</tbody>;
}

/**
 * Non-table version of TableBody: swaps arbitrary children (e.g. a card list)
 * for a centered spinner while a page loads. Wrap the list, keep any header /
 * pagination outside so they stay visible.
 */
export function PendingSwap({ children }: { children: ReactNode }) {
  const nav = useContext(TableNavContext);
  if (nav?.isPending) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-neutral-200 bg-white py-20">
        <svg
          className="h-8 w-8 animate-spin text-[var(--color-accent)]"
          viewBox="0 0 24 24"
          fill="none"
          role="status"
          aria-label="読み込み中"
        >
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-90" fill="currentColor" d="M4 12a8 8 0 0 1 8-8V0C5.37 0 0 5.37 0 12h4z" />
        </svg>
        <p className="text-sm text-neutral-500">読み込み中…</p>
      </div>
    );
  }
  return <>{children}</>;
}

/** Pagination button: navigates through the shared transition when available. */
export function TablePager({ href, disabled, label }: { href: string; disabled: boolean; label: string }) {
  const nav = useContext(TableNavContext);
  const base = "rounded-full border px-4 py-1.5 text-sm font-medium transition";

  if (disabled) {
    return <span className={`${base} border-neutral-200 text-neutral-300`}>{label}</span>;
  }
  const enabled = `${base} border-neutral-300 text-neutral-700 hover:bg-neutral-100`;
  if (nav) {
    return (
      <button type="button" onClick={() => nav.navigate(href)} className={enabled}>
        {label}
      </button>
    );
  }
  return (
    <Link href={href} className={enabled}>
      {label}
    </Link>
  );
}
