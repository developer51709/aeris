import { SlashCommandBuilder, ChatInputCommandInteraction } from "discord.js";

const MODULES = [
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
    const lines = MODULES.map(([icon, desc]) => `${icon} — ${desc}`);
    await interaction.reply({
      content: [
        "**✨ Aeris — Feature Overview**",
        "",
        ...lines,
        "",
        "📖 Full documentation: https://aeris.example/docs",
      ].join("\n"),
    });
  },
};
