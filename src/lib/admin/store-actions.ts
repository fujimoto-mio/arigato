"use server";

import { cookies } from "next/headers";
import { ACTIVE_STORE_COOKIE, ALL_STORES } from "@/lib/admin/store-constants";

/**
 * Remember the store the admin picked in the top-bar switcher. Called from the
 * client `StoreSwitcher`; the value is a store id or "all". Path "/" so both the
 * admin pages and the `/api/admin/*` routes read the same selection.
 */
export async function setActiveStore(value: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(ACTIVE_STORE_COOKIE, value || ALL_STORES, {
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 365,
  });
}
