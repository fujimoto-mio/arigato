"use client";

import { createBrowserClient } from "@supabase/ssr";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!url || !anonKey) {
  throw new Error("NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY are not set");
}

/**
 * Anon-key client for the browser: admin auth (login/logout) and the Realtime
 * subscription behind the live tip feed. Never used for privileged reads.
 */
export function createSupabaseBrowserClient() {
  return createBrowserClient(url!, anonKey!);
}
