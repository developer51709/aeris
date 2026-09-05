import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  ChannelType,
  UserFlags,
} from "discord.js";
import { prisma } from "@aeris/shared";
import { generateLevelUpCard, generateLeaderboardCard } from "../image/cards.js";

export default {
  data: new SlashCommandBuilder()
    .setName("leveling")
    .setDescription("Leveling system commands")
    .addSubcommand((sub) =>
      sub
        .setName("profile")
        .setDescription("View your or another user's leveling profile")
        .addUserOption((opt) =>
          opt.setName("user").setDescription("User to view").setRequired(false),
        ),
    )
    .addSubcommand((sub) =>
      sub
        .setName("rank")
        .setDescription("View your rank on the leaderboard")
        .addUserOption((opt) =>
          opt.setName("user").setDescription("User to view").setRequired(false),
        ),
    )
    .addSubcommand((sub) =>
      sub
        .setName("leaderboard")
        .setDescription("View the server leveling leaderboard")
        .addIntegerOption((opt) =>
          opt
            .setName("page")
            .setDescription("Page number")
            .setMinValue(1)
            .setMaxValue(100)
            .setRequired(false),
        ),
    ),
  async execute(interaction: ChatInputCommandInteraction) {
    const guildId = interaction.guildId!;
    const subcommand = interaction.options.getSubcommand();
    const target = interaction.options.getUser("user") ?? interaction.user;

    switch (subcommand) {
      case "profile":
        return handleProfile(interaction, guildId, target);
      case "rank":
        return handleRank(interaction, guildId, target);
      case "leaderboard":
        return handleLeaderboard(interaction, guildId);
    }
  },
};

async function handleProfile(
  interaction: ChatInputCommandInteraction,
  guildId: string,
  target: { id: string; username: string | undefined },
) {
  const data = await prisma.levelingData.findUnique({
    where: { id: `${guildId}:${target.id}` },
  });

  const profile = data ?? { level: 1, xp: 0, totalXp: 0, userId: target.id, guildId };
  const requiredXp = profile.level * 100 + 50;
  const progress = Math.min(100, Math.round((profile.xp / requiredXp) * 100));

  const embed = {
    title: `Level ${profile.level} — ${target.username ?? target.id}`,
    description: [
      `**XP:** ${profile.xp.toLocaleString()}`,
      `**Total XP:** ${profile.totalXp.toLocaleString()}`,
      `**Next Level:** ${requiredXp.toLocaleString()} XP`,
      ``,
      `Progress: ${progress}%`,
    ].join("\n"),
    color: 0x2b8c5e,
    thumbnail: {
      url: target.id !== interaction.user.id
        ? `https://cdn.discordapp.com/avatars/${target.id}/${target.username ? "0.png" : null}`
        : `https://cdn.discordapp.com/avatars/${interaction.user.id}/${interaction.user.avatar ? interaction.user.avatar.split(".")[0] + ".png" : null}`,
    },
  };

  await interaction.reply({ content: "", components: [] });
  await interaction.editReply({
    content: "```",
    components: [],
  });
  // Use placeholder reply since CV2 embeds are not available in base discord.js types
  await interaction.editReply({
    content: [
      `**Level ${profile.level}** — ${target.username ?? "Unknown"}`,
      `XP: ${profile.xp.toLocaleString()} / ${requiredXp.toLocaleString()}`,
      `Total XP: ${profile.totalXp.toLocaleString()} | Progress: ${progress}%`,
    ].join("\n"),
    components: [],
    embeds: [],
  });
}

async function handleRank(
  interaction: ChatInputCommandInteraction,
  guildId: string,
  target: { id: string; username: string | undefined },
) {
  const entries = await prisma
    .levelingData.findMany({
      where: { guildId },
      orderBy: { totalXp: "desc" },
    })
    .catch(() => []);

  const rank = (entries as { userId: string }[]).findIndex((e) => e.userId === target.id) + 1;
  const total = (entries as unknown[]).length;
  const place = rank > 0 ? rank : "—";

  const data = (entries as { userId: string; level: number; totalXp: number }[]).find((e) => e.userId === target.id);

  const content = [
    `**Leaderboard Rank** — ${target.username ?? "Unknown"}`,
    `Rank: #${place ?? "—"} / ${total}`,
    data
      ? `Level: ${data.level} | XP: ${data.totalXp.toLocaleString()}`
      : `No data yet`,
  ].join("\n");

  await interaction.reply({ content, components: [] });
}

async function handleLeaderboard(
  interaction: ChatInputCommandInteraction,
  guildId: string,
) {
  const page = (interaction.options.getInteger("page") ?? 1) - 1;
  const entries = await prisma
    .levelingData.findMany({
      where: { guildId },
      orderBy: { totalXp: "desc" },
    })
    .catch(() => []);

  const pageEntries = (entries as { userId: string; level: number; totalXp: number }[]).slice(page * 10, page * 10 + 10);
  if (pageEntries.length === 0) {
    await interaction.reply({
      content: page === 0
        ? "No one has earned XP yet."
        : "No entries on this page.",
      components: [],
    });
    return;
  }

  const lines = pageEntries.map((e: { userId: string; level: number; totalXp: number }, i: number) => {
    const rank = page * 10 + i + 1;
    const medal = rank === 1 ? "🥇" : rank === 2 ? "🥈" : rank === 3 ? "🥉" : `#${rank}`;
    const user = e.userId;
    const name = `<@${user}>`;
    return `${medal}  ${name} — Lv.${e.level} | ${e.totalXp.toLocaleString()} XP`;
  });

  const content = [
    "**Leaderboard**",
    ...lines,
  ].join("\n");

  await interaction.reply({ content, components: [] });
}

async function handleLevelUpCard(
  interaction: ChatInputCommandInteraction,
  guildId: string,
) {
  const targetId = interaction.options.getUser("user")?.id ?? interaction.user.id;
  const data = await prisma.levelingData.findUnique({
    where: { id: `${guildId}:${targetId}` },
  });

  if (!data) {
    await interaction.reply({ content: "No data for that user.", components: [] });
    return;
  }

  const card = await generateLeaderboardCard(
    guildId,
    [{ userId: targetId, level: data.level, xp: data.totalXp }],
  );

  await interaction.reply({ content: "Card generated.", components: [] });
}
