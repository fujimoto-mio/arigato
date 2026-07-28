"use client";

import { Store as StoreIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { setActiveStore } from "@/lib/admin/store-actions";
import { ALL_STORES } from "@/lib/admin/store-constants";

type StoreOption = { id: string; name: string };

/**
 * Top-bar store selector. Defaults to "すべての店舗" (all stores); picking a store
 * writes the switcher cookie and refreshes so every page re-scopes to it. A
 * single admin manages every store, so this is the only store-context control.
 * Matches the admin's standard select style (see ReportRangeSelect / TableToolbar).
 */
export function StoreSwitcher({
  stores,
  activeStoreId,
}: {
  stores: StoreOption[];
  activeStoreId: string | null;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <div className="flex min-w-0 items-center gap-2">
      <span className="flex shrink-0 items-center gap-1.5 text-sm font-medium text-neutral-500">
        <StoreIcon className="h-4 w-4 text-[var(--color-accent)]" strokeWidth={1.9} />
        <span className="hidden sm:inline">店舗</span>
      </span>
      <div className="relative min-w-0">
        <select
          value={activeStoreId ?? ALL_STORES}
          disabled={pending || stores.length === 0}
          aria-label="店舗を選択"
          onChange={(event) => {
            const value = event.target.value;
            startTransition(async () => {
              await setActiveStore(value);
              router.refresh();
            });
          }}
          className="block w-full max-w-[46vw] cursor-pointer appearance-none truncate rounded-full border border-neutral-300 py-2 pl-4 pr-9 text-sm font-semibold text-neutral-900 focus:border-[var(--color-accent)] focus:outline-none disabled:opacity-60 sm:max-w-[16rem]"
        >
          <option value={ALL_STORES}>すべての店舗</option>
          {stores.map((store) => (
            <option key={store.id} value={store.id}>
              {store.name}
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
    </div>
  );
}
