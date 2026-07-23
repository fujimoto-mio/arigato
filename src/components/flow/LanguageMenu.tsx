"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { useLocaleSwitcher } from "@/i18n/LocaleProvider";
import { LOCALES } from "@/i18n/messages";

const FLAGS: Record<(typeof LOCALES)[number], string> = { ja: "🇯🇵", en: "🇺🇸", ko: "🇰🇷", zh: "🇨🇳" };
const LANG_LABEL: Record<(typeof LOCALES)[number], "japanese" | "english" | "korean" | "chinese"> = {
  ja: "japanese",
  en: "english",
  ko: "korean",
  zh: "chinese",
};

/** Compact globe + code language switcher, shown in every guest-flow screen's header. */
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
        className="flex items-center gap-1 text-neutral-500"
      >
        <span className="text-lg">🌐</span>
        <span className="text-xs font-semibold uppercase">{locale}</span>
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
                  <span>{FLAGS[code]}</span>
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
