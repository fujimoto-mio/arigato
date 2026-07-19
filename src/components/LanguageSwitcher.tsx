"use client";

import { useTranslations } from "next-intl";
import { LOCALES } from "@/i18n/messages";
import { useLocaleSwitcher } from "@/i18n/LocaleProvider";

const FLAGS: Record<(typeof LOCALES)[number], string> = {
  ja: "🇯🇵",
  en: "🇺🇸",
  ko: "🇰🇷",
  zh: "🇨🇳",
};

const LABEL_KEYS: Record<(typeof LOCALES)[number], "japanese" | "english" | "korean" | "chinese"> = {
  ja: "japanese",
  en: "english",
  ko: "korean",
  zh: "chinese",
};

export function LanguageSwitcher() {
  const t = useTranslations("language");
  const { locale, setLocale } = useLocaleSwitcher();

  return (
    <div className="flex flex-wrap justify-center gap-2 px-4 py-3">
      {LOCALES.map((code) => {
        const isActive = code === locale;
        return (
          <button
            key={code}
            type="button"
            onClick={() => setLocale(code)}
            aria-pressed={isActive}
            className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${
              isActive
                ? "border-neutral-900 bg-neutral-900 text-white"
                : "border-neutral-300 bg-white text-neutral-700 hover:bg-neutral-50"
            }`}
          >
            <span>{FLAGS[code]}</span>
            <span>{t(LABEL_KEYS[code])}</span>
          </button>
        );
      })}
    </div>
  );
}
