"use client";

import { createBrowserClient } from "@supabase/ssr";

/**
 * Anon-key client for the browser: admin auth (login/logout) and the Realtime
 * subscription behind the live tip feed. Never used for privileged reads.
 *
 * Env is read inside the function, not at module scope, so a missing variable
 * surfaces as a clear runtime error instead of breaking the production build.
 */
export function createSupabaseBrowserClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY are not set");
  }

  return createBrowserClient(url, anonKey);
}
