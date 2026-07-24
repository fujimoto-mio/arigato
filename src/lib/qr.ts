import QRCode from "qrcode";

/** Absolute URL a store QR should point at. `origin` comes from the request. */
export function storeTipUrl(origin: string, slug: string): string {
  return new URL(`/s/${slug}`, origin).toString();
}

/**
 * PNG data URL for a store's QR code. Rendered server-side so the dashboard can
 * show and download it without shipping an encoder to the browser.
 */
export async function storeQrDataUrl(origin: string, slug: string): Promise<string> {
  return QRCode.toDataURL(storeTipUrl(origin, slug), {
    width: 720,
    margin: 2,
    errorCorrectionLevel: "M",
    color: { dark: "#171717", light: "#ffffff" },
  });
}
