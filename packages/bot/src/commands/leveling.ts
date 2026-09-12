import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
} from "discord.js";
import { prisma } from "@aeris/shared";
import { aerisEmbed, COLORS } from "../lib/embeds.js";

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
  target: { id: string; username: string | null; avatar: string | null },
) {
  const data = await prisma.levelingData.findUnique({
    where: { id: `${guildId}:${target.id}` },
  });

  const profile = data ?? { level: 1, xp: 0, totalXp: 0, userId: target.id, guildId };
  const requiredXp = profile.level * 100 + 50;
  const progress = Math.min(100, Math.round((profile.xp / requiredXp) * 100));

  // Build a visual progress bar
  const filled = Math.round(progress / 10);
  const bar = "█".repeat(filled) + "░".repeat(10 - filled);

  const avatarUrl = target.avatar
    ? `https://cdn.discordapp.com/avatars/${target.id}/${target.avatar}.png?size=256`
    : `https://cdn.discordapp.com/embed/avatars/${BigInt(target.id) % 5n}.png`;

  const embed = aerisEmbed()
    .setColor(COLORS.level)
    .setTitle(`📈 Level ${profile.level}`)
    .setDescription(`**${target.username ?? "Unknown"}**`)
    .addFields(
      { name: "XP", value: `${profile.xp.toLocaleString()} / ${requiredXp.toLocaleString()}`, inline: true },
      { name: "Total XP", value: profile.totalXp.toLocaleString(), inline: true },
      { name: "Progress", value: `\`${bar}\` ${progress}%`, inline: false },
    )
    .setThumbnail(avatarUrl);

  await interaction.reply({ embeds: [embed] });
}

async function handleRank(
  interaction: ChatInputCommandInteraction,
  guildId: string,
  target: { id: string; username: string | null },
) {
  const entries = await prisma
    .levelingData.findMany({
      where: { guildId },
      orderBy: { totalXp: "desc" },
    })
    .catch(() => []);

  const rank = (entries as { userId: string }[]).findIndex((e) => e.userId === target.id) + 1;
  const total = (entries as unknown[]).length;
  const data = (entries as { userId: string; level: number; totalXp: number }[]).find((e) => e.userId === target.id);

  const embed = aerisEmbed()
    .setColor(COLORS.level)
    .setTitle("🏆 Leaderboard Rank")
    .setDescription(`**${target.username ?? "Unknown"}**`)
    .addFields(
      { name: "Rank", value: rank > 0 ? `#${rank} / ${total}` : "—", inline: true },
      { name: "Level", value: data ? String(data.level) : "—", inline: true },
      { name: "Total XP", value: data ? data.totalXp.toLocaleString() : "—", inline: true },
    );

  await interaction.reply({ embeds: [embed] });
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
    const embed = aerisEmbed()
      .setColor(COLORS.neutral)
      .setTitle("📈 Leaderboard")
      .setDescription(page === 0 ? "No one has earned XP yet." : "No entries on this page.");
    await interaction.reply({ embeds: [embed] });
    return;
  }

  const lines = pageEntries.map((e: { userId: string; level: number; totalXp: number }, i: number) => {
    const rank = page * 10 + i + 1;
    const medal = rank === 1 ? "🥇" : rank === 2 ? "🥈" : rank === 3 ? "🥉" : `#${rank}`;
    return `${medal} <@${e.userId}> — Lv.${e.level} | ${e.totalXp.toLocaleString()} XP`;
  });

  const embed = aerisEmbed()
    .setColor(COLORS.level)
    .setTitle("📈 Leaderboard")
    .setDescription(lines.join("\n"))
    .setFooter({ text: `Page ${page + 1} of ${Math.ceil(entries.length / 10)}` });

  await interaction.reply({ embeds: [embed] });
}
