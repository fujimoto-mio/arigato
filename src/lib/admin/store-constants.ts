/**
 * Plain constants shared by client and server code around the store switcher.
 * Kept free of server-only imports (Prisma, next/headers) so the client bundle
 * can import them without pulling the database adapter in.
 */

/** Cookie the top-bar switcher writes to remember the active store. */
export const ACTIVE_STORE_COOKIE = "arigato_active_store";

/** Switcher value / cookie value meaning "show every store". */
export const ALL_STORES = "all";
