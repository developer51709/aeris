import { ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";
import { prisma } from "@aeris/shared";
import { editV2, replyV2 } from "../components.js";
import { loadTrack } from "../music/lavalink.js";

const data = new SlashCommandBuilder()
  .setName("music")
  .setDescription("Music playback and queue commands")
  .addSubcommand((sub) =>
    sub
      .setName("play")
      .setDescription("Resolve and queue a track through Lavalink")
      .addStringOption((option) =>
        option.setName("query").setDescription("Song name, URL, or search terms").setRequired(true),
      ),
  )
  .addSubcommand((sub) => sub.setName("skip").setDescription("Skip the current track"))
  .addSubcommand((sub) => sub.setName("stop").setDescription("Stop playback and clear the queue"))
  .addSubcommand((sub) => sub.setName("queue").setDescription("Show the current queue"))
  .addSubcommand((sub) => sub.setName("shuffle").setDescription("Shuffle queued tracks"))
  .addSubcommand((sub) => sub.setName("remove").setDescription("Remove a queued track").addIntegerOption((o) => o.setName("position").setDescription("Queue position").setMinValue(1).setRequired(true)));

function queueId(guildId: string) {
  return guildId;
}

export default {
  data,
  async execute(interaction: ChatInputCommandInteraction) {
    const guildId = interaction.guildId;
    if (!guildId) {
      await replyV2(interaction, { title: "Music unavailable", body: "Music commands can only be used inside a server.", ephemeral: true });
      return;
    }

    const subcommand = interaction.options.getSubcommand();
    if (subcommand === "play") {
      const query = interaction.options.getString("query", true);
      await interaction.deferReply();
      try {
        const resolved = await loadTrack(query);
        const existing = await prisma.musicQueue.findUnique({ where: { id: queueId(guildId) } });
        const queue: string[] = existing?.queue ? JSON.parse(existing.queue) : [];
        const title = resolved.track.info?.title ?? query;
        const nextQueue = existing?.nowPlaying ? [...queue, title] : queue;
        await prisma.musicQueue.upsert({
          where: { id: queueId(guildId) },
          create: { id: queueId(guildId), guildId, nowPlaying: existing?.nowPlaying ?? title, queue: JSON.stringify(nextQueue) },
          update: { nowPlaying: existing?.nowPlaying ?? title, queue: JSON.stringify(nextQueue) },
        });
        await editV2(interaction, {
          title: existing?.nowPlaying ? "Added to queue" : "Now playing",
          body: `**${title}**\nResolved through Lavalink node **${resolved.node}**.${existing?.nowPlaying ? "" : "\n\nConnect a Lavalink player to begin audio playback."}`,
        });
      } catch (error) {
        await editV2(interaction, {
          title: "Music unavailable",
          body: error instanceof Error ? error.message : "All configured Lavalink nodes are unavailable.",
        });
      }
      return;
    }

    const current = await prisma.musicQueue.findUnique({ where: { id: queueId(guildId) } });
    const queue: string[] = current?.queue ? JSON.parse(current.queue) : [];

    if (subcommand === "queue") {
      await replyV2(interaction, {
        title: "Music queue",
        body: current?.nowPlaying
          ? [`**Now playing:** ${current.nowPlaying}`, ...(queue.length ? ["", ...queue.slice(0, 10).map((item, index) => `**${index + 1}.** ${item}`)] : [])].join("\n")
          : "The queue is empty.",
      });
      return;
    }

    if (subcommand === "shuffle") {
      for (let index = queue.length - 1; index > 0; index -= 1) {
        const swap = Math.floor(Math.random() * (index + 1));
        [queue[index], queue[swap]] = [queue[swap], queue[index]];
      }
      await prisma.musicQueue.upsert({ where: { id: queueId(guildId) }, create: { id: queueId(guildId), guildId, nowPlaying: null, queue: JSON.stringify(queue) }, update: { queue: JSON.stringify(queue) } });
      await replyV2(interaction, { title: "Queue shuffled", body: queue.length ? `Shuffled **${queue.length}** queued tracks.` : "There are no queued tracks to shuffle." });
      return;
    }

    if (subcommand === "remove") {
      const position = interaction.options.getInteger("position", true) - 1;
      if (position >= queue.length) {
        await replyV2(interaction, { title: "Invalid queue position", body: `Choose a position from **1** to **${queue.length}**.`, ephemeral: true });
        return;
      }
      const [removed] = queue.splice(position, 1);
      await prisma.musicQueue.upsert({ where: { id: queueId(guildId) }, create: { id: queueId(guildId), guildId, nowPlaying: null, queue: JSON.stringify(queue) }, update: { queue: JSON.stringify(queue) } });
      await replyV2(interaction, { title: "Track removed", body: `Removed **${removed}** from the queue.` });
      return;
    }

    if (subcommand === "stop") {
      await prisma.musicQueue.upsert({
        where: { id: queueId(guildId) },
        create: { id: queueId(guildId), guildId, nowPlaying: null, queue: "[]" },
        update: { nowPlaying: null, queue: "[]" },
      });
      await replyV2(interaction, { title: "Playback stopped", body: "The current track and queue were cleared." });
      return;
    }

    const next = queue.shift() ?? null;
    await prisma.musicQueue.upsert({
      where: { id: queueId(guildId) },
      create: { id: queueId(guildId), guildId, nowPlaying: next, queue: JSON.stringify(queue) },
      update: { nowPlaying: next, queue: JSON.stringify(queue) },
    });
    await replyV2(interaction, {
      title: next ? "Skipped" : "Queue empty",
      body: next ? `The next track is **${next}**.` : "There are no more tracks in the queue.",
    });
  },
};
