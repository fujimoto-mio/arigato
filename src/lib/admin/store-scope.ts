import { cookies } from "next/headers";
import { ACTIVE_STORE_COOKIE, ALL_STORES } from "@/lib/admin/store-constants";
import { prisma } from "@/lib/prisma";

export { ACTIVE_STORE_COOKIE, ALL_STORES };

export type AdminStore = {
  id: string;
  slug: string;
  name: string;
  logoUrl: string | null;
  googlePlaceId: string | null;
  instagramUrl: string | null;
  facebookUrl: string | null;
};

const STORE_SELECT = {
  id: true,
  slug: true,
  name: true,
  logoUrl: true,
  googlePlaceId: true,
  instagramUrl: true,
  facebookUrl: true,
} as const;

/** Every store, ordered by name — the switcher list and all-stores aggregate. */
export async function getAllStores(): Promise<AdminStore[]> {
  return prisma.store.findMany({ select: STORE_SELECT, orderBy: { name: "asc" } });
}

/** One store by id (any admin manages any store); null if it doesn't exist. */
export async function getStore(storeId: string): Promise<AdminStore | null> {
  return prisma.store.findUnique({ where: { id: storeId }, select: STORE_SELECT });
}

export type ActiveStore = {
  /** The active store's id, or null for the all-stores view. */
  activeStoreId: string | null;
  /** The active store, or null for the all-stores view. */
  activeStore: AdminStore | null;
  /** Every store (for the switcher dropdown). */
  stores: AdminStore[];
};

/**
 * Resolve the store the admin is currently viewing from the switcher cookie.
 * A single admin manages every store; a missing cookie, "all", or a stale id all
 * resolve to the all-stores view (`activeStoreId: null`), where the dashboard
 * aggregates across every store.
 */
export async function getActiveStore(): Promise<ActiveStore> {
  const cookieStore = await cookies();
  const raw = cookieStore.get(ACTIVE_STORE_COOKIE)?.value;
  const stores = await getAllStores();
  const activeStore = raw && raw !== ALL_STORES ? (stores.find((s) => s.id === raw) ?? null) : null;
  return { activeStoreId: activeStore?.id ?? null, activeStore, stores };
}

/**
 * Prisma `where` fragment scoping a query to the active store, or to every store
 * when null (the all-stores view). Spread into a where clause:
 * `where: { ...storeScope(activeStoreId), status: "succeeded" }`.
 */
export function storeScope(activeStoreId: string | null): { storeId?: string } {
  return activeStoreId ? { storeId: activeStoreId } : {};
}
