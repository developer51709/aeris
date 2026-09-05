import { SlashCommandBuilder, ChatInputCommandInteraction } from "discord.js";

export default {
  data: new SlashCommandBuilder()
    .setName("ping")
    .setDescription("Pong!"),
  async execute(interaction: ChatInputCommandInteraction) {
    await interaction.reply({ content: "Pong!", components: [] });
  },
} satisfies { data: SlashCommandBuilder; execute(interaction: ChatInputCommandInteraction): Promise<void> };
