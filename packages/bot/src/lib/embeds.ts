import { EmbedBuilder } from "discord.js";
import { translateText } from "../locale.js";
import type { BotLocale } from "../locales/types.js";

/** Aeris brand colors */
export const COLORS = {
  primary: 0x22d3ee,    // cyan
  success: 0x22c55e,    // green
  warning: 0xf59e0b,    // amber
  danger: 0xef4444,     // red
  info: 0x3b82f6,       // blue
  economy: 0xfbbf24,    // gold
  level: 0x2b8c5e,      // emerald
  music: 0xa855f7,      // purple
  neutral: 0x64748b,    // slate
} as const;

/** Default Aeris footer */
const FOOTER = { text: "Aeris" };

/**
 * Create a standard Aeris embed with branding footer.
 * Pass a builder function that receives a fresh EmbedBuilder.
 */
export function aerisEmbed(): EmbedBuilder {
  return new EmbedBuilder().setColor(COLORS.primary).setFooter(FOOTER);
}

/** Quick success embed (green, with checkmark title) */
export function successEmbed(title: string, description?: string): EmbedBuilder {
  return aerisEmbed()
    .setColor(COLORS.success)
    .setTitle(`✅ ${title}`)
    .setDescription(description ?? null);
}

/** Quick error embed (red) */
export function errorEmbed(title: string, description?: string): EmbedBuilder {
  return aerisEmbed()
    .setColor(COLORS.danger)
    .setTitle(`❌ ${title}`)
    .setDescription(description ?? null);
}

/** Quick info embed */
export function infoEmbed(title: string, description?: string): EmbedBuilder {
  return aerisEmbed()
    .setColor(COLORS.info)
    .setTitle(title)
    .setDescription(description ?? null);
}

/**
 * Localize an existing EmbedBuilder in-place for the given guild locale.
 * Translates title, description, footer, author, and all field names/values
 * via the modular locale folder (`packages/bot/src/locales/*`).
 * Safe to call with `en` — returns the embed unchanged.
 */
export function localizeEmbed(embed: EmbedBuilder, locale: BotLocale): EmbedBuilder {
  if (locale === "en") return embed;
  const data = embed.data as unknown as {
    title?: string;
    description?: string;
    footer?: { text: string; icon_url?: string };
    author?: { name: string; icon_url?: string; url?: string };
    fields?: Array<{ name: string; value: string; inline?: boolean }>;
  };
  if (data.title) embed.setTitle(translateText(data.title, locale));
  if (data.description) embed.setDescription(translateText(data.description, locale));
  if (data.footer?.text) embed.setFooter({ text: translateText(data.footer.text, locale), iconURL: data.footer.icon_url });
  if (data.author?.name) embed.setAuthor({ name: translateText(data.author.name, locale), iconURL: data.author.icon_url, url: data.author.url });
  if (data.fields?.length) {
    const fields = data.fields.map((f) => ({
      name: translateText(f.name, locale),
      value: translateText(f.value, locale),
      inline: f.inline,
    }));
    embed.setFields(fields);
  }
  return embed;
}
