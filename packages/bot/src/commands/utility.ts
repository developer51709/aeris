import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  ChannelType,
} from "discord.js";
import { prisma } from "@aeris/shared";

export default {
  data: new SlashCommandBuilder()
    .setName("utility")
    .setDescription("Utility and moderation commands")
    .addSubcommand((sub) =>
      sub
        .setName("serverinfo")
        .setDescription("Show server information"),
    )
    .addSubcommand((sub) =>
      sub
        .setName("userinfo")
        .setDescription("Show user information")
        .addUserOption((opt) =>
          opt.setName("user").setDescription("User to inspect").setRequired(false),
        ),
    )
    .addSubcommand((sub) =>
      sub
        .setName("avatar")
        .setDescription("Show a user's avatar")
        .addUserOption((opt) =>
          opt.setName("user").setDescription("User to inspect").setRequired(false),
        ),
    )
    .addSubcommand((sub) =>
      sub
        .setName("moderation")
        .setDescription("Moderation commands")
        .addSubgroup((group) =>
          group
            .setName("action")
            .setDescription("Moderation action")
            .addSubcommand((sub) =>
              sub
                .setName("ban")
                .setDescription("Ban a user")
                .addUserOption((opt) =>
                  opt.setName("user").setDescription("User to ban").setRequired(true),
                )
                .addStringOption((opt) =>
                  opt
                    .setName("reason")
                    .setDescription("Reason for ban")
                    .setRequired(false),
                ),
            )
            .addSubcommand((sub) =>
              sub
                .setName("kick")
                .setDescription("Kick a user")
                .addUserOption((opt) =>
                  opt.setName("user").setDescription("User to kick").setRequired(true),
                )
                .addStringOption((opt) =>
                  opt
                    .setName("reason")
                    .setDescription("Reason for kick")
                    .setRequired(false),
                ),
            )
            .addSubcommand((sub) =>
              sub
                .setName("mute")
                .setDescription("Mute a user (placeholder)")
                .addUserOption((opt) =>
                  opt.setName("user").setDescription("User to mute").setRequired(true),
                ),
            )
            .addSubcommand((sub) =>
              sub
                .setName("warn")
                .setDescription("Warn a user")
                .addUserOption((opt) =>
                  opt.setName("user").setDescription("User to warn").setRequired(true),
                )
                .addStringOption((opt) =>
                  opt
                    .setName("reason")
                    .setDescription("Warning reason")
                    .setRequired(false),
                ),
            ),
        ),
    ),
  async execute(interaction: ChatInputCommandInteraction) {
    const subcommand = interaction.options.getSubcommand();

    switch (subcommand) {
      case "serverinfo":
        return handleServerInfo(interaction);
      case "userinfo":
        return handleUserInfo(interaction);
      case "avatar":
        return handleAvatar(interaction);
      case "moderation":
        return handleMod(interaction);
    }
  },
};

async function handleServerInfo(interaction: ChatInputCommandInteraction) {
  const guild = interaction.guild!;
  const content = [
    `**${guild.name}**`,
    `ID: ${guild.id}`,
    `Owner: ${guild.ownerId}`,
    `Members: ${guild.memberCount}`,
    `Channels: ${guild.channels.cache.size}`,
    `Created: ${guild.createdAt.toLocaleDateString()}`,
  ].join("\n");

  await interaction.reply({ content, components: [] });
}

async function handleUserInfo(interaction: ChatInputCommandInteraction) {
  const target = interaction.options.getUser("user") ?? interaction.user;
  const member = await interaction.guild?.members.fetch(target.id).catch(() => undefined);

  const content = [
    `**${target.username ?? target.id}**`,
    `ID: ${target.id}`,
    `Joined: ${member?.joinedAt?.toLocaleString() ?? "Unknown"}`,
    `Roles: ${(member?.roles.cache.size ?? 0) - 1}`,
    `Flags: ${target.flags.toArray().join(", ") ?? "None"}`,
  ].join("\n");

  await interaction.reply({ content, components: [] });
}

async function handleAvatar(interaction: ChatInputCommandInteraction) {
  const target = interaction.options.getUser("user") ?? interaction.user;
  const url = target.displayAvatarURL({ extension: "png" });

  await interaction.reply({
    content: `Avatar for ${target.username ?? target.id}`,
    components: [],
    embeds: [],
    files: [],
  });
}

async function handleMod(interaction: ChatInputCommandInteraction) {
  const action = interaction.options.getSubcommandGroup() === "action"
    ? interaction.options.getSubcommand()
    : null;
  const guildId = interaction.guildId!;

  switch (action) {
    case "ban": {
      const target = interaction.options.getUser("user")!;
      const reason = interaction.options.getString("reason") ?? "No reason given";

      await interaction.guild?.members.ban(target.id, { reason });
      await prisma.moderationLog.create({
        data: {
          id: crypto.randomUUID(),
          guildId,
          userId: target.id,
          action: "BAN",
          reason,
          moderatorId: interaction.user.id,
        },
      });

      await interaction.reply({
        content: `**${target.username}** has been banned.`,
        components: [],
      });
      break;
    }
    case "kick": {
      const target = interaction.options.getUser("user")!;
      const reason = interaction.options.getString("reason") ?? "No reason given";

      await interaction.guild?.members.kick(target.id, reason);
      await prisma.moderationLog.create({
        data: {
          id: crypto.randomUUID(),
          guildId,
          userId: target.id,
          action: "KICK",
          reason,
          moderatorId: interaction.user.id,
        },
      });

      await interaction.reply({
        content: `**${target.username}** has been kicked.`,
        components: [],
      });
      break;
    }
    case "mute": {
      const target = interaction.options.getUser("user")!;
      await interaction.reply({
        content: `Muted **${target.username}** (placeholder).`,
        components: [],
      });
      break;
    }
    case "warn": {
      const target = interaction.options.getUser("user")!;
      const reason = interaction.options.getString("reason") ?? "No reason given";

      await prisma.moderationLog.create({
        data: {
          id: crypto.randomUUID(),
          guildId,
          userId: target.id,
          action: "WARN",
          reason,
          moderatorId: interaction.user.id,
        },
      });

      await interaction.reply({
        content: `**${target.username}** has been warned.`,
        components: [],
      });
      break;
    }
    default:
      await interaction.reply({
        content: "Unknown moderation action.",
        components: [],
      });
  }
}
