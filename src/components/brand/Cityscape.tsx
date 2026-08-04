/**
 * Gold Japanese-skyline silhouette used along the bottom of brand pages
 * (login / register), echoing the ARIGATO TiPLY JAPAN artwork: a pagoda, city
 * buildings, Mt. Fuji, Tokyo Tower, a torii gate, and trees. Decorative only.
 */
export function Cityscape({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 1440 200"
      preserveAspectRatio="xMidYMax slice"
      className={className}
      fill="currentColor"
      aria-hidden="true"
    >
      {/* left pine trees */}
      <g>
        <rect x="47" y="150" width="6" height="50" />
        <polygon points="50,96 30,140 70,140" />
        <polygon points="50,116 26,158 74,158" />
        <polygon points="50,136 22,176 78,176" />
      </g>

      {/* five-tier pagoda */}
      <g>
        <rect x="120" y="70" width="6" height="130" />
        <polygon points="123,44 100,72 146,72" />
        <rect x="108" y="72" width="30" height="14" />
        <polygon points="123,84 96,108 150,108" />
        <rect x="104" y="108" width="38" height="16" />
        <polygon points="123,122 92,148 154,148" />
        <rect x="100" y="148" width="46" height="18" />
        <polygon points="123,164 88,190 158,190" />
        <rect x="96" y="190" width="54" height="10" />
      </g>

      {/* city buildings (left cluster) */}
      <g>
        <rect x="200" y="120" width="34" height="80" />
        <rect x="240" y="96" width="40" height="104" />
        <rect x="286" y="140" width="30" height="60" />
        <rect x="322" y="110" width="44" height="90" />
        <rect x="372" y="150" width="28" height="50" />
      </g>

      {/* Mt. Fuji with snowcap */}
      <g>
        <polygon points="430,200 590,66 610,88 626,74 646,96 664,80 810,200" />
        <polygon
          points="590,66 610,88 626,74 646,96 664,80 690,120 660,108 640,120 618,104 600,116 578,100"
          fill="#fdfaf4"
          opacity="0.9"
        />
      </g>

      {/* city buildings (right cluster) */}
      <g>
        <rect x="770" y="132" width="30" height="68" />
        <rect x="806" y="104" width="42" height="96" />
        <rect x="854" y="146" width="28" height="54" />
        <rect x="888" y="118" width="40" height="82" />
        <rect x="934" y="150" width="26" height="50" />
      </g>

      {/* Tokyo Tower */}
      <g>
        <polygon points="1024,52 1012,120 1036,120" />
        <polygon points="1010,120 1004,200 1044,200 1038,120" />
        <rect x="1016" y="120" width="16" height="6" />
        <rect x="1010" y="150" width="28" height="6" />
        <rect x="1022" y="40" width="4" height="14" />
      </g>

      {/* torii gate */}
      <g>
        <rect x="1092" y="96" width="12" height="104" />
        <rect x="1180" y="96" width="12" height="104" />
        <rect x="1078" y="86" width="128" height="14" />
        <rect x="1086" y="108" width="112" height="9" />
      </g>

      {/* right pine trees */}
      <g>
        <rect x="1287" y="150" width="6" height="50" />
        <polygon points="1290,100 1268,144 1312,144" />
        <polygon points="1290,122 1264,164 1316,164" />
        <polygon points="1290,142 1260,182 1320,182" />
      </g>

      {/* far-right low buildings */}
      <g>
        <rect x="1350" y="140" width="30" height="60" />
        <rect x="1386" y="118" width="40" height="82" />
      </g>
    </svg>
  );
}

/** A single 5-petal sakura blossom — decorative accent. */
export function Sakura({ className = "", size = 28 }: { className?: string; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      className={className}
      fill="currentColor"
      aria-hidden="true"
    >
      {[0, 72, 144, 216, 288].map((deg) => (
        <path
          key={deg}
          d="M50 50 C42 30 44 14 50 8 C56 14 58 30 50 50 Z"
          transform={`rotate(${deg} 50 50)`}
        />
      ))}
      <circle cx="50" cy="50" r="6" fill="#fff" opacity="0.85" />
    </svg>
  );
}
