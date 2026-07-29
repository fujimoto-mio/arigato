"use client";

import { Store as StoreIcon } from "lucide-react";
import { usePathname } from "next/navigation";
import { Select, type SelectOption } from "@/components/admin/Select";
import { useStoreSwitch } from "@/components/admin/StoreSwitch";
import { ALL_STORES } from "@/lib/admin/store-constants";

type StoreOption = { id: string; name: string };

// Pages that aren't scoped to a single store, so the switcher is hidden there:
// Store Management edits stores directly, and Settings is account/device-level.
const HIDDEN_PREFIXES = ["/admin/stores", "/admin/settings"];

/**
 * Top-bar store selector. Defaults to "すべての店舗" (all stores); picking a store
 * writes the switcher cookie and refreshes so every page re-scopes to it. A
 * single admin manages every store, so this is the only store-context control —
 * and the only select with search, since the store list can grow long.
 */
export function StoreSwitcher({
  stores,
  activeStoreId,
}: {
  stores: StoreOption[];
  activeStoreId: string | null;
}) {
  const pathname = usePathname();
  const { isSwitching, switchStore } = useStoreSwitch();

  if (HIDDEN_PREFIXES.some((prefix) => pathname.startsWith(prefix))) return null;

  const options: SelectOption[] = [
    { value: ALL_STORES, label: "すべて" },
    ...stores.map((store) => ({ value: store.id, label: store.name })),
  ];

  return (
    <div className="flex min-w-0 items-center gap-3">
      <span className="flex shrink-0 items-center gap-1.5 text-sm font-medium text-neutral-500">
        <StoreIcon className="h-4 w-4 text-[var(--color-accent)]" strokeWidth={1.9} />
        <span className="hidden sm:inline">店舗</span>
      </span>
      <Select
        value={activeStoreId ?? ALL_STORES}
        options={options}
        searchable
        disabled={isSwitching}
        ariaLabel="店舗を選択"
        searchPlaceholder="店舗名で検索…"
        className="min-w-[10rem] max-w-[46vw] sm:min-w-[13rem] sm:max-w-[18rem]"
        onChange={(value) => switchStore(value)}
      />
    </div>
  );
}
