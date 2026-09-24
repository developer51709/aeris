import * as en from "./en";
import * as es from "./es";
import * as de from "./de";
import * as fr from "./fr";
import * as hi from "./hi";
import * as ru from "./ru";
import type { Locale } from "./types";

// Re-export single source of truth — types.ts owns SUPPORTED_LOCALES.
// Adding a language: copy _template.ts → xx.ts, translate, add import + entry
// below, and add the code to SUPPORTED_LOCALES in types.ts. No other files change.
export { SUPPORTED_LOCALES } from "./types";

export type { Locale } from "./types";

export const localeModules = { de, en, es, fr, hi, ru } as const;

export const LOCALE_LABELS: Record<Locale, string> = {
  en: en.label,
  es: es.label,
  de: de.label,
  fr: fr.label,
  hi: hi.label,
  ru: ru.label,
};

export function getLocaleModule(locale: string) {
  const base = locale.toLowerCase().split("-")[0] as Locale;
  return localeModules[base as Locale] ?? localeModules.en;
}

// Re-export types for convenience
export type { LandingMessages, DashboardExtra, Messages, DocsMessages, IntegrationMessages, DocsLabels } from "./types";
