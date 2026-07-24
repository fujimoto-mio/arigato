import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { createSupabaseSessionClient } from "@/lib/supabase/session";

export type AdminContext = {
  supabaseUserId: string;
  adminUserId: string;
  email: string;
  role: string;
  store: {
    id: string;
    slug: string;
    name: string;
    logoUrl: string | null;
    googlePlaceId: string | null;
    instagramUrl: string | null;
    facebookUrl: string | null;
  };
};

/**
 * Resolve the signed-in Supabase user to the store they administer.
 * Returns null when there is no session, or when the user has no AdminUser row
 * (authenticated with Supabase but not provisioned for any store).
 */
export async function getAdminContext(): Promise<AdminContext | null> {
  const supabase = await createSupabaseSessionClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const admin = await prisma.adminUser.findUnique({
    where: { supabaseUserId: user.id },
    include: { store: true },
  });

  if (!admin) return null;

  return {
    supabaseUserId: user.id,
    adminUserId: admin.id,
    email: admin.email,
    role: admin.role,
    store: {
      id: admin.store.id,
      slug: admin.store.slug,
      name: admin.store.name,
      logoUrl: admin.store.logoUrl,
      googlePlaceId: admin.store.googlePlaceId,
      instagramUrl: admin.store.instagramUrl,
      facebookUrl: admin.store.facebookUrl,
    },
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
