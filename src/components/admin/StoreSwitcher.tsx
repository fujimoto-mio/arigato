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
    <label className="relative flex min-w-0 items-center gap-2 rounded-full border border-neutral-200 bg-white pl-3 pr-2 shadow-sm">
      <StoreIcon className="h-4 w-4 shrink-0 text-[var(--color-accent)]" strokeWidth={1.9} />
      <span className="sr-only">店舗を選択</span>
      <select
        value={activeStoreId ?? ALL_STORES}
        disabled={pending || stores.length === 0}
        onChange={(event) => {
          const value = event.target.value;
          startTransition(async () => {
            await setActiveStore(value);
            router.refresh();
          });
        }}
        className="min-w-0 max-w-[42vw] cursor-pointer appearance-none truncate bg-transparent py-2 pr-5 text-sm font-semibold text-neutral-900 outline-none disabled:opacity-60 sm:max-w-[16rem]"
      >
        <option value={ALL_STORES}>すべての店舗</option>
        {stores.map((store) => (
          <option key={store.id} value={store.id}>
            {store.name}
          </option>
        ))}
      </select>
      {/* Chevron */}
      <svg
        viewBox="0 0 24 24"
        className="pointer-events-none absolute right-2.5 h-4 w-4 text-neutral-400"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M6 9l6 6 6-6" />
      </svg>
    </label>
  );
}
