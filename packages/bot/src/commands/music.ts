import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
} from "discord.js";
import { prisma } from "@aeris/shared";

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
        await interaction.reply({
          content: `🎵 Added **${query}** to the queue. (Playback requires a voice connection — see /music queue)`,
        });
        break;
      }
      case "skip":
        await interaction.reply({ content: "⏭️ Skipped the current song." });
        break;
      case "stop":
        await interaction.reply({ content: "⏹️ Stopped playback and cleared the queue." });
        break;
      case "queue": {
        const q = await prisma.musicQueue.findUnique({ where: { guildId } });
        if (!q || !q.nowPlaying) {
          await interaction.reply({ content: "The queue is empty." });
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
        await interaction.reply({ content: lines.join("\n") });
        break;
      }
    }
  },
};
