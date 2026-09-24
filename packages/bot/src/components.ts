import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChatInputCommandInteraction,
  ContainerBuilder,
  EmbedBuilder,
  MediaGalleryBuilder,
  MessageFlags,
  TextDisplayBuilder,
  AttachmentBuilder,
} from "discord.js";
import { getGuildLocale, translateText } from "./locale.js";
import type { BotLocale } from "./locales/types.js";
import { localizeEmbed } from "./lib/embeds.js";

export interface V2ResponseOptions {
  title?: string;
  body: string;
  imageUrls?: string[];
  buttons?: Array<{ label: string; customId?: string; url?: string; style?: ButtonStyle }>;
  ephemeral?: boolean;
  files?: AttachmentBuilder[];
}

export function containerResponse(options: V2ResponseOptions): ContainerBuilder {
  const container = new ContainerBuilder();
  const content = options.title ? `## ${options.title}\n${options.body}` : options.body;
  container.addTextDisplayComponents(new TextDisplayBuilder().setContent(content));

  if (options.imageUrls?.length) {
    const gallery = new MediaGalleryBuilder();
    for (const url of options.imageUrls.slice(0, 10)) {
      gallery.addItems({ media: { url } });
    }
    container.addMediaGalleryComponents(gallery);
  }

  if (options.buttons?.length) {
    const row = new ActionRowBuilder<ButtonBuilder>();
    for (const button of options.buttons.slice(0, 5)) {
      const builder = new ButtonBuilder()
        .setLabel(button.label)
        .setStyle(button.style ?? (button.url ? ButtonStyle.Link : ButtonStyle.Secondary));
      if (button.url) builder.setURL(button.url);
      else builder.setCustomId(button.customId ?? button.label.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 100));
      row.addComponents(builder);
    }
    container.addActionRowComponents(row);
  }

  return container;
}

/**
 * Locale-aware V2 reply helpers.
 * If `locale` is provided, that locale is used. Otherwise the guild's
 * stored locale is fetched via `getGuildLocale(guildId)`. This lets
 * callers that already fetched the locale (e.g., embed commands) reuse it
 * and avoid an extra DB read.
 */
export async function replyV2(
  interaction: ChatInputCommandInteraction,
  options: V2ResponseOptions,
  locale?: BotLocale,
) {
  const resolved = locale ?? (await getGuildLocale(interaction.guildId));
  const localized = {
    ...options,
    title: options.title ? translateText(options.title, resolved) : undefined,
    body: translateText(options.body, resolved),
  };
  return interaction.reply({
    flags: MessageFlags.IsComponentsV2 | (options.ephemeral ? MessageFlags.Ephemeral : 0),
    components: [containerResponse(localized)],
    ...(options.files ? { files: options.files } : {}),
  });
}

export async function editV2(
  interaction: ChatInputCommandInteraction,
  options: V2ResponseOptions,
  locale?: BotLocale,
) {
  const resolved = locale ?? (await getGuildLocale(interaction.guildId));
  const localized = {
    ...options,
    title: options.title ? translateText(options.title, resolved) : undefined,
    body: translateText(options.body, resolved),
  };
  return interaction.editReply({
    flags: MessageFlags.IsComponentsV2,
    components: [containerResponse(localized)],
    ...(options.files ? { files: options.files } : {}),
  });
}

/**
 * Reply with a (localized) embed. The embed's title/description/fields/footer
 * are translated via the modular locale folder before sending.
 * Prefer V2 (`replyV2`) for new flows — this is for legacy embed commands.
 */
export async function replyEmbed(
  interaction: ChatInputCommandInteraction,
  embed: EmbedBuilder,
  opts?: { ephemeral?: boolean; locale?: BotLocale },
) {
  const resolved = opts?.locale ?? (await getGuildLocale(interaction.guildId));
  localizeEmbed(embed, resolved);
  return interaction.reply({ embeds: [embed], ephemeral: opts?.ephemeral });
}

export function botInviteUrl() {
  const clientId = process.env.BOT_OAUTH_CLIENT_ID;
  return clientId
    ? `https://discord.com/oauth2/authorize?client_id=${encodeURIComponent(clientId)}&permissions=8&scope=bot%20applications.commands`
    : undefined;
}
