"use client";

import { useRouter } from "next/navigation";
import { createContext, type ReactNode, useContext, useTransition } from "react";
import { setActiveStore } from "@/lib/admin/store-actions";

type StoreSwitchValue = { isSwitching: boolean; switchStore: (value: string) => void };

const StoreSwitchContext = createContext<StoreSwitchValue | null>(null);

/**
 * Shares one "switching store" transition between the top-bar switcher and the
 * page content, so changing stores shows the loading skeleton (like a fresh
 * load) while the new store's data is fetched via router.refresh().
 */
export function StoreSwitchProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [isSwitching, startTransition] = useTransition();

  function switchStore(value: string) {
    startTransition(async () => {
      await setActiveStore(value);
      router.refresh();
    });
  }

  return (
    <StoreSwitchContext.Provider value={{ isSwitching, switchStore }}>{children}</StoreSwitchContext.Provider>
  );
}

export function useStoreSwitch(): StoreSwitchValue {
  const context = useContext(StoreSwitchContext);
  if (!context) throw new Error("useStoreSwitch must be used within StoreSwitchProvider");
  return context;
}

/** Swaps the page content for a skeleton while a store switch is loading. */
export function StoreSwitchContent({ children }: { children: ReactNode }) {
  const { isSwitching } = useStoreSwitch();
  return isSwitching ? <SwitchSkeleton /> : <>{children}</>;
}

// Mirrors the (dashboard)/loading.tsx skeleton so a store switch feels like a
// first load.
function SwitchSkeleton() {
  return (
    <div className="flex animate-pulse flex-col gap-6" aria-hidden="true">
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
