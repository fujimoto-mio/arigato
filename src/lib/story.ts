import { DEFAULT_LOCALE, LOCALES, type Locale } from "@/i18n/messages";

/** A piece of story text in each of the 4 locales (any may be empty). */
export type LocaleText = Partial<Record<Locale, string>>;

/** Locale label for the editor's language tabs. */
export const LOCALE_LABELS: Record<Locale, string> = {
  en: "EN",
  ja: "日本語",
  ko: "한국어",
  zh: "中文",
};

/**
 * Resolve text for a locale with a fallback chain: the requested locale → the
 * default (en) → the first non-empty locale. So a story filled in only one
 * language still shows something to every guest.
 */
export function pickLocaleText(text: LocaleText | null | undefined, locale: Locale): string {
  if (!text) return "";
  const inLocale = text[locale]?.trim();
  if (inLocale) return inLocale;
  const inDefault = text[DEFAULT_LOCALE]?.trim();
  if (inDefault) return inDefault;
  for (const other of LOCALES) {
    const value = text[other]?.trim();
    if (value) return value;
  }
  return "";
}

/** Coerce an unknown DB JSON value into a LocaleText (known locales, strings only). */
export function toLocaleText(value: unknown): LocaleText {
  const out: LocaleText = {};
  if (value && typeof value === "object") {
    for (const locale of LOCALES) {
      const raw = (value as Record<string, unknown>)[locale];
      if (typeof raw === "string") out[locale] = raw;
    }
  }
  return out;
}

/** Trim every locale and drop empty ones. */
export function cleanLocaleText(text: LocaleText): LocaleText {
  const out: LocaleText = {};
  for (const locale of LOCALES) {
    const value = text[locale]?.trim();
    if (value) out[locale] = value;
  }
  return out;
}

/** Whether any locale has text. */
export function hasAnyText(text: LocaleText): boolean {
  return LOCALES.some((locale) => Boolean(text[locale]?.trim()));
}
