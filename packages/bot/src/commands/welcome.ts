import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  PermissionFlagsBits,
  ChannelType,
} from "discord.js";
import { prisma } from "@aeris/shared";
import { successEmbed, aerisEmbed, COLORS } from "../lib/embeds.js";
import { getGuildLocale } from "../locale.js";
import { localizeEmbed } from "../lib/embeds.js";

export default {
  data: new SlashCommandBuilder()
    .setName("welcome")
    .setDescription("Welcome message configuration")
    .addSubcommand((sub) =>
      sub
        .setName("channel")
        .setDescription("Set the welcome channel")
        .addChannelOption((o) =>
          o.setName("channel").setDescription("Channel for welcome messages").setRequired(true).addChannelTypes(ChannelType.GuildText),
        ),
    )
    .addSubcommand((sub) =>
      sub
        .setName("message")
        .setDescription("Set the welcome message")
        .addStringOption((o) =>
          o.setName("text").setDescription("Use {user}, {server}, {mention} placeholders").setRequired(true),
        ),
    )
    .addSubcommand((sub) =>
      sub
        .setName("dm")
        .setDescription("Toggle welcome DMs")
        .addBooleanOption((o) => o.setName("enabled").setDescription("Enable or disable DMs").setRequired(true))
        .addStringOption((o) => o.setName("text").setDescription("DM message body").setRequired(false)),
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),
  async execute(interaction: ChatInputCommandInteraction) {
    const locale = await getGuildLocale(interaction.guildId);
    const guildId = interaction.guildId!;
    const subcommand = interaction.options.getSubcommand();

    await prisma.welcomeConfig.upsert({ where: { guildId }, create: { id: guildId, guildId }, update: {} });

    if (subcommand === "channel") {
      const channel = interaction.options.getChannel("channel")!;
      await prisma.welcomeConfig.update({ where: { guildId }, data: { channelId: channel.id } });
      const embed = successEmbed(
        "Welcome Channel Set",
        `Welcome messages will now be sent to ${channel}.`,
      );
      localizeEmbed(embed, locale);
      await interaction.reply({ embeds: [embed] });
    } else if (subcommand === "message") {
      const text = interaction.options.getString("text")!;
      await prisma.welcomeConfig.update({ where: { guildId }, data: { message: text } });
      const embed = successEmbed(
        "Welcome Message Updated",
        `New welcome message:\n\n${text}`,
      );
      localizeEmbed(embed, locale);
      await interaction.reply({ embeds: [embed] });
    } else if (subcommand === "dm") {
      const enabled = interaction.options.getBoolean("enabled")!;
      const text = interaction.options.getString("text");
      await prisma.welcomeConfig.update({
        where: { guildId },
        data: { dmEnabled: enabled, ...(text ? { dmMessage: text } : {}) },
      });
      const embed = successEmbed(
        `Welcome DMs ${enabled ? "Enabled" : "Disabled"}`,
        enabled ? "New members will receive a DM on join." : "DMs have been turned off.",
      );
      localizeEmbed(embed, locale);
      await interaction.reply({ embeds: [embed] });
    }
  },
};
