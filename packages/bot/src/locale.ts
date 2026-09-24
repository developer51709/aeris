import { prisma } from "@aeris/shared";
import { SUPPORTED_LOCALES, LOCALE_NAMES, localeModules, translate, translateText } from "./locales/index.js";
import type { BotLocale } from "./locales/types.js";

export { SUPPORTED_LOCALES, LOCALE_NAMES, translate, translateText };
export type { BotLocale } from "./locales/types.js";

// Re-export localeModules for advanced usage
export { localeModules };

export function normalizeLocale(value: unknown): BotLocale {
  const base = String(value ?? "en").toLowerCase().split("-")[0];
  return (SUPPORTED_LOCALES as readonly string[]).includes(base as BotLocale) ? (base as BotLocale) : "en";
}

export async function getGuildLocale(guildId: string | null | undefined): Promise<BotLocale> {
  if (!guildId) return "en";
  try {
    const guild = await prisma.guild.findUnique({ where: { id: guildId }, select: { locale: true } });
    return normalizeLocale(guild?.locale);
  } catch {
    return "en";
  }
}

// Helper to get a translator bound to a locale — use in commands: const t = getTranslator(locale); t("Admin command failed")
export function getTranslator(locale: BotLocale) {
  return (key: string, vars?: Record<string, string | number>) => translate(key, locale, vars);
}

// Backwards compat: re-export translateText at top level
export { translateText as translateTextLegacy };
