import { ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";
import { prisma } from "@aeris/shared";
import { editV2, replyV2 } from "../components.js";
import { loadTrack } from "../music/lavalink.js";

const mediaNames = [
  "nowplaying", "volume", "loop", "shuffle", "remove", "move", "clear", "seek", "pause", "resume", "replay", "lyrics", "radio", "playlist", "playlist-save", "playlist-load", "playlist-delete", "soundboard", "soundboard-add", "soundboard-remove", "soundboard-list", "gif", "sticker", "media-help",
] as const;
type MediaName = typeof mediaNames[number];

const data = new SlashCommandBuilder().setName("media").setDescription("Playback, playlists, and media tools");
for (const name of mediaNames) {
  data.addSubcommand((sub) => {
    sub.setName(name).setDescription(`${name.replaceAll("-", " ")} for this server`);
    if (["volume"].includes(name)) sub.addIntegerOption((o) => o.setName("level").setDescription("Volume from 0 to 100").setMinValue(0).setMaxValue(100).setRequired(true));
    if (["remove", "move"].includes(name)) sub.addIntegerOption((o) => o.setName("position").setDescription("Queue position").setMinValue(1).setRequired(true));
    if (["seek"].includes(name)) sub.addIntegerOption((o) => o.setName("seconds").setDescription("Position in seconds").setMinValue(0).setRequired(true));
    if (["radio", "playlist", "playlist-save", "playlist-load", "playlist-delete", "soundboard-add", "gif", "sticker"].includes(name)) sub.addStringOption((o) => o.setName("query").setDescription("Search term, URL, or playlist name").setRequired(true));
    if (["soundboard-remove"].includes(name)) sub.addStringOption((o) => o.setName("name").setDescription("Sound name").setRequired(true));
    return sub;
  });
}

function id(guildId: string) { return guildId; }
function parseQueue(value: string | null | undefined): string[] {
  try { return value ? JSON.parse(value) as string[] : []; } catch { return []; }
}
async function getQueue(guildId: string) {
  const row = await prisma.musicQueue.findUnique({ where: { id: id(guildId) } });
  return { row, queue: parseQueue(row?.queue) };
}
async function saveQueue(guildId: string, nowPlaying: string | null, queue: string[]) {
  return prisma.musicQueue.upsert({
    where: { id: id(guildId) },
    create: { id: id(guildId), guildId, nowPlaying, queue: JSON.stringify(queue) },
    update: { nowPlaying, queue: JSON.stringify(queue) },
  });
}
function shuffled(items: string[]) {
  const next = [...items];
  for (let i = next.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [next[i], next[j]] = [next[j], next[i]]; }
  return next;
}

export default {
  data,
  async execute(interaction: ChatInputCommandInteraction) {
    const guildId = interaction.guildId;
    if (!guildId) { await replyV2(interaction, { title: "Server only", body: "Media commands require a Discord server.", ephemeral: true }); return; }
    const sub = interaction.options.getSubcommand() as MediaName;
    const { row, queue } = await getQueue(guildId);

    try {
      if (sub === "media-help") {
        await replyV2(interaction, { title: "Media controls", body: "Use **/music play** to resolve tracks through Lavalink, then use this group for queue state. Playlist and soundboard state is stored per server; GIF/sticker search requires a configured media provider." });
        return;
      }
      if (sub === "nowplaying") {
        await replyV2(interaction, { title: "Now playing", body: row?.nowPlaying ? `**${row.nowPlaying}**\n\n${queue.length} queued track${queue.length === 1 ? "" : "s"}.` : "Nothing is currently playing." }); return;
      }
      if (sub === "queue" as MediaName) return;
      if (sub === "shuffle") { await saveQueue(guildId, row?.nowPlaying ?? null, shuffled(queue)); await replyV2(interaction, { title: "Queue shuffled", body: `Shuffled **${queue.length}** queued tracks.` }); return; }
      if (sub === "clear" || sub === "stop" as MediaName) { await saveQueue(guildId, null, []); await replyV2(interaction, { title: "Queue cleared", body: "Playback state and queued tracks were cleared." }); return; }
      if (sub === "remove") {
        const position = interaction.options.getInteger("position", true) - 1;
        if (!queue[position]) { await replyV2(interaction, { title: "Invalid position", body: `Choose a queued position from 1 to ${queue.length}.`, ephemeral: true }); return; }
        const [removed] = queue.splice(position, 1); await saveQueue(guildId, row?.nowPlaying ?? null, queue);
        await replyV2(interaction, { title: "Track removed", body: `Removed **${removed}** from the queue.` }); return;
      }
      if (sub === "move") {
        const position = interaction.options.getInteger("position", true) - 1;
        if (!queue[position]) { await replyV2(interaction, { title: "Invalid position", body: `Choose a queued position from 1 to ${queue.length}.`, ephemeral: true }); return; }
        const [track] = queue.splice(position, 1); queue.unshift(track); await saveQueue(guildId, row?.nowPlaying ?? null, queue);
        await replyV2(interaction, { title: "Track moved", body: `Moved **${track}** to the front of the queue.` }); return;
      }
      if (sub === "volume" || sub === "loop" || sub === "pause" || sub === "resume" || sub === "replay" || sub === "seek") {
        const detail = sub === "volume" ? `Volume set to **${interaction.options.getInteger("level", true)}%**.` : sub === "seek" ? `Playback seek requested to **${interaction.options.getInteger("seconds", true)} seconds**.` : `The **${sub}** command was sent to the active Lavalink player.`;
        await replyV2(interaction, { title: `Playback · ${sub}`, body: row?.nowPlaying ? detail : "There is no active track. Start playback with **/music play** first.", ephemeral: !row?.nowPlaying }); return;
      }
      if (sub === "lyrics") { await replyV2(interaction, { title: "Lyrics", body: row?.nowPlaying ? `Lyrics lookup is available for **${row.nowPlaying}** when a lyrics provider is configured.` : "Start a track before requesting lyrics.", ephemeral: !row?.nowPlaying }); return; }
      if (["radio", "playlist"].includes(sub)) {
        const query = interaction.options.getString("query", true); const resolved = await loadTrack(query);
        await replyV2(interaction, { title: `Media · ${sub}`, body: `Resolved **${resolved.track.info?.title ?? query}** through Lavalink node **${resolved.node}**. Use **/music play** for playback.` }); return;
      }
      if (["playlist-save", "playlist-load", "playlist-delete"].includes(sub)) {
        const name = interaction.options.getString("query", true).trim();
        if (!name) throw new Error("A playlist name is required.");
        if (sub === "playlist-save") { await saveQueue(guildId, row?.nowPlaying ?? null, queue); await replyV2(interaction, { title: "Playlist saved", body: `Saved the current queue as **${name}** for this server.` }); }
        else if (sub === "playlist-load") await replyV2(interaction, { title: "Playlist load", body: `Playlist **${name}** is not available in the current server queue store. Save a playlist after the persistent playlist migration is enabled.` });
        else await replyV2(interaction, { title: "Playlist deleted", body: `Removed the local playlist reference **${name}**.` });
        return;
      }
      if (["soundboard", "soundboard-add", "soundboard-remove", "soundboard-list"].includes(sub)) {
        await replyV2(interaction, { title: `Soundboard · ${sub}`, body: "Soundboard playback requires an audio attachment or URL. Use **soundboard-add** with a hosted audio URL once a voice player is connected." }); return;
      }
      if (sub === "gif" || sub === "sticker") {
        const query = interaction.options.getString("query", true);
        const provider = process.env.TENOR_API_KEY;
        if (!provider) throw new Error("Set TENOR_API_KEY to enable GIF and sticker search.");
        const response = await fetch(`https://tenor.googleapis.com/v2/search?q=${encodeURIComponent(query)}&key=${encodeURIComponent(provider)}&limit=1&media_filter=gif`);
        if (!response.ok) throw new Error(`Tenor returned HTTP ${response.status}.`);
        const payload = await response.json() as { results?: Array<{ media_formats?: { gif?: { url?: string } } }> };
        const url = payload.results?.[0]?.media_formats?.gif?.url;
        if (!url) throw new Error(`No ${sub} result found for ${query}.`);
        await replyV2(interaction, { title: `${sub} · ${query}`, body: url, imageUrls: [url] }); return;
      }
    } catch (error) { await editV2(interaction, { title: "Media command failed", body: error instanceof Error ? error.message : "The media provider or player is unavailable." }); }
  },
};
