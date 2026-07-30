"use client";

import QRCode from "qrcode";
import { useEffect, useState } from "react";

/**
 * Store QR code, generated in the browser from the tip URL so a loading skeleton
 * can show while it renders — including when the URL changes after the slug is
 * edited (the settings page re-renders and passes a new `tipUrl`).
 *
 * `size` sets the displayed pixel size (the code is always rendered at high
 * resolution for crisp download/zoom). `zoomable` (or `imageOnly`) makes clicking
 * the code open a larger overlay. `imageOnly` drops the surrounding card (name /
 * URL / download) and renders just the clickable QR image.
 */
export function StoreQrCard({
  storeName,
  tipUrl,
  downloadName,
  loading = false,
  size = 256,
  zoomable = false,
  imageOnly = false,
}: {
  storeName: string;
  tipUrl: string;
  downloadName: string;
  /** External "still saving" signal — keeps the spinner up during the save round-trip. */
  loading?: boolean;
  /** Displayed pixel size of the QR. */
  size?: number;
  /** When true, clicking the QR opens an enlarged overlay. */
  zoomable?: boolean;
  /** Render just the clickable QR image, without the name / URL / download card. */
  imageOnly?: boolean;
}) {
  // Pair each result with the URL it was made from, so a stale result never
  // shows: while a new tipUrl is still rendering, `dataUrl` below is null.
  const [generated, setGenerated] = useState<{ url: string; dataUrl: string } | null>(null);
  const [zoomed, setZoomed] = useState(false);

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

  // Close the zoom overlay on Escape.
  useEffect(() => {
    if (!zoomed) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setZoomed(false);
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [zoomed]);

  const dataUrl = generated?.url === tipUrl ? generated.dataUrl : null;
  // Spinner while the parent is still saving, or while the code (re)generates.
  const busy = loading || !dataUrl;
  const clickable = zoomable || imageOnly;

  const qr = busy ? (
    <div
      style={{ height: size, width: size }}
      className="flex max-w-full items-center justify-center rounded-lg bg-neutral-100"
    >
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
  ) : clickable ? (
    <button
      type="button"
      onClick={() => setZoomed(true)}
      aria-label="QRコードを拡大"
      className="group relative rounded-lg transition hover:opacity-90"
      style={{ width: size, maxWidth: "100%" }}
    >
      {/* Data URL, so next/image optimisation is neither possible nor useful. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={dataUrl!} alt={`QR code for ${storeName}`} className="h-auto w-full rounded-lg" />
      <span className="absolute bottom-1 right-1 flex h-6 w-6 items-center justify-center rounded-full bg-black/55 text-white opacity-0 transition group-hover:opacity-100">
        <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="7" />
          <path d="M21 21l-4.3-4.3M11 8v6M8 11h6" />
        </svg>
      </span>
    </button>
  ) : (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={dataUrl!}
      alt={`QR code for ${storeName}`}
      style={{ width: size, maxWidth: "100%" }}
      className="h-auto rounded-lg"
    />
  );

  const zoomOverlay =
    zoomed && dataUrl ? (
      <div
        className="fixed inset-0 z-[130] flex items-center justify-center p-6"
        role="dialog"
        aria-modal="true"
        onClick={() => setZoomed(false)}
      >
        <div className="absolute inset-0 bg-black/60" />
        <div
          className="relative z-10 flex flex-col items-center gap-4 rounded-2xl bg-white p-6 shadow-xl"
          onClick={(e) => e.stopPropagation()}
        >
          <p className="text-base font-bold text-neutral-900">{storeName}</p>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={dataUrl} alt={`QR code for ${storeName}`} className="h-auto w-[min(80vw,360px)] rounded-lg" />
          <p className="break-all text-center font-mono text-xs text-neutral-500">{tipUrl}</p>
          <a
            href={dataUrl}
            download={downloadName}
            className="rounded-full bg-neutral-900 px-6 py-2 text-center text-sm font-semibold text-white"
          >
            PNGをダウンロード
          </a>
          <button
            type="button"
            onClick={() => setZoomed(false)}
            className="text-sm font-medium text-neutral-500 transition hover:text-neutral-800"
          >
            閉じる
          </button>
        </div>
      </div>
    ) : null;

  // Image-only: just the clickable QR (used in the admin store summary).
  if (imageOnly) {
    return (
      <div className="flex flex-col items-center">
        {qr}
        {zoomOverlay}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-3 rounded-xl bg-neutral-50 p-6 text-center">
      <p className="text-base font-bold text-neutral-900">{storeName}</p>
      {qr}
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

      {zoomOverlay}
    </div>
  );
}
