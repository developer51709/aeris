import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  SlashCommandSubcommandsOnlyBuilder,
} from "discord.js";
import { prisma } from "@aeris/shared";

export default {
  data: new SlashCommandBuilder()
    .setName("bot")
    .setDescription("Aeris bot management commands")
    .addSubcommand((sub) =>
      sub
        .setName("info")
        .setDescription("Show Aeris bot information"),
    )
    .addSubcommand((sub) =>
      sub
        .setName("stats")
        .setDescription("Show bot runtime stats"),
    ),
  async execute(interaction: ChatInputCommandInteraction) {
    const subcommand = interaction.options.getSubcommand();

    if (subcommand === "info") {
      const info = {
        name: "Aeris",
        description: "Feature-rich Discord bot with automod, leveling, economy, music, tickets, and more.",
        library: "discord.js",
        shards: 1,
        invite: `https://discord.com/oauth2/authorize?client_id=${process.env.BOT_OAUTH_CLIENT_ID}&permissions=8&scope=bot%20applications.commands`,
        docs: "https://aeris.example/docs",
      };

      await interaction.reply({
        content: [
          `**${info.name}**`,
          `Version: 0.1.0`,
          `Libraries: ${info.library}`,
          `Shards: ${info.shards}`,
          `Permissions: Administrator (for full feature set)`,
          `Invite: ${info.invite}`,
          `Docs: ${info.docs}`,
        ].join("\n"),
        components: [],
      });
      return;
    }

    if (subcommand === "stats") {
      const guildCount = interaction.client.guilds.cache.size;
      const memberCount = interaction.client.guilds.cache.reduce(
        (acc, guild) => acc + guild.memberCount,
        0,
      );

      await interaction.reply({
        content: [
          `**Bot Stats**`,
          `• Guilds: ${guildCount}`,
          `• Members: ${memberCount}`,
          `• Uptime: ${process.uptime() | 0}s`,
        ].join("\n"),
        components: [],
      });
    }
  },
}
