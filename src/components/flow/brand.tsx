const ARIGATO_LETTERS = "ARIGATO".split("");

/**
 * ARIGATO TiP JAPAN logo — a red circle with "ARIGATO" spelled vertically
 * inside, and "TIP" / "JAPAN" stacked as two rows beneath it. Built with CSS
 * text rather than a raster image so it stays crisp at any size.
 */
/** Just the red circle with "ARIGATO" set vertically — reusable on its own. */
export function LogoMark({ size = 56 }: { size?: number }) {
  return (
    <div
      className="flex flex-col items-center justify-center rounded-full bg-[var(--color-logo)]"
      style={{ width: size, height: size }}
      role="img"
      aria-label="ARIGATO TiP JAPAN"
    >
      {ARIGATO_LETTERS.map((letter, index) => (
        <span key={index} className="font-bold text-white" style={{ fontSize: size * 0.125, lineHeight: 1.05 }}>
          {letter}
        </span>
      ))}
    </div>
  );
}

export function LogoBadge({ size = 56 }: { size?: number }) {
  return (
    <div className="flex flex-col items-center" style={{ width: size }} role="img" aria-label="ARIGATO TiP JAPAN">
      <LogoMark size={size} />
      <p
        className="mt-1 text-center font-bold leading-[1.05] text-[var(--color-logo)]"
        style={{ fontSize: size * 0.29 }}
      >
        TiP
      </p>
      <p
        className="text-center font-bold leading-[1.1] text-[var(--color-logo)]"
        style={{ fontSize: size * 0.29, letterSpacing: "0.02em" }}
      >
        JAPAN
      </p>
    </div>
  );
}

/** "ARIGATO TiP" wordmark — ARIGATO black, TiP gold. */
export function Wordmark({ className = "" }: { className?: string }) {
  return (
    <span className={className}>
      <span className="font-extrabold text-neutral-900">ARIGATO </span>
      <span className="font-extrabold text-[var(--color-accent)]">TiP</span>
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
