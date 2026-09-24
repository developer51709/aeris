import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { SUPPORTED_LOCALES, localeModules } from "./locales";
import type { Locale, LandingMessages, Messages, DocsMessages, IntegrationMessages } from "./locales/types";
import { docsBase } from "./locales/docsBase";

// Re-export for consumers — keeps existing import paths working.
export { SUPPORTED_LOCALES, LOCALE_LABELS, localeModules } from "./locales";
export type { Locale, LandingMessages, Messages, DocsMessages, IntegrationMessages } from "./locales/types";

// Dynamic maps — derive from localeModules so adding a locale is drop-in.
// No hand-maintained per-locale objects; just `locales/xx.ts` + SUPPORTED_LOCALES.

function mapLocale<T>(pick: (mod: (typeof localeModules)[Locale]) => T): Record<Locale, T> {
  const out = {} as Record<Locale, T>;
  for (const code of SUPPORTED_LOCALES as readonly Locale[]) {
    out[code] = pick(localeModules[code]);
  }
  return out;
}

export const DASHBOARD_EXTRA = mapLocale((m) => m.dashboardExtra) as Record<Locale, import("./locales/types").DashboardExtra>;
export const LANDING_MESSAGES: Record<Locale, LandingMessages> = mapLocale((m) => m.landing);
export const INTEGRATION_MESSAGES: Record<Locale, IntegrationMessages> = mapLocale((m) => m.integration);

// Docs helpers — base + per-locale overrides + labels
export function getDocsMessages(locale: Locale): DocsMessages {
  const mod = localeModules[locale] ?? localeModules.en;
  const base = { ...docsBase, ...(mod.docs as Partial<DocsMessages>) };
  const overrides = mod.articleOverrides as Record<string, Partial<DocsMessages["articles"][number]>>;
  const labels = mod.docsLabels as Partial<DocsMessages>;
  return {
    ...base,
    ...labels,
    articles: base.articles.map((article) => ({ ...article, ...overrides?.[article.id] })),
  };
}

// Keep old names for compatibility
export type DocsMessagesType = DocsMessages;
export type IntegrationMessagesType = IntegrationMessages;

// ── Provider ──

const messagesMap: Record<Locale, Messages> = mapLocale((m) => m.messages);

function detectLocale(): Locale {
  if (typeof navigator === "undefined") return "en";
  const languages = navigator.languages?.length ? navigator.languages : [navigator.language];
  return (
    languages
      .map((value) => value.toLowerCase().split("-")[0])
      .find((value): value is Locale => (SUPPORTED_LOCALES as readonly string[]).includes(value as Locale)) ?? "en"
  );
}

type I18nContext = { locale: Locale; setLocale: (locale: Locale) => void; t: Messages };
const Context = createContext<I18nContext | null>(null);

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(() => {
    if (typeof window === "undefined") return "en";
    const stored = window.localStorage.getItem("aeris-locale");
    return stored && (SUPPORTED_LOCALES as readonly string[]).includes(stored as Locale) ? (stored as Locale) : detectLocale();
  });

  const setLocale = (next: Locale) => {
    setLocaleState(next);
    window.localStorage.setItem("aeris-locale", next);
  };

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  const value = useMemo(() => ({ locale, setLocale, t: messagesMap[locale] }), [locale]);
  return <Context.Provider value={value}>{children}</Context.Provider>;
}

export function useI18n() {
  const value = useContext(Context);
  if (!value) throw new Error("useI18n must be used inside I18nProvider");
  return value;
}
