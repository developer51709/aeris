import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  ChannelType,
} from "discord.js";

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
      await interaction.reply({ content: "❌ Join a voice channel first.", ephemeral: true });
      return;
    }

    const subcommand = interaction.options.getSubcommand();
    switch (subcommand) {
      case "lock":
        await channel.permissionOverwrites.edit(interaction.guild!.roles.everyone, { Connect: false });
        await interaction.reply({ content: "🔒 Channel locked." });
        break;
      case "unlock":
        await channel.permissionOverwrites.edit(interaction.guild!.roles.everyone, { Connect: null });
        await interaction.reply({ content: "🔓 Channel unlocked." });
        break;
      case "limit":
        await channel.setUserLimit(interaction.options.getInteger("count")!);
        await interaction.reply({ content: `👥 User limit set to **${interaction.options.getInteger("count")}**.` });
        break;
      case "name":
        await channel.setName(interaction.options.getString("name")!);
        await interaction.reply({ content: "✏️ Channel renamed." });
        break;
    }
  },
};
