import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  ChannelType,
} from "discord.js";
import { aerisEmbed, COLORS } from "../lib/embeds.js";

export default {
  data: new SlashCommandBuilder()
    .setName("voice")
    .setDescription("Voicemaster — temporary voice channels")
    .addSubcommand((sub) => sub.setName("lock").setDescription("Lock your voice channel"))
    .addSubcommand((sub) => sub.setName("unlock").setDescription("Unlock your voice channel"))
    .addSubcommand((sub) =>
      sub.setName("limit").setDescription("Set user limit").addIntegerOption((o) =>
        o.setName("count").setDescription("Max users").setRequired(true).setMinValue(1).setMaxValue(99),
      ),
    )
    .addSubcommand((sub) =>
      sub.setName("name").setDescription("Rename your voice channel").addStringOption((o) =>
        o.setName("name").setDescription("New channel name").setRequired(true),
      ),
    ),
  async execute(interaction: ChatInputCommandInteraction) {
    const member = interaction.guild?.members.cache.get(interaction.user.id);
    const channel = member?.voice.channel;

    if (!channel || channel.type !== ChannelType.GuildVoice) {
      const embed = aerisEmbed()
        .setColor(COLORS.danger)
        .setTitle("Not in Voice")
        .setDescription("Join a voice channel first.");
      await interaction.reply({ embeds: [embed], ephemeral: true });
      return;
    }

    const subcommand = interaction.options.getSubcommand();
    switch (subcommand) {
      case "lock":
        await channel.permissionOverwrites.edit(interaction.guild!.roles.everyone, { Connect: false });
        await interaction.reply({
          embeds: [aerisEmbed().setColor(COLORS.warning).setTitle("🔒 Channel Locked").setDescription(`${channel} has been locked.`)],
        });
        break;
      case "unlock":
        await channel.permissionOverwrites.edit(interaction.guild!.roles.everyone, { Connect: null });
        await interaction.reply({
          embeds: [aerisEmbed().setColor(COLORS.success).setTitle("🔓 Channel Unlocked").setDescription(`${channel} has been unlocked.`)],
        });
        break;
      case "limit": {
        const count = interaction.options.getInteger("count")!;
        await channel.setUserLimit(count);
        await interaction.reply({
          embeds: [aerisEmbed().setColor(COLORS.primary).setTitle("👥 User Limit Set").setDescription(`Maximum users set to **${count}**.`)],
        });
        break;
      }
      case "name": {
        const newName = interaction.options.getString("name")!;
        await channel.setName(newName);
        await interaction.reply({
          embeds: [aerisEmbed().setColor(COLORS.primary).setTitle("✏️ Channel Renamed").setDescription(`Channel renamed to **${newName}**.`)],
        });
        break;
      }
    }
  },
};
