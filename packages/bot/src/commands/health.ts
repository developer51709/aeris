import { ChatInputCommandInteraction, MessageFlags, SlashCommandBuilder } from "discord.js";
import { prisma } from "@aeris/shared";
import { containerResponse } from "../components.js";

export default {
  data: new SlashCommandBuilder()
    .setName("health")
    .setDescription("Inspect Aeris health and synchronization")
    .addSubcommand((sub) => sub.setName("check").setDescription("Check bot health and latency"))
    .addSubcommand((sub) => sub.setName("guilds").setDescription("Compare bot guilds with synchronized guilds")),
  async execute(interaction: ChatInputCommandInteraction) {
    const subcommand = interaction.options.getSubcommand();
    const startedAt = Date.now();
    await interaction.deferReply();

    if (subcommand === "guilds") {
      const synced = await prisma.guild.count().catch(() => 0);
      await interaction.editReply({
        flags: MessageFlags.IsComponentsV2,
        components: [
          containerResponse({
            title: "Guild synchronization",
            body: `Discord cache: **${interaction.client.guilds.cache.size}**\nDatabase: **${synced}**\n\nThe dashboard only exposes synchronized bot guilds.`,
          }),
        ],
      });
      return;
    }

    await interaction.editReply({
      flags: MessageFlags.IsComponentsV2,
      components: [
        containerResponse({
          title: "Aeris health",
          body: `Status: **Operational**\nWebSocket ping: **${interaction.client.ws.ping}ms**\nResponse time: **${Date.now() - startedAt}ms**\nUptime: **${Math.floor(process.uptime())}s**`,
        }),
      ],
    });
  },
};
