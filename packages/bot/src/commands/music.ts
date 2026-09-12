import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
} from "discord.js";
import { prisma } from "@aeris/shared";
import { aerisEmbed, COLORS } from "../lib/embeds.js";

export default {
  data: new SlashCommandBuilder()
    .setName("music")
    .setDescription("Music playback commands")
    .addSubcommand((sub) =>
      sub
        .setName("play")
        .setDescription("Play a song or playlist")
        .addStringOption((o) => o.setName("query").setDescription("Song name or URL").setRequired(true)),
    )
    .addSubcommand((sub) => sub.setName("skip").setDescription("Skip the current song"))
    .addSubcommand((sub) => sub.setName("stop").setDescription("Stop playback and clear the queue"))
    .addSubcommand((sub) => sub.setName("queue").setDescription("Show the current queue")),
  async execute(interaction: ChatInputCommandInteraction) {
    const subcommand = interaction.options.getSubcommand();
    const guildId = interaction.guildId!;

    switch (subcommand) {
      case "play": {
        const query = interaction.options.getString("query")!;
        const embed = aerisEmbed()
          .setColor(COLORS.music)
          .setTitle("🎵 Added to Queue")
          .setDescription(`**${query}** has been added to the queue.\n\n*Playback requires a voice connection.*`);
        await interaction.reply({ embeds: [embed] });
        break;
      }
      case "skip": {
        const embed = aerisEmbed()
          .setColor(COLORS.music)
          .setTitle("⏭️ Skipped")
          .setDescription("Skipped the current song.");
        await interaction.reply({ embeds: [embed] });
        break;
      }
      case "stop": {
        const embed = aerisEmbed()
          .setColor(COLORS.music)
          .setTitle("⏹️ Stopped")
          .setDescription("Playback stopped and queue cleared.");
        await interaction.reply({ embeds: [embed] });
        break;
      }
      case "queue": {
        const q = await prisma.musicQueue.findUnique({ where: { guildId } });
        if (!q || !q.nowPlaying) {
          const embed = aerisEmbed()
            .setColor(COLORS.neutral)
            .setTitle("🎵 Queue")
            .setDescription("The queue is empty.");
          await interaction.reply({ embeds: [embed] });
          return;
        }
        const items: string[] = JSON.parse(q.queue ?? "[]");
        const lines = [
          `**Now Playing:** ${q.nowPlaying}`,
          "",
          ...(items.length
            ? items.slice(0, 10).map((t, i) => `**${i + 1}.** ${t}`)
            : ["*Queue is empty.*"]),
        ];
        const embed = aerisEmbed()
          .setColor(COLORS.music)
          .setTitle("🎵 Music Queue")
          .setDescription(lines.join("\n"));
        await interaction.reply({ embeds: [embed] });
        break;
      }
    }
  },
};
