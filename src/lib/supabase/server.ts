import { createClient } from "@supabase/supabase-js";

/**
 * Service-role client for server components/route handlers (Storage, Realtime,
 * Auth admin APIs). Data reads/writes for Store/Staff/Tip/Review go through
 * Prisma (`@/lib/prisma`), not this client.
 *
 * Constructed per call rather than at module scope: a module-level client would
 * throw during `next build` when the env vars aren't present at build time.
 */
export function supabaseServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY are not set");
  }

  return createClient(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
