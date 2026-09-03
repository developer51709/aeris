import {
  SlashCommandBuilder,
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
  AttachmentBuilder,
} from "discord.js";
import { generateLevelCard } from "../image/levelCard.js";
import { uploadToCloudinary } from "../utils/cloudinary.js";

export const data = new SlashCommandBuilder()
  .setName("level")
  .setDescription("Check your level or view the leaderboard")
  .addSubcommand((sub) =>
    sub
      .setName("rank")
      .setDescription("Check your or another user's rank")
      .addUserOption((opt) =>
        opt.setName("user").setDescription("User to check")
      )
  )
  .addSubcommand((sub) =>
    sub
      .setName("leaderboard")
      .setDescription("View the server leaderboard")
  );

export async function execute(interaction: any, prisma: any) {
  const subcommand = interaction.options.getSubcommand();

  if (subcommand === "rank") {
    const target = interaction.options.getUser("user") || interaction.user;

    const member = await prisma.guildMember.findUnique({
      where: {
        guildId_userId: {
          guildId: interaction.guild.id,
          userId: target.id,
        },
      },
    });

    const xp = member?.xp || 0;
    const level = member?.level || 0;
    const currentXp = xp - level * level * 100;
    const nextLevelXp = (level + 1) * (level + 1) * 100 - level * level * 100;
    const progress = Math.min((currentXp / nextLevelXp) * 100, 100);

    // Generate level card
    const cardBuffer = await generateLevelCard({
      username: target.username,
      avatar: target.displayAvatarURL({ extension: "png", size: 256 }),
      level,
      xp,
      currentXp,
      nextLevelXp,
      progress,
    });

    const url = await uploadToCloudinary(cardBuffer, "level-cards");
    const attachment = new AttachmentBuilder(cardBuffer, {
      name: "level-card.png",
    });

    await interaction.reply({
      components: [
        new ContainerBuilder()
          .addTextDisplayComponents(
            new TextDisplayBuilder().setContent(
              `## 📊 ${target.username}'s Rank\n\n**Level:** ${level}\n**XP:** ${xp.toLocaleString()}\n**Progress:** ${progress.toFixed(1)}%`
            )
          ),
      ],
      files: [attachment],
      flags: 4096,
    });
  } else if (subcommand === "leaderboard") {
    const members = await prisma.guildMember.findMany({
      where: { guildId: interaction.guild.id },
      orderBy: { xp: "desc" },
      take: 10,
    });

    if (members.length === 0) {
      return interaction.reply({
        components: [
          new ContainerBuilder().addTextDisplayComponents(
            new TextDisplayBuilder().setContent("📊 No members in the leaderboard yet.")
          ),
        ],
        flags: 4096,
      });
    }

    const medals = ["🥇", "🥈", "🥉"];
    const leaderboard = members
      .map(
        (m: any, i: number) =>
          `${medals[i] || `${i + 1}.`} <@${m.userId}> — Level **${m.level}** (${m.xp.toLocaleString()} XP)`
      )
      .join("\n");

    await interaction.reply({
      components: [
        new ContainerBuilder()
          .addTextDisplayComponents(
            new TextDisplayBuilder().setContent(
              `## 🏆 Level Leaderboard\n\n${leaderboard}`
            )
          ),
      ],
      flags: 4096,
    });
  }
}
