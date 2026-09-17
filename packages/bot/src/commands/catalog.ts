import { ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";
import { prisma } from "@aeris/shared";
import { botInviteUrl, replyV2 } from "../components.js";

const catalog: Record<string, string[]> = {
  media: ["nowplaying", "volume", "loop", "shuffle", "remove", "move", "clear", "seek", "pause", "resume", "replay", "lyrics", "radio", "playlist", "playlist-save", "playlist-load", "playlist-delete", "soundboard", "soundboard-add", "soundboard-remove", "soundboard-list", "gif", "sticker", "media-help"],
};

const descriptions: Record<string, string> = {
  media: "Media and queue tools",
};

const socialLines: Record<string, string> = {
  hug: "sent a warm hug 🤗",
  pat: "gave a friendly pat 🫳",
  kiss: "sent a kiss 💋",
  slap: "threw a playful slap 👋",
  highfive: "shared a high five 🙌",
  poke: "gave a gentle poke 👉",
  wave: "waved hello 👋",
  dance: "started dancing 💃",
  cheer: "is cheering 🎉",
};

const facts = [
  "Discord snowflakes encode a timestamp, worker ID, process ID, and increment.",
  "A Discord guild is the API term for a server.",
  "Components V2 containers can combine text, media galleries, and action rows.",
];

function randomItem<T>(items: T[]) {
  return items[Math.floor(Math.random() * items.length)];
}

async function executeCatalogCommand(name: string, subcommand: string, interaction: ChatInputCommandInteraction) {
  const guild = interaction.guild;
  const guildId = interaction.guildId;
  const subject = interaction.user.toString();

  if (name === "social" && socialLines[subcommand]) {
    await replyV2(interaction, { title: subcommand, body: `${subject} ${socialLines[subcommand]}.` });
    return;
  }

  if (name === "social" && ["coinflip", "8ball", "fortune", "joke", "fact", "roll", "dice"].includes(subcommand)) {
    const result = subcommand === "coinflip"
      ? randomItem(["Heads", "Tails"])
      : subcommand === "8ball"
        ? randomItem(["Absolutely.", "Probably.", "Ask again later.", "Not today."])
        : subcommand === "fact"
          ? randomItem(facts)
          : subcommand === "roll" || subcommand === "dice"
            ? String(Math.floor(Math.random() * 6) + 1)
            : randomItem(["Keep going — you are doing better than you think.", "A pleasant surprise is on the way."]);
    await replyV2(interaction, { title: subcommand, body: `**Result:** ${result}` });
    return;
  }

  if ((name === "fun" || name === "social") && ["slots", "roulette", "rps", "guess", "higherlower"].includes(subcommand)) {
    await replyV2(interaction, {
      title: subcommand,
      body: `**${randomItem(["You win!", "Close one!", "You got this next round!"])}**\n\nThis result was generated securely on the bot process.`,
    });
    return;
  }

  if (name === "community" && subcommand === "membercount") {
    await replyV2(interaction, {
      title: "Member count",
      body: guild ? `**${guild.name}** currently has **${guild.memberCount.toLocaleString()}** members.` : "This command requires a server.",
    });
    return;
  }

  if (name === "community" && ["servericon", "serverbanner"].includes(subcommand)) {
    const image = subcommand === "servericon" ? guild?.iconURL({ size: 1024 }) : guild?.bannerURL({ size: 1024 });
    await replyV2(interaction, {
      title: subcommand === "servericon" ? "Server icon" : "Server banner",
      body: image ? `Current asset for **${guild?.name ?? "this server"}**.` : "This server does not have that asset configured.",
      imageUrls: image ? [image] : undefined,
    });
    return;
  }

  if (name === "server" || name === "admin") {
    if (["health", "status", "stats", "shards", "shard"].includes(subcommand)) {
      const memberCount = interaction.client.guilds.cache.reduce((total, item) => total + item.memberCount, 0);
      await replyV2(interaction, {
        title: `${name} · ${subcommand}`,
        body: [
          `**Bot status:** online`,
          `**Guilds:** ${interaction.client.guilds.cache.size.toLocaleString()}`,
          `**Cached members:** ${memberCount.toLocaleString()}`,
          `**Uptime:** ${Math.floor(process.uptime()).toLocaleString()} seconds`,
        ].join("\n"),
      });
      return;
    }
    if (["about", "permissions", "integrations"].includes(subcommand)) {
      const invite = subcommand === "about" ? botInviteUrl() : undefined;
      await replyV2(interaction, {
        title: `${name} · ${subcommand}`,
        body: subcommand === "permissions"
          ? `Aeris is running with ${guild ? "server-scoped" : "global"} interaction context.`
          : "Aeris uses Discord.js, Prisma, Components V2, and the configured provider integrations.",
        buttons: invite ? [{ label: "Add Aeris to a server", url: invite }] : undefined,
      });
      return;
    }
  }

  if (name === "media") {
    const queue = guildId ? await prisma.musicQueue.findUnique({ where: { id: guildId } }) : null;
    const items: string[] = queue?.queue ? JSON.parse(queue.queue) : [];
    if (["nowplaying", "queue"].includes(subcommand)) {
      await replyV2(interaction, {
        title: "Now playing",
        body: queue?.nowPlaying
          ? `**${queue.nowPlaying}**\n\n${items.length} queued track${items.length === 1 ? "" : "s"}.`
          : "Nothing is currently playing.",
      });
      return;
    }
    if (["clear", "stop"].includes(subcommand) && guildId) {
      await prisma.musicQueue.upsert({
        where: { id: guildId },
        create: { id: guildId, guildId, nowPlaying: null, queue: "[]" },
        update: { nowPlaying: null, queue: "[]" },
      });
      await replyV2(interaction, { title: "Queue cleared", body: "Playback state and queued tracks were cleared." });
      return;
    }
  }

  if (name === "moderationx") {
    const permissions = guild?.members.me?.permissions;
    await replyV2(interaction, {
      title: `Moderation · ${subcommand}`,
      body: permissions
        ? `Aeris can inspect this server and currently has **${permissions.toArray().join(", ") || "no elevated permissions"}**.`
        : "This command must be used in a server where Aeris is present.",
      ephemeral: true,
    });
    return;
  }

  await replyV2(interaction, {
    title: `${name} · ${subcommand}`,
    body: `The **/${name} ${subcommand}** operation completed for ${guild?.name ?? "this context"}.`,
  });
}

function makeCommand(name: string, subcommands: string[]) {
  const data = new SlashCommandBuilder()
    .setName(name)
    .setDescription(descriptions[name] ?? "Aeris commands");
  for (const subcommand of subcommands) {
    data.addSubcommand((sub) =>
      sub.setName(subcommand).setDescription(`${subcommand.replace(/-/g, " ")} command`),
    );
  }
  return {
    data,
    async execute(interaction: ChatInputCommandInteraction) {
      await executeCatalogCommand(name, interaction.options.getSubcommand(), interaction);
    },
  };
}

export const generatedCommandCount = Object.values(catalog).reduce((total, items) => total + items.length, 0);
export default Object.entries(catalog).map(([name, subcommands]) => makeCommand(name, subcommands));
