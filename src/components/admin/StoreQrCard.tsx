"use client";

import QRCode from "qrcode";
import { useEffect, useState } from "react";

/**
 * Store QR code, generated in the browser from the tip URL so a loading skeleton
 * can show while it renders — including when the URL changes after the slug is
 * edited (the settings page re-renders and passes a new `tipUrl`).
 */
export function StoreQrCard({
  storeName,
  tipUrl,
  downloadName,
  loading = false,
}: {
  storeName: string;
  tipUrl: string;
  downloadName: string;
  /** External "still saving" signal — keeps the spinner up during the save round-trip. */
  loading?: boolean;
}) {
  // Pair each result with the URL it was made from, so a stale result never
  // shows: while a new tipUrl is still rendering, `dataUrl` below is null.
  const [generated, setGenerated] = useState<{ url: string; dataUrl: string } | null>(null);

  useEffect(() => {
    let active = true;
    QRCode.toDataURL(tipUrl, {
      width: 720,
      margin: 2,
      errorCorrectionLevel: "M",
      color: { dark: "#171717", light: "#ffffff" },
    })
      .then((url) => {
        if (active) setGenerated({ url: tipUrl, dataUrl: url });
      })
      .catch(() => {
        // Leaves the skeleton in place; a malformed URL is the only realistic cause.
      });
    return () => {
      active = false;
    };
  }, [tipUrl]);

  const dataUrl = generated?.url === tipUrl ? generated.dataUrl : null;
  // Spinner while the parent is still saving, or while the code (re)generates.
  const busy = loading || !dataUrl;

  return (
    <div className="flex flex-col items-center gap-3 rounded-xl bg-neutral-50 p-6 text-center">
      <p className="text-base font-bold text-neutral-900">{storeName}</p>

      {busy ? (
        <div className="flex h-[256px] w-[256px] max-w-full items-center justify-center rounded-lg bg-neutral-100">
          <svg
            className="h-9 w-9 animate-spin text-[var(--color-accent)]"
            viewBox="0 0 24 24"
            fill="none"
            role="status"
            aria-label="QRコードを生成中"
          >
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-90" fill="currentColor" d="M4 12a8 8 0 0 1 8-8V0C5.37 0 0 5.37 0 12h4z" />
          </svg>
        </div>
      ) : (
        // Data URL, so next/image optimisation is neither possible nor useful here.
        // eslint-disable-next-line @next/next/no-img-element
        <img src={dataUrl} alt={`QR code for ${storeName}`} width={256} height={256} className="h-auto w-full max-w-[256px] rounded-lg" />
      )}

      <p className="break-all font-mono text-xs text-neutral-500">{tipUrl}</p>

      {busy ? (
        <span className="cursor-default rounded-full bg-neutral-300 px-6 py-2 text-center text-sm font-semibold text-white">
          生成中…
        </span>
      ) : (
        <a
          href={dataUrl}
          download={downloadName}
          className="rounded-full bg-neutral-900 px-6 py-2 text-center text-sm font-semibold text-white"
        >
          PNGをダウンロード
        </a>
      )}
    </div>
  );
}
