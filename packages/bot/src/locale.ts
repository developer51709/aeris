import { prisma } from "@aeris/shared";

export const SUPPORTED_LOCALES = ["en", "es", "de", "fr", "hi", "ru"] as const;
export type BotLocale = (typeof SUPPORTED_LOCALES)[number];

export const LOCALE_NAMES: Record<BotLocale, string> = {
  en: "English", es: "Español", de: "Deutsch", fr: "Français", hi: "हिन्दी", ru: "Русский",
};

const phraseTranslations: Record<string, Partial<Record<BotLocale, string>>> = {
  "Command error": { es: "Error del comando", de: "Befehlsfehler", fr: "Erreur de commande", hi: "कमांड त्रुटि", ru: "Ошибка команды" },
  "Something went wrong running that command.": { es: "Se produjo un error al ejecutar ese comando.", de: "Beim Ausführen des Befehls ist ein Fehler aufgetreten.", fr: "Une erreur s'est produite lors de l'exécution de cette commande.", hi: "कमांड चलाते समय कुछ गलत हुआ।", ru: "При выполнении команды произошла ошибка." },
  "Command failed": { es: "Comando fallido", de: "Befehl fehlgeschlagen", fr: "Échec de la commande", hi: "कमांड विफल", ru: "Команда не выполнена" },
  "No scheduled events found.": { es: "No se encontraron eventos programados.", de: "Keine geplanten Ereignisse gefunden.", fr: "Aucun événement planifié trouvé.", hi: "कोई निर्धारित इवेंट नहीं मिला।", ru: "Запланированные события не найдены." },
  "No reputation has been given yet.": { es: "Aún no se ha dado reputación.", de: "Noch keine Reputation vergeben.", fr: "Aucune réputation n'a encore été donnée.", hi: "अभी तक कोई प्रतिष्ठा नहीं दी गई।", ru: "Репутация пока не выдана." },
  "Nothing is currently playing.": { es: "No se está reproduciendo nada.", de: "Derzeit wird nichts abgespielt.", fr: "Rien n'est en cours de lecture.", hi: "अभी कुछ भी नहीं चल रहा है।", ru: "Сейчас ничего не воспроизводится." },
  "No economy data yet.": { es: "Aún no hay datos de economía.", de: "Noch keine Wirtschaftsdaten.", fr: "Pas encore de données économiques.", hi: "अभी कोई अर्थव्यवस्था डेटा नहीं है।", ru: "Данных экономики пока нет." },
  "No webhooks exist in this channel.": { es: "No hay webhooks en este canal.", de: "In diesem Kanal gibt es keine Webhooks.", fr: "Aucun webhook dans ce canal.", hi: "इस चैनल में कोई webhook नहीं है।", ru: "В этом канале нет вебхуков." },
  "Permissions are sufficient.": { es: "Los permisos son suficientes.", de: "Die Berechtigungen reichen aus.", fr: "Les permissions sont suffisantes.", hi: "अनुमतियाँ पर्याप्त हैं।", ru: "Разрешений достаточно." },
};

export function normalizeLocale(value: unknown): BotLocale {
  const base = String(value ?? "en").toLowerCase().split("-")[0];
  return SUPPORTED_LOCALES.includes(base as BotLocale) ? base as BotLocale : "en";
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

export function translateText(text: string, locale: BotLocale): string {
  if (locale === "en") return text;
  let result = text;
  for (const [english, translations] of Object.entries(phraseTranslations)) {
    result = result.replaceAll(english, translations[locale] ?? english);
  }
  return result;
}
