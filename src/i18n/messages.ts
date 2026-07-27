import en from "./messages/en.json";
import ja from "./messages/ja.json";
import ko from "./messages/ko.json";
import zh from "./messages/zh.json";

// English first — it's the default; the switcher lists locales in this order.
export const LOCALES = ["en", "ja", "ko", "zh"] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = "en";

export const messagesByLocale: Record<Locale, typeof ja> = { ja, en, ko, zh };
