"use client";

import { Store as StoreIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { Select, type SelectOption } from "@/components/admin/Select";
import { setActiveStore } from "@/lib/admin/store-actions";
import { ALL_STORES } from "@/lib/admin/store-constants";

type StoreOption = { id: string; name: string };

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
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const options: SelectOption[] = [
    { value: ALL_STORES, label: "すべて" },
    ...stores.map((store) => ({ value: store.id, label: store.name })),
  ];

  return (
    <div className="flex min-w-0 items-center gap-2">
      <span className="flex shrink-0 items-center gap-1.5 text-sm font-medium text-neutral-500">
        <StoreIcon className="h-4 w-4 text-[var(--color-accent)]" strokeWidth={1.9} />
        <span className="hidden sm:inline">店舗</span>
      </span>
      <Select
        value={activeStoreId ?? ALL_STORES}
        options={options}
        searchable
        disabled={pending}
        ariaLabel="店舗を選択"
        searchPlaceholder="店舗名で検索…"
        className="max-w-[46vw] sm:max-w-[16rem]"
        onChange={(value) => {
          startTransition(async () => {
            await setActiveStore(value);
            router.refresh();
          });
        }}
      />
    </div>
  );
}
