import { SlashCommandBuilder, ContainerBuilder, TextDisplayBuilder, SeparatorBuilder, SeparatorSpacingSize } from "discord.js";

export const data = new SlashCommandBuilder()
  .setName("ping")
  .setDescription("Check Aeris's latency");

export async function execute(interaction: any) {
  const sent = await interaction.reply({
    components: [
      new ContainerBuilder()
        .addTextDisplayComponents(
          new TextDisplayBuilder().setContent("🏓 Pinging...")
        ),
    ],
    flags: 4096, // IsComponentsV2
  });

  const roundtrip = sent.createdTimestamp - interaction.createdTimestamp;
  const wsLatency = Math.round(interaction.client.ws.ping);

  await interaction.editReply({
    components: [
      new ContainerBuilder()
        .addTextDisplayComponents(
          new TextDisplayBuilder().setContent(
            `## 🏓 Pong!\n\n**API Latency:** ${roundtrip}ms\n**WebSocket:** ${wsLatency}ms`
          )
        )
        .addSeparatorComponents(
          new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small)
        )
        .addTextDisplayComponents(
          new TextDisplayBuilder().setContent(
            `> ${wsLatency < 100 ? "🟢 Excellent" : wsLatency < 200 ? "🟡 Good" : "🔴 High"} connection`
          )
        ),
    ],
    flags: 4096,
  });
}
