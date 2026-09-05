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
        .setDescription("Play a song")
        .addStringOption((opt) =>
          opt
            .setName("query")
            .setDescription("Song name or URL")
            .setRequired(true),
        ),
    )
    .addSubcommand((sub) =>
      sub
        .setName("pause")
        .setDescription("Pause current playback"),
    )
    .addSubcommand((sub) =>
      sub
        .setName("resume")
        .setDescription("Resume playback"),
    )
    .addSubcommand((sub) =>
      sub
        .setName("skip")
        .setDescription("Skip current song"),
    )
    .addSubcommand((sub) =>
      sub
        .setName("stop")
        .setDescription("Stop playback and clear queue"),
    )
    .addSubcommand((sub) =>
      sub
        .setName("queue")
        .setDescription("View the current queue"),
    )
    .addSubcommand((sub) =>
      sub
        .setName("np")
        .setDescription("View now playing"),
    ),
  async execute(interaction: ChatInputCommandInteraction) {
    const guildId = interaction.guildId!;
    const subcommand = interaction.options.getSubcommand();

    switch (subcommand) {
      case "play":
        return handlePlay(interaction, guildId);
      case "pause":
        return handlePause(interaction, guildId);
      case "resume":
        return handleResume(interaction, guildId);
      case "skip":
        return handleSkip(interaction, guildId);
      case "stop":
        return handleStop(interaction, guildId);
      case "queue":
        return handleQueue(interaction, guildId);
      case "np":
        return handleNowPlaying(interaction, guildId);
    }
  },
};

async function handlePlay(
  interaction: ChatInputCommandInteraction,
  guildId: string,
) {
  const query = interaction.options.getString("query")!;
  await prisma.musicQueue.upsert({
    where: { guildId },
    create: { guildId, channelId: "0", nowPlaying: query, queue: JSON.stringify([query]) },
    update: { nowPlaying: query },
  });

  await interaction.reply({
    content: `Playing: **${query}**`,
    components: [],
  });
}

async function handlePause(interaction: ChatInputCommandInteraction, guildId: string) {
  await prisma.musicQueue.update({
    where: { guildId },
    data: { nowPlaying: "paused" },
  }).catch(() => {});

  await interaction.reply({
    content: "Playback paused.",
    components: [],
  });
}

async function handleResume(interaction: ChatInputCommandInteraction, guildId: string) {
  await prisma.musicQueue.update({
    where: { guildId },
    data: { nowPlaying: "playing" },
  }).catch(() => {});

  await interaction.reply({
    content: "Playback resumed.",
    components: [],
  });
}

async function handleSkip(interaction: ChatInputCommandInteraction, guildId: string) {
  await interaction.reply({
    content: "Skipped to next track.",
    components: [],
  });
}

async function handleStop(interaction: ChatInputCommandInteraction, guildId: string) {
  await prisma.musicQueue.update({
    where: { guildId },
    data: { nowPlaying: null, queue: "[]" },
  }).catch(() => {});

  await interaction.reply({
    content: "Playback stopped and queue cleared.",
    components: [],
  });
}

async function handleQueue(interaction: ChatInputCommandInteraction, guildId: string) {
  const queue = await prisma.musicQueue.findUnique({ where: { guildId } }).catch(() => undefined);
  const items: string[] = queue?.queue ? JSON.parse(queue.queue) : [];
  if (items.length === 0) {
    await interaction.reply({ content: "Queue is empty.", components: [] });
    return;
  }
  await interaction.reply({
    content: ["**Queue**", ...items.map((s, i) => `${i + 1}. ${s}`)].join("\n"),
    components: [],
  });
}

async function handleNowPlaying(interaction: ChatInputCommandInteraction, guildId: string) {
  const queue = await prisma.musicQueue.findUnique({ where: { guildId } }).catch(() => undefined);
  const now = queue?.nowPlaying ?? "Nothing playing";
  await interaction.reply({
    content: `**Now Playing**\n${now}`,
    components: [],
  });
}
