import { SlashCommandBuilder, ChatInputCommandInteraction } from "discord.js";
import { aerisEmbed, COLORS } from "../lib/embeds.js";

const MODULES: [string, string][] = [
  ["🛡️ Automod", "Word filters, link filters, spam & raid protection"],
  ["📈 Leveling", "XP tracking, level-up cards, role rewards, leaderboards"],
  ["💰 Economy", "Currency, daily rewards, work, shop, blackjack"],
  ["🎵 Music", "Playback, queues, now-playing display"],
  ["🎙️ Voicemaster", "Temporary voice channels, locks, limits"],
  ["🎫 Tickets", "Support panels, transcripts, staff assignment"],
  ["👋 Welcome", "Welcome messages, DMs, auto-roles"],
  ["🔨 Moderation", "Ban, kick, warn, moderation logs"],
];

export default {
  data: new SlashCommandBuilder().setName("help").setDescription("Learn what Aeris can do"),
  async execute(interaction: ChatInputCommandInteraction) {
    const embed = aerisEmbed()
      .setColor(COLORS.primary)
      .setTitle("✨ Aeris — Feature Overview")
      .setDescription(
        MODULES.map(([icon, desc]) => `${icon} — ${desc}`).join("\n"),
      )
      .setURL("https://aeris.example/docs");

    await interaction.reply({ embeds: [embed] });
  },
};
