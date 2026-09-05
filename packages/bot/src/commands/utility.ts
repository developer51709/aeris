import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  PermissionFlagsBits,
} from "discord.js";
import { prisma } from "@aeris/shared";

export default {
  data: new SlashCommandBuilder()
    .setName("utility")
    .setDescription("Utility commands")
    .addSubcommand((sub) => sub.setName("serverinfo").setDescription("Show server information"))
    .addSubcommand((sub) =>
      sub
        .setName("userinfo")
        .setDescription("Show user information")
        .addUserOption((opt) => opt.setName("user").setDescription("User to inspect").setRequired(false)),
    )
    .addSubcommand((sub) =>
      sub
        .setName("avatar")
        .setDescription("Show a user's avatar")
        .addUserOption((opt) => opt.setName("user").setDescription("User to inspect").setRequired(false)),
    ),
  async execute(interaction: ChatInputCommandInteraction) {
    const subcommand = interaction.options.getSubcommand();

    if (subcommand === "serverinfo") {
      const guild = interaction.guild!;
      const content = [
        `**${guild.name}**`,
        `ID: ${guild.id}`,
        `Owner: <@${guild.ownerId}>`,
        `Members: ${guild.memberCount}`,
        `Channels: ${guild.channels.cache.size}`,
        `Created: ${guild.createdAt.toLocaleDateString()}`,
      ].join("\n");
      await interaction.reply({ content });
      return;
    }

    if (subcommand === "userinfo") {
      const target = interaction.options.getUser("user") ?? interaction.user;
      const member = await interaction.guild?.members.fetch(target.id).catch(() => undefined);
      const content = [
        `**${target.username}**`,
        `ID: ${target.id}`,
        `Joined: ${member?.joinedAt?.toLocaleString() ?? "Unknown"}`,
        `Roles: ${Math.max(0, (member?.roles.cache.size ?? 1) - 1)}`,
      ].join("\n");
      await interaction.reply({ content });
      return;
    }

    if (subcommand === "avatar") {
      const target = interaction.options.getUser("user") ?? interaction.user;
      await interaction.reply({
        content: `🖼️ ${target.username}'s avatar: ${target.displayAvatarURL({ extension: "png", size: 512 })}`,
      });
    }
  },
};
