import { Message, MessageFlags, PermissionFlagsBits } from "discord.js";
import { containerResponse } from "../components.js";
import { prisma } from "@aeris/shared";
import { loadTrack } from "../music/lavalink.js";

const random = <T>(items: T[]) => items[Math.floor(Math.random() * items.length)];

const prefixCommands: Record<string, string> = {
  "community": "community",
  "moderationx": "moderationx",
  "server": "server",
  "social": "social",
  "fun": "fun",
  "media": "media",
  "admin": "admin",
  "lookup": "lookup",
  "movies": "movies",
  "image": "image",
};

const subcommands: Record<string, string[]> = {
  community: ["announce", "poll", "suggest", "starboard", "quote", "afk", "remind", "birthday", "role", "roles", "membercount", "servericon", "serverbanner", "boosters", "invites", "activity", "profile", "rep", "repboard", "events", "giveaway", "giveaway-end", "giveaway-reroll", "feedback", "slowmode"],
  moderationx: ["clear", "purge", "slowmode", "lock", "unlock", "hide", "unhide", "timeout", "untimeout", "softban", "unban", "modlog", "history", "notes", "case", "cases", "massrole", "nick", "resetnick", "dehoist", "striproles", "verify", "unverify", "quarantine", "audit"],
  server: ["settings", "prefix", "locale", "timezone", "channels", "roles", "permissions", "modules", "module", "logs", "log-channel", "welcome", "goodbye", "autorole", "autoroles", "rules", "verification", "vanity", "icon", "banner", "features", "backup", "backup-list", "backup-load", "health"],
  social: ["hug", "pat", "kiss", "slap", "highfive", "poke", "wave", "dance", "cheer", "ship", "match", "rate", "8ball", "coinflip", "roll", "choose", "fortune", "meme", "joke", "fact", "quote", "ascii", "color", "avatar", "banner"],
  fun: ["trivia", "trivia-start", "trivia-stop", "rps", "hangman", "wordle", "scramble", "typerace", "duel", "duel-accept", "duel-decline", "minesweeper", "connect4", "tictactoe", "blackjack-help", "slots", "roulette", "dice", "guess", "higherlower", "memory", "quiz", "wouldyourather", "neverhavei", "truthordare"],
  media: ["nowplaying", "volume", "loop", "shuffle", "remove", "move", "clear", "seek", "pause", "resume", "replay", "lyrics", "radio", "playlist", "playlist-save", "playlist-load", "playlist-delete", "soundboard", "soundboard-add", "soundboard-remove", "soundboard-list", "image", "gif", "sticker", "media-help"],
  admin: ["maintenance", "announce", "broadcast", "reload", "status", "stats", "shard", "shards", "permissions", "integrations", "integration", "webhooks", "webhook-create", "webhook-delete", "webhook-list", "autoresponder", "autoresponder-add", "autoresponder-remove", "autoresponder-list", "command", "command-enable", "command-disable", "command-permissions", "about"],
  lookup: ["minecraft-player", "minecraft-server", "roblox-user", "roblox-game"],
  movies: ["search", "movie", "tv"],
  image: ["avatar", "transform", "generate"],
};

for (const [root, children] of Object.entries(subcommands)) {
  for (const child of children) prefixCommands[`${root} ${child}`] = `${root} ${child}`;
}

export const prefixCommandCount = Object.keys(prefixCommands).length;

