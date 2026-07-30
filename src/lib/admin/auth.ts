import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { createSupabaseSessionClient } from "@/lib/supabase/session";

/**
 * The signed-in admin. A single admin manages every store, so the context is no
 * longer bound to one store — the active store comes from the top-bar switcher
 * (see `@/lib/admin/store-scope`).
 */
export type AdminContext = {
  supabaseUserId: string;
  adminUserId: string;
  email: string;
  role: string;
  /** Set only for store operators — the one store they manage. */
  storeId: string | null;
  /** True for the platform admin (manages every store); false for a store operator. */
  isPlatformAdmin: boolean;
};

/** A store operator is scoped to one store; everyone else is a platform admin. */
export function isStoreOperator(role: string, storeId: string | null): boolean {
  return role === "store_operator" && storeId != null;
}

/**
 * Resolve the signed-in Supabase user to their AdminUser row.
 * Returns null when there is no session, or when the user is authenticated with
 * Supabase but has no AdminUser row (not provisioned as an admin).
 */
export async function getAdminContext(): Promise<AdminContext | null> {
  const supabase = await createSupabaseSessionClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const admin = await prisma.adminUser.findUnique({
    where: { supabaseUserId: user.id },
  });

  if (!admin) return null;

  const operator = isStoreOperator(admin.role, admin.storeId);
  return {
    supabaseUserId: user.id,
    adminUserId: admin.id,
    email: admin.email,
    role: admin.role,
    storeId: admin.storeId,
    isPlatformAdmin: !operator,
  };
}

/** Server-component guard: redirects to the login screen when not an admin. */
export async function requireAdmin(): Promise<AdminContext> {
  const context = await getAdminContext();
  if (!context) redirect("/admin/login");
  return context;
}

/**
 * Guard for platform-admin-only pages (store management: list / create / delete /
 * suspend). Store operators are bounced to their dashboard.
 */
export async function requirePlatformAdmin(): Promise<AdminContext> {
  const context = await requireAdmin();
  if (!context.isPlatformAdmin) redirect("/admin");
  return context;
}

/**
 * Guard for a specific store's pages. The platform admin may manage any store; a
 * store operator may only touch their own — anything else is a 404 (never reveal
 * another store exists).
 */
export async function requireStoreAccess(storeId: string): Promise<AdminContext> {
  const context = await requireAdmin();
  if (!context.isPlatformAdmin && context.storeId !== storeId) notFound();
  return context;
}

/** Route-handler guard: returns a 401 response instead of redirecting. */
export async function requireAdminApi() {
  const context = await getAdminContext();
  if (!context) {
    return { context: null as null, error: Response.json({ error: "unauthorized" }, { status: 401 }) };
  }
  return { context, error: null as null };
}

/** Route-handler guard for platform-admin-only actions (create/delete/suspend stores). */
export async function requirePlatformAdminApi() {
  const { context, error } = await requireAdminApi();
  if (error) return { context: null as null, error };
  if (!context.isPlatformAdmin) {
    return { context: null as null, error: Response.json({ error: "forbidden" }, { status: 403 }) };
  }
  return { context, error: null as null };
}

/** Route-handler guard for a specific store: admin → any; operator → only theirs. */
export async function requireStoreAccessApi(storeId: string) {
  const { context, error } = await requireAdminApi();
  if (error) return { context: null as null, error };
  if (!context.isPlatformAdmin && context.storeId !== storeId) {
    return { context: null as null, error: Response.json({ error: "forbidden" }, { status: 403 }) };
  }
  return { context, error: null as null };
}
