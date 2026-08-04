import { cookies } from "next/headers";
import { getAdminContext } from "@/lib/admin/auth";
import { ACTIVE_STORE_COOKIE, ALL_STORES } from "@/lib/admin/store-constants";
import { prisma } from "@/lib/prisma";

export { ACTIVE_STORE_COOKIE, ALL_STORES };

export type AdminStore = {
  id: string;
  slug: string;
  name: string;
  coverImageUrl: string | null;
  googlePlaceId: string | null;
  instagramUrl: string | null;
  facebookUrl: string | null;
  companyName: string | null;
  contactName: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  status: "pending" | "active" | "suspended" | "deleted";
};

const STORE_SELECT = {
  id: true,
  slug: true,
  name: true,
  coverImageUrl: true,
  googlePlaceId: true,
  instagramUrl: true,
  facebookUrl: true,
  companyName: true,
  contactName: true,
  phone: true,
  email: true,
  address: true,
  status: true,
} as const;

/** Every live store, ordered by name — the switcher list and all-stores aggregate. */
export async function getAllStores(): Promise<AdminStore[]> {
  return prisma.store.findMany({ where: { deletedAt: null }, select: STORE_SELECT, orderBy: { name: "asc" } });
}

/** One live store by id; null if it doesn't exist or has been soft-deleted. */
export async function getStore(storeId: string): Promise<AdminStore | null> {
  return prisma.store.findFirst({ where: { id: storeId, deletedAt: null }, select: STORE_SELECT });
}

export type ActiveStore = {
  /** The active store's id, or null for the all-stores view. */
  activeStoreId: string | null;
  /** The active store, or null for the all-stores view. */
  activeStore: AdminStore | null;
  /** Stores selectable in the switcher (every store for admin; just theirs for an operator). */
  stores: AdminStore[];
  /** False for a store operator (locked to one store) — hides the switcher. */
  canSwitch: boolean;
};

/**
 * Resolve the store the admin is viewing.
 *
 * Platform admin: from the top-bar switcher cookie — a missing cookie, "all", or
 * a stale id all resolve to the all-stores view (`activeStoreId: null`), where
 * the dashboard aggregates across every store.
 *
 * Store operator: always locked to their own store — the cookie is ignored, so
 * every query built from this is scoped to their store and cannot leak others'.
 */
export async function getActiveStore(): Promise<ActiveStore> {
  const admin = await getAdminContext();

  // Store operator — hard-scoped to their one store, no switching.
  if (admin && !admin.isPlatformAdmin && admin.storeId) {
    const store = await getStore(admin.storeId);
    const stores = store ? [store] : [];
    return { activeStoreId: store?.id ?? null, activeStore: store, stores, canSwitch: false };
  }

  // Platform admin — switcher across every store.
  const cookieStore = await cookies();
  const raw = cookieStore.get(ACTIVE_STORE_COOKIE)?.value;
  const stores = await getAllStores();
  const activeStore = raw && raw !== ALL_STORES ? (stores.find((s) => s.id === raw) ?? null) : null;
  return { activeStoreId: activeStore?.id ?? null, activeStore, stores, canSwitch: true };
}

/**
 * Prisma `where` fragment scoping a query to the active store, or to every store
 * when null (the all-stores view). Spread into a where clause:
 * `where: { ...storeScope(activeStoreId), status: "succeeded" }`.
 */
export function storeScope(activeStoreId: string | null): { storeId?: string } {
  return activeStoreId ? { storeId: activeStoreId } : {};
}
