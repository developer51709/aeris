import * as en from "./en.js";
import * as es from "./es.js";
import * as de from "./de.js";
import * as fr from "./fr.js";
import * as hi from "./hi.js";
import * as ru from "./ru.js";
import { SUPPORTED_LOCALES as _SUPPORTED } from "./types.js";
import type { BotLocale, LocaleModule } from "./types.js";

// Re-export single source of truth — types.ts owns SUPPORTED_LOCALES.
// Adding a language: copy _template.ts → xx.ts, translate, add import + entry below,
// and add the code to SUPPORTED_LOCALES in types.ts. No other files change.
export { SUPPORTED_LOCALES } from "./types.js";

export const LOCALE_NAMES: Record<BotLocale, string> = {
  en: en.label,
  es: es.label,
  de: de.label,
  fr: fr.label,
  hi: hi.label,
  ru: ru.label,
};

// Drop-in registry: one entry per locale file. Keep keys sorted.
export const localeModules = { de, en, es, fr, hi, ru } as const satisfies Record<BotLocale, LocaleModule>;

export type { BotLocale, Translations, LocaleModule } from "./types.js";

export function getLocaleModule(locale: string) {
  const base = locale.toLowerCase().split("-")[0] as BotLocale;
  return (localeModules as Record<BotLocale, LocaleModule>)[base as BotLocale] ?? localeModules.en;
}

// Translate helper with {var} interpolation: t("Hello {name}", { name: "World" })
export function translate(key: string, locale: BotLocale, vars?: Record<string, string | number>): string {
  const mod = (localeModules as Record<BotLocale, LocaleModule>)[locale] ?? localeModules.en;
  let text = mod.translations[key] ?? localeModules.en.translations[key] ?? key;
  if (vars) {
    for (const [k, v] of Object.entries(vars)) {
      text = text.replaceAll(`{${k}}`, String(v));
    }
  }
  return text;
}

// Legacy replaceAll-based translator for free-form bodies (used by replyV2/editV2)
export function translateText(text: string, locale: BotLocale): string {
  if (locale === "en") return text;
  const mod = (localeModules as Record<BotLocale, LocaleModule>)[locale] ?? localeModules.en;
  let result = text;
  for (const [english, translated] of Object.entries(mod.translations) as [string, string][]) {
    if (english !== translated) {
      result = result.replaceAll(english, translated);
    }
  }
  return result;
}
