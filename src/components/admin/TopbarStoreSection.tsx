"use client";

import { usePathname } from "next/navigation";
import { StoreSwitcher } from "@/components/admin/StoreSwitcher";
import type { AdminStore } from "@/lib/admin/store-scope";

// Pages that aren't tied to a single store — hide the switcher / store name here.
const HIDDEN_PREFIXES = ["/admin/help", "/admin/support", "/admin/announcements"];

/**
 * Top-bar store control: the switcher for a platform admin, the locked store name
 * for an operator — hidden on cross-store pages (help / support / announcements).
 */
export function TopbarStoreSection({
  canSwitch,
  stores,
  activeStoreId,
  storeName,
  storeCoverImageUrl,
}: {
  canSwitch: boolean;
  stores: AdminStore[];
  activeStoreId: string | null;
  storeName: string | null;
  storeCoverImageUrl: string | null;
}) {
  const pathname = usePathname();
  if (HIDDEN_PREFIXES.some((p) => pathname.startsWith(p))) return null;

  if (canSwitch) return <StoreSwitcher stores={stores} activeStoreId={activeStoreId} />;

  return (
    <span className="flex items-center gap-2 truncate text-sm font-semibold text-neutral-900">
      <span className="relative h-7 w-7 shrink-0 overflow-hidden rounded-md bg-neutral-100">
        {storeCoverImageUrl ? (
          // Store intro image; plain img avoids remote-loader config.
          // eslint-disable-next-line @next/next/no-img-element
          <img src={storeCoverImageUrl} alt="" className="h-full w-full object-cover" />
        ) : (
          <span className="flex h-full w-full items-center justify-center bg-[var(--color-accent)]/10 text-[10px] font-bold text-[var(--color-accent)]">
            {storeName?.slice(0, 2) ?? "—"}
          </span>
        )}
      </span>
      <span className="truncate">{storeName ?? "店舗"}</span>
    </span>
  );
}
