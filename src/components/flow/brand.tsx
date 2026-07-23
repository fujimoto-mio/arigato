import Image from "next/image";

/**
 * ARIGATO TiP JAPAN logo — the platform's fixed header branding: the logo image
 * plus the "TiP JAPAN" name beneath it. The image lives at LOGO_SRC in /public
 * (drop the artwork there). If your artwork already includes the "TiP JAPAN"
 * text, render with showName={false}.
 */
const LOGO_SRC = "/arigato-logo.png";

export function LogoBadge({ size = 48, showName = true }: { size?: number; showName?: boolean }) {
  return (
    <div className="flex flex-col items-center leading-none">
      <div className="relative" style={{ width: size, height: size }}>
        <Image src={LOGO_SRC} alt="ARIGATO TiP JAPAN" fill sizes={`${size}px`} className="object-contain" priority />
      </div>
      {showName ? (
        <span className="mt-1 text-[9px] font-bold tracking-[0.18em] text-[var(--color-logo)]">TiP JAPAN</span>
      ) : null}
    </div>
  );
}

/** "ARIGATO TiP" wordmark — ARIGATO black, TiP gold. */
export function Wordmark({ className = "" }: { className?: string }) {
  return (
    <span className={className}>
      <span className="font-bold text-neutral-900">ARIGATO </span>
      <span className="font-bold text-[var(--color-accent)]">TiP</span>
    </span>
  );
}

export function InstagramIcon({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      <defs>
        <linearGradient id="ig" x1="0" y1="1" x2="1" y2="0">
          <stop offset="0" stopColor="#FEDA75" />
          <stop offset="0.35" stopColor="#FA7E1E" />
          <stop offset="0.6" stopColor="#D62976" />
          <stop offset="0.85" stopColor="#962FBF" />
          <stop offset="1" stopColor="#4F5BD5" />
        </linearGradient>
      </defs>
      <rect x="1.5" y="1.5" width="21" height="21" rx="6" fill="url(#ig)" />
      <circle cx="12" cy="12" r="4.2" fill="none" stroke="#fff" strokeWidth="1.7" />
      <circle cx="17.2" cy="6.8" r="1.2" fill="#fff" />
    </svg>
  );
}

export function FacebookIcon({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      <rect width="24" height="24" rx="6" fill="#1877F2" />
      <path
        d="M15.3 12.3h-2.1V20h-3v-7.7H8.7V9.7h1.5V8.2c0-1.9 1.1-3 2.9-3 .8 0 1.6.1 1.6.1v1.9h-.9c-.9 0-1.2.5-1.2 1.1v1.4h2.2l-.5 2.6Z"
        fill="#fff"
      />
    </svg>
  );
}

export function GoogleIcon({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M21.6 12.2c0-.6-.1-1.3-.2-1.9H12v3.6h5.4c-.2 1.2-.9 2.3-2 3v2.5h3.2c1.9-1.7 3-4.3 3-7.2Z"
      />
      <path
        fill="#34A853"
        d="M12 22c2.7 0 5-.9 6.6-2.4l-3.2-2.5c-.9.6-2 1-3.4 1-2.6 0-4.8-1.8-5.6-4.1H3.1v2.6C4.7 19.8 8.1 22 12 22Z"
      />
      <path fill="#FBBC05" d="M6.4 14c-.2-.6-.3-1.3-.3-2s.1-1.4.3-2V7.4H3.1C2.4 8.8 2 10.4 2 12s.4 3.2 1.1 4.6L6.4 14Z" />
      <path
        fill="#EA4335"
        d="M12 5.9c1.5 0 2.8.5 3.8 1.5l2.8-2.8C16.9 2.9 14.7 2 12 2 8.1 2 4.7 4.2 3.1 7.4L6.4 10c.8-2.3 3-4.1 5.6-4.1Z"
      />
    </svg>
  );
}
