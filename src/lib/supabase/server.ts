import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceRoleKey) {
  throw new Error("Supabase server env vars are not set");
}

// Service-role client for server components/route handlers (Storage, Realtime,
// Auth admin APIs). Data reads/writes for Store/Staff/Tip/Review go through
// Prisma (`@/lib/prisma`), not this client.
export const supabaseServer = createClient(url, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});
