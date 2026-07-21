import QRCode from "qrcode";

/** Absolute URL a table QR should point at. */
export function storeTipUrl(slug: string, table?: string | null): string {
  const base = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3030";
  const url = new URL(`/s/${slug}`, base);
  if (table) url.searchParams.set("t", table);
  return url.toString();
}

/**
 * PNG data URL for a store's QR code. Rendered server-side so the dashboard can
 * show and download it without shipping an encoder to the browser.
 */
export async function storeQrDataUrl(slug: string, table?: string | null): Promise<string> {
  return QRCode.toDataURL(storeTipUrl(slug, table), {
    width: 720,
    margin: 2,
    errorCorrectionLevel: "M",
    color: { dark: "#171717", light: "#ffffff" },
  });
}
