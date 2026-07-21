import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!url || !anonKey) {
  throw new Error("NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY are not set");
}

/**
 * Cookie-backed Supabase client for server components and route handlers, used
 * to read the signed-in admin's session. Distinct from `supabaseServer`
 * (service-role, no user context) in `./server`.
 */
export async function createSupabaseSessionClient() {
  const cookieStore = await cookies();

  return createServerClient(url!, anonKey!, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: (cookiesToSet) => {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        } catch {
          // Called from a Server Component, where cookies are read-only. Safe to
          // ignore: middleware/route handlers refresh the session cookie instead.
        }
      },
    },
  });
}
