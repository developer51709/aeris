import { EmbedBuilder } from "discord.js";

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
