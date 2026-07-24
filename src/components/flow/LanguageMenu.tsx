"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { useLocaleSwitcher } from "@/i18n/LocaleProvider";
import { LOCALES } from "@/i18n/messages";

/**
 * Flag icons drawn as inline SVG rather than Unicode flag emoji: Windows has no
 * colored flag glyphs and renders the emoji as plain "JP"/"US"-style letter
 * codes, so emoji flags don't reliably show a flag at all on that platform.
 */
function FlagIcon({ code, className = "" }: { code: (typeof LOCALES)[number]; className?: string }) {
  const common = {
    viewBox: "0 0 20 14",
    className: `h-3.5 w-5 overflow-hidden rounded-[2px] border border-black/10 shadow-sm ${className}`,
  };
  switch (code) {
    case "ja":
      return (
        <svg {...common}>
          <rect width="20" height="14" fill="#fff" />
          <circle cx="10" cy="7" r="4" fill="#bc002d" />
        </svg>
      );
    case "en":
      return (
        <svg {...common}>
          <rect width="20" height="14" fill="#b22234" />
          <rect y="1.08" width="20" height="1.08" fill="#fff" />
          <rect y="3.23" width="20" height="1.08" fill="#fff" />
          <rect y="5.38" width="20" height="1.08" fill="#fff" />
          <rect y="7.54" width="20" height="1.08" fill="#fff" />
          <rect y="9.69" width="20" height="1.08" fill="#fff" />
          <rect y="11.85" width="20" height="1.08" fill="#fff" />
          <rect width="8" height="7.54" fill="#3c3b6e" />
        </svg>
      );
    case "ko":
      return (
        <svg {...common}>
          <rect width="20" height="14" fill="#fff" />
          <path d="M10 3a2 2 0 0 1 0 4 2 2 0 0 0 0 4 4 4 0 0 0 0-8z" fill="#cd2e3a" />
          <path d="M10 3a2 2 0 0 0 0 4 2 2 0 0 1 0 4 4 4 0 0 1 0-8z" fill="#0047a0" />
        </svg>
      );
    case "zh":
      return (
        <svg {...common}>
          <rect width="20" height="14" fill="#de2910" />
          <polygon points="4,2 4.6,3.8 6.5,3.8 5,5 5.6,6.8 4,5.7 2.4,6.8 3,5 1.5,3.8 3.4,3.8" fill="#ffde00" />
          <circle cx="7.5" cy="1.5" r="0.4" fill="#ffde00" />
          <circle cx="8.5" cy="3" r="0.4" fill="#ffde00" />
          <circle cx="8.5" cy="5" r="0.4" fill="#ffde00" />
          <circle cx="7.5" cy="6.5" r="0.4" fill="#ffde00" />
        </svg>
      );
  }
}

const LANG_LABEL: Record<(typeof LOCALES)[number], "japanese" | "english" | "korean" | "chinese"> = {
  ja: "japanese",
  en: "english",
  ko: "korean",
  zh: "chinese",
};

/** Compact flag + native-name language switcher, shown in every guest-flow screen's header. */
export function LanguageMenu() {
  const t = useTranslations("language");
  const { locale, setLocale } = useLocaleSwitcher();
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label="Language"
        className="flex items-center gap-1.5 text-neutral-600"
      >
        <FlagIcon code={locale} />
        <span className="text-xs font-semibold">{t(LANG_LABEL[locale])}</span>
      </button>
      {open ? (
        <>
          {/* Click-away layer so the dropdown closes without a global listener. */}
          <button
            type="button"
            aria-hidden="true"
            tabIndex={-1}
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-20 cursor-default"
          />
          <ul className="absolute left-0 top-10 z-30 w-36 overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-lg">
            {LOCALES.map((code) => (
              <li key={code}>
                <button
                  type="button"
                  onClick={() => {
                    setLocale(code);
                    setOpen(false);
                  }}
                  className={`flex w-full items-center gap-2 px-3 py-2 text-sm ${code === locale ? "bg-neutral-50 font-semibold" : ""}`}
                >
                  <FlagIcon code={code} />
                  {t(LANG_LABEL[code])}
                </button>
              </li>
            ))}
          </ul>
        </>
      ) : null}
    </div>
  );
}
