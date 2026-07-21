import { headers } from "next/headers";

/**
 * Origin of the incoming request, e.g. `https://tips.example.com`.
 *
 * Derived from headers rather than an env var so QR codes always point at the
 * host the dashboard is actually served from — a misconfigured env var would
 * only surface after the codes had been printed.
 */
export async function requestOrigin(): Promise<string> {
  const headerList = await headers();

  // x-forwarded-* are what Vercel (and most proxies) set; host is the fallback.
  const host = headerList.get("x-forwarded-host") ?? headerList.get("host") ?? "localhost:3030";
  const forwardedProto = headerList.get("x-forwarded-proto");
  const protocol =
    forwardedProto ?? (host.startsWith("localhost") || host.startsWith("127.0.0.1") ? "http" : "https");

  return `${protocol}://${host}`;
}
