import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  PermissionFlagsBits,
} from "discord.js";
import { prisma } from "@aeris/shared";

export default {
  data: new SlashCommandBuilder()
    .setName("moderation")
    .setDescription("Moderation commands")
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
    .addSubcommand((sub) =>
      sub
        .setName("ban")
        .setDescription("Ban a user")
        .addUserOption((o) => o.setName("user").setDescription("User to ban").setRequired(true))
        .addStringOption((o) => o.setName("reason").setDescription("Reason")),
    )
    .addSubcommand((sub) =>
      sub
        .setName("kick")
        .setDescription("Kick a user")
        .addUserOption((o) => o.setName("user").setDescription("User to kick").setRequired(true))
        .addStringOption((o) => o.setName("reason").setDescription("Reason")),
    )
    .addSubcommand((sub) =>
      sub
        .setName("warn")
        .setDescription("Warn a user")
        .addUserOption((o) => o.setName("user").setDescription("User to warn").setRequired(true))
        .addStringOption((o) => o.setName("reason").setDescription("Reason").setRequired(true)),
    ),
  async execute(interaction: ChatInputCommandInteraction) {
    const subcommand = interaction.options.getSubcommand();
    const guildId = interaction.guildId!;
    const user = interaction.options.getUser("user")!;
    const reason = interaction.options.getString("reason") ?? "No reason provided";

    if (subcommand === "ban") {
      await interaction.guild?.members.ban(user, { reason });
      await prisma.moderationLog.create({
        data: { id: `${guildId}:${Date.now()}`, guildId, userId: user.id, action: "ban", reason, moderatorId: interaction.user.id },
      });
      await interaction.reply({ content: `🔨 Banned **${user.username}** — ${reason}` });
    } else if (subcommand === "kick") {
      const member = await interaction.guild?.members.fetch(user.id).catch(() => undefined);
      await member?.kick(reason);
      await prisma.moderationLog.create({
        data: { id: `${guildId}:${Date.now()}`, guildId, userId: user.id, action: "kick", reason, moderatorId: interaction.user.id },
      });
      await interaction.reply({ content: `👢 Kicked **${user.username}** — ${reason}` });
    } else if (subcommand === "warn") {
      await prisma.moderationLog.create({
        data: { id: `${guildId}:${Date.now()}`, guildId, userId: user.id, action: "warn", reason, moderatorId: interaction.user.id },
      });
      await interaction.reply({ content: `⚠️ Warned **${user.username}** — ${reason}` });
    }
  },
};
