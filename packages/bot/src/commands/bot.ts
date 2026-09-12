import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
} from "discord.js";
import { prisma } from "@aeris/shared";
import { aerisEmbed, COLORS } from "../lib/embeds.js";

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
      const invite = `https://discord.com/oauth2/authorize?client_id=${process.env.BOT_OAUTH_CLIENT_ID}&permissions=8&scope=bot%20applications.commands`;

      const embed = aerisEmbed()
        .setColor(COLORS.primary)
        .setTitle("🤖 Aeris")
        .setDescription("Feature-rich Discord bot with automod, leveling, economy, music, tickets, and more.")
        .addFields(
          { name: "Version", value: "0.1.0", inline: true },
          { name: "Library", value: "discord.js", inline: true },
          { name: "Shards", value: "1", inline: true },
          { name: "Permissions", value: "Administrator (full feature set)", inline: false },
        )
        .setURL(invite);

      await interaction.reply({ embeds: [embed] });
      return;
    }

    if (subcommand === "stats") {
      const guildCount = interaction.client.guilds.cache.size;
      const memberCount = interaction.client.guilds.cache.reduce(
        (acc, guild) => acc + guild.memberCount,
        0,
      );
      const uptime = process.uptime() | 0;
      const hours = Math.floor(uptime / 3600);
      const minutes = Math.floor((uptime % 3600) / 60);
      const seconds = uptime % 60;
      const uptimeStr = `${hours}h ${minutes}m ${seconds}s`;

      const embed = aerisEmbed()
        .setColor(COLORS.primary)
        .setTitle("📊 Bot Stats")
        .addFields(
          { name: "Guilds", value: guildCount.toLocaleString(), inline: true },
          { name: "Members", value: memberCount.toLocaleString(), inline: true },
          { name: "Uptime", value: uptimeStr, inline: true },
        );

      await interaction.reply({ embeds: [embed] });
    }
  },
};
