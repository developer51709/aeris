import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
} from "discord.js";
import { aerisEmbed, COLORS } from "../lib/embeds.js";

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
      const embed = aerisEmbed()
        .setColor(COLORS.primary)
        .setTitle(`🏠 ${guild.name}`)
        .addFields(
          { name: "ID", value: guild.id, inline: true },
          { name: "Owner", value: `<@${guild.ownerId}>`, inline: true },
          { name: "Members", value: guild.memberCount.toLocaleString(), inline: true },
          { name: "Channels", value: String(guild.channels.cache.size), inline: true },
          { name: "Created", value: guild.createdAt.toLocaleDateString(), inline: true },
        );

      if (guild.icon) {
        embed.setThumbnail(guild.iconURL({ size: 256 }));
      }

      await interaction.reply({ embeds: [embed] });
      return;
    }

    if (subcommand === "userinfo") {
      const target = interaction.options.getUser("user") ?? interaction.user;
      const member = await interaction.guild?.members.fetch(target.id).catch(() => undefined);

      const embed = aerisEmbed()
        .setColor(COLORS.primary)
        .setTitle(`👤 ${target.username}`)
        .setThumbnail(target.displayAvatarURL({ extension: "png", size: 256 }))
        .addFields(
          { name: "ID", value: target.id, inline: true },
          { name: "Joined", value: member?.joinedAt?.toLocaleString() ?? "Unknown", inline: true },
          { name: "Roles", value: String(Math.max(0, (member?.roles.cache.size ?? 1) - 1)), inline: true },
        );

      await interaction.reply({ embeds: [embed] });
      return;
    }

    if (subcommand === "avatar") {
      const target = interaction.options.getUser("user") ?? interaction.user;
      const avatarUrl = target.displayAvatarURL({ extension: "png", size: 512 });

      const embed = aerisEmbed()
        .setColor(COLORS.primary)
        .setTitle(`🖼️ ${target.username}'s Avatar`)
        .setImage(avatarUrl)
        .setURL(avatarUrl);

      await interaction.reply({ embeds: [embed] });
    }
  },
};
