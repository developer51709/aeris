import { SlashCommandBuilder, ChatInputCommandInteraction } from "discord.js";
import { aerisEmbed, COLORS } from "../lib/embeds.js";

export default {
  data: new SlashCommandBuilder()
    .setName("ping")
    .setDescription("Pong!"),
  async execute(interaction: ChatInputCommandInteraction) {
    const sent = await interaction.reply({ content: "Pinging…", fetchReply: true });
    const latency = sent.createdTimestamp - interaction.createdTimestamp;

    const embed = aerisEmbed()
      .setColor(COLORS.primary)
      .setTitle("🏓 Pong!")
      .addFields(
        { name: "Latency", value: `${latency}ms`, inline: true },
        { name: "WebSocket", value: `${interaction.client.ws.ping}ms`, inline: true },
      );

    await interaction.editReply({ content: "", embeds: [embed] });
  },
};