export async function onPrefixMessage(message: Message) {
  if (message.author.bot || !message.guild) return;
  const prefix = process.env.DISCORD_PREFIX ?? "!";
  if (!message.content.startsWith(prefix)) return;

  const tokens = message.content.slice(prefix.length).trim().split(/\s+/);
  const root = tokens.shift()?.toLowerCase();
  if (!root) return;
  const key = [root, tokens[0]?.toLowerCase()].filter(Boolean).join(" ");
  const command = prefixCommands[key] ?? prefixCommands[root];
  if (!command) return;

  if (root === "fun" && ["coinflip", "dice", "joke", "fact", "fortune", "8ball"].includes(tokens[0]?.toLowerCase() ?? "")) {
    const subcommand = tokens[0]?.toLowerCase();
    const body = subcommand === "coinflip"
      ? `The coin landed on **${random(["Heads", "Tails"])}**.`
      : subcommand === "dice"
        ? `You rolled **${Math.floor(Math.random() * 6) + 1}** on a d6.`
        : subcommand === "joke"
          ? random(["Why did the developer go broke? They used up all their cache.", "I would tell you a UDP joke, but you might not get it."])
          : subcommand === "fact"
            ? random(["Octopuses have three hearts.", "A day on Venus is longer than its year."])
            : subcommand === "fortune"
              ? random(["A small decision will open a big door.", "Your persistence is about to pay off."])
              : random(["Absolutely.", "Most likely.", "Ask again later."]);
    await message.reply({ flags: MessageFlags.IsComponentsV2, components: [containerResponse({ title: `Fun · ${subcommand}`, body })] });
    return;
  }

  if (root === "admin" && ["status", "stats", "shards", "about", "permissions", "integrations", "command-permissions"].includes(tokens[0]?.toLowerCase() ?? "")) {
    const members = message.client.guilds.cache.reduce((total, guild) => total + guild.memberCount, 0);
    const subcommand = tokens[0]?.toLowerCase();
    const body = subcommand === "permissions"
      ? `Aeris permissions: ${message.guild.members.me?.permissions.toArray().join(", ") || "none"}`
      : subcommand === "integrations"
        ? `AI: ${process.env.AI_API_KEY ? "configured" : "not configured"} · TMDB: ${process.env.TMDB_API_KEY ? "configured" : "not configured"} · Lavalink: ${process.env.LAVALINK_NODES || process.env.LAVALINK_NODE_URLS ? "configured" : "not configured"}`
        : `Guilds: ${message.client.guilds.cache.size.toLocaleString()}\nCached members: ${members.toLocaleString()}\nLatency: ${message.client.ws.ping}ms\nUptime: ${Math.floor(process.uptime()).toLocaleString()} seconds`;
    await message.reply({ flags: MessageFlags.IsComponentsV2, components: [containerResponse({ title: `Admin · ${subcommand}`, body })] });
    return;
  }

  if (root === "media") {
    const subcommand = tokens.shift()?.toLowerCase() ?? "nowplaying";
    const guildId = message.guild.id;
    const existing = await prisma.musicQueue.findUnique({ where: { id: guildId } });
    let queue: string[] = [];
    try { queue = existing?.queue ? JSON.parse(existing.queue) as string[] : []; } catch { queue = []; }
    if (subcommand === "nowplaying") {
      await message.reply({ flags: MessageFlags.IsComponentsV2, components: [containerResponse({ title: "Media · nowplaying", body: existing?.nowPlaying ? `**${existing.nowPlaying}**\\n${queue.length} queued track(s).` : "Nothing is currently playing." })] });
      return;
    }
    if (subcommand === "clear") {
      await prisma.musicQueue.upsert({ where: { id: guildId }, create: { id: guildId, guildId, nowPlaying: null, queue: "[]" }, update: { nowPlaying: null, queue: "[]" } });
      await message.reply({ flags: MessageFlags.IsComponentsV2, components: [containerResponse({ title: "Media · clear", body: "Playback state and the queue were cleared." })] });
      return;
    }
    if (subcommand === "shuffle") {
      for (let index = queue.length - 1; index > 0; index -= 1) { const swap = Math.floor(Math.random() * (index + 1)); [queue[index], queue[swap]] = [queue[swap], queue[index]]; }
      await prisma.musicQueue.upsert({ where: { id: guildId }, create: { id: guildId, guildId, nowPlaying: existing?.nowPlaying ?? null, queue: JSON.stringify(queue) }, update: { queue: JSON.stringify(queue) } });
      await message.reply({ flags: MessageFlags.IsComponentsV2, components: [containerResponse({ title: "Media · shuffle", body: `Shuffled **${queue.length}** queued tracks.` })] });
      return;
    }
    const query = tokens.join(" ").trim();
    if (!query) {
      await message.reply({ flags: MessageFlags.IsComponentsV2, components: [containerResponse({ title: "Media query required", body: `Usage: ${prefix}media play <song or URL>` })] });
      return;
    }
    try {
      const resolved = await loadTrack(query);
      const title = resolved.track.info?.title ?? query;
      const nextQueue = existing?.nowPlaying ? [...queue, title] : queue;
      await prisma.musicQueue.upsert({ where: { id: guildId }, create: { id: guildId, guildId, nowPlaying: existing?.nowPlaying ?? title, queue: JSON.stringify(nextQueue) }, update: { nowPlaying: existing?.nowPlaying ?? title, queue: JSON.stringify(nextQueue) } });
      await message.reply({ flags: MessageFlags.IsComponentsV2, components: [containerResponse({ title: "Media · play", body: `Resolved **${title}** through Lavalink node **${resolved.node}**.` })] });
    } catch (error) {
      await message.reply({ flags: MessageFlags.IsComponentsV2, components: [containerResponse({ title: "Media unavailable", body: error instanceof Error ? error.message : "All Lavalink nodes are unavailable." })] });
    }
    return;
  }

  if (root === "admin" && ["announce", "broadcast"].includes(tokens[0]?.toLowerCase() ?? "")) {
    const ownerIds = (process.env.BOT_OWNER_ID ?? "").split(",").map((id) => id.trim()).filter(Boolean);
    if (tokens[0] === "broadcast" && (!ownerIds.length || !ownerIds.includes(message.author.id))) {
      await message.reply({ flags: MessageFlags.IsComponentsV2, components: [containerResponse({ title: "Admin command denied", body: "Only the configured bot owner can use this broadcast command." })] });
      return;
    }
    if (tokens[0] !== "broadcast" && !message.member?.permissions.has(PermissionFlagsBits.ManageMessages)) {
      await message.reply({ flags: MessageFlags.IsComponentsV2, components: [containerResponse({ title: "Admin command denied", body: "Manage Messages is required for announcements." })] });
      return;
    }
    const text = tokens.slice(1).join(" ").trim();
    if (!text) {
      await message.reply({ flags: MessageFlags.IsComponentsV2, components: [containerResponse({ title: "Announcement text required", body: `Usage: ${prefix}admin ${tokens[0]} <message>` })] });
      return;
    }
    if (tokens[0] === "announce") {
      if ("send" in message.channel) await message.channel.send({ content: `📢 **Announcement from ${message.guild.name}**\\n${text}` });
    } else for (const guild of message.client.guilds.cache.values()) {
      const channel = guild.systemChannel;
      if (channel) await channel.send({ content: `📢 **Aeris announcement**\\n${text}` }).catch(() => undefined);
    }
    await message.reply({ flags: MessageFlags.IsComponentsV2, components: [containerResponse({ title: "Announcement sent", body: "The announcement operation completed." })] });
    return;
  }

  const description = command.includes(" ")
    ? `Prefix command **${prefix}${command}** is registered. Use the slash form for typed options and permission-safe execution.`
    : `Available prefix command group: **${prefix}${command}**. Add a subcommand to run an operation.`;
  await message.reply({
    flags: MessageFlags.IsComponentsV2,
    components: [containerResponse({ title: "Aeris prefix command", body: description })],
  });
}
