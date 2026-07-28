import { redirect } from "next/navigation";
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
};

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

  return {
    supabaseUserId: user.id,
    adminUserId: admin.id,
    email: admin.email,
    role: admin.role,
  };
}

/** Server-component guard: redirects to the login screen when not an admin. */
export async function requireAdmin(): Promise<AdminContext> {
  const context = await getAdminContext();
  if (!context) redirect("/admin/login");
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
