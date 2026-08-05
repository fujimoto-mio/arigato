"use client";

import { useState } from "react";

/**
 * Iframe for the phone preview with a centered loading spinner shown until the
 * page finishes loading. Works the same on desktop and mobile.
 */
export function PreviewIframe({ src, title }: { src: string; title: string }) {
  const [loading, setLoading] = useState(true);

  return (
    <div className="relative h-full w-full bg-white">
      {loading ? (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-white">
          <span
            className="h-9 w-9 animate-spin rounded-full border-[3px] border-neutral-200 border-t-[var(--color-accent)]"
            aria-label="読み込み中"
            role="status"
          />
        </div>
      ) : null}
      <iframe
        src={src}
        title={title}
        onLoad={() => setLoading(false)}
        className="h-full w-full border-0"
      />
    </div>
  );
}
