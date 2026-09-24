export const SUPPORTED_LOCALES = ["en", "es", "de", "fr", "hi", "ru"] as const;
export type BotLocale = (typeof SUPPORTED_LOCALES)[number];

export type Translations = Record<string, string>;

export type LocaleModule = {
  label: string;
  translations: Translations;
};

// Adding a new language:
// 1. Copy _template.ts to <code>.ts (e.g., pt.ts)
// 2. Set `label` to native name and translate `translations` values
// 3. Add import + entry in ./index.ts `localeModules` (and optionally LOCALE_NAMES)
// 4. Because SUPPORTED_LOCALES is the single source (here), add the code there.
// No other files need touching — commands use getGuildLocale() + translate().
