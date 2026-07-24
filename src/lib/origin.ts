import { headers } from "next/headers";

/** Origin taken from the incoming request, e.g. `https://tips.example.com`. */
async function originFromRequest(): Promise<string> {
  const headerList = await headers();

  // x-forwarded-* are what Vercel (and most proxies) set; host is the fallback.
  const host = headerList.get("x-forwarded-host") ?? headerList.get("host") ?? "localhost:3030";
  const forwardedProto = headerList.get("x-forwarded-proto");
  const protocol =
    forwardedProto ?? (host.startsWith("localhost") || host.startsWith("127.0.0.1") ? "http" : "https");

  return `${protocol}://${host}`;
}

/**
 * Origin used to build QR code targets.
 *
 * `NEXT_PUBLIC_APP_URL` wins so a store can print codes pointing at its public
 * domain even when the dashboard is reached some other way (preview deploy,
 * custom proxy, LAN address). Falls back to the request's own origin when the
 * variable is unset, so QR codes never silently point at the wrong host.
 */
export async function resolveAppOrigin(): Promise<string> {
  const configured = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (configured) {
    const cleaned = configured.replace(/\/+$/, "");
    // Guard against a malformed value (e.g. a stray character in .env): a bad
    // origin would otherwise crash every page that builds a URL from it.
    if (URL.canParse(cleaned)) return cleaned;
  }
  return originFromRequest();
}
