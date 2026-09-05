import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  PermissionFlagsBits,
  ChannelType,
} from "discord.js";
import { prisma } from "@aeris/shared";

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
    const guildId = interaction.guildId!;
    const subcommand = interaction.options.getSubcommand();

    await prisma.welcomeConfig.upsert({ where: { guildId }, create: { id: guildId, guildId }, update: {} });

    if (subcommand === "channel") {
      const channel = interaction.options.getChannel("channel")!;
      await prisma.welcomeConfig.update({ where: { guildId }, data: { channelId: channel.id } });
      await interaction.reply({ content: `✅ Welcome channel set to ${channel}.` });
    } else if (subcommand === "message") {
      const text = interaction.options.getString("text")!;
      await prisma.welcomeConfig.update({ where: { guildId }, data: { message: text } });
      await interaction.reply({ content: "✅ Welcome message updated." });
    } else if (subcommand === "dm") {
      const enabled = interaction.options.getBoolean("enabled")!;
      const text = interaction.options.getString("text");
      await prisma.welcomeConfig.update({
        where: { guildId },
        data: { dmEnabled: enabled, ...(text ? { dmMessage: text } : {}) },
      });
      await interaction.reply({ content: `✅ Welcome DMs ${enabled ? "enabled" : "disabled"}.` });
    }
  },
};
