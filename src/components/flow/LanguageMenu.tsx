"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { useLocaleSwitcher } from "@/i18n/LocaleProvider";
import { LOCALES } from "@/i18n/messages";

const LANG_LABEL: Record<(typeof LOCALES)[number], "japanese" | "english" | "korean" | "chinese"> = {
  ja: "japanese",
  en: "english",
  ko: "korean",
  zh: "chinese",
};

/** Compact native-name language switcher, shown in every guest-flow screen's header. */
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
        className="flex items-center gap-1.5 rounded-full border border-neutral-200 py-2.5 pl-4 pr-3 text-neutral-600 transition hover:bg-neutral-50"
      >
        <span className="text-xs font-semibold">{t(LANG_LABEL[locale])}</span>
        <svg
          viewBox="0 0 24 24"
          className="h-3.5 w-3.5 text-neutral-400"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
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
          <ul className="absolute left-0 top-full z-30 mt-1.5 w-36 overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-lg">
            {LOCALES.map((code) => (
              <li key={code}>
                <button
                  type="button"
                  onClick={() => {
                    setLocale(code);
                    setOpen(false);
                  }}
                  className={`flex w-full items-center px-4 py-3 text-sm ${code === locale ? "bg-neutral-50 font-semibold" : ""}`}
                >
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
