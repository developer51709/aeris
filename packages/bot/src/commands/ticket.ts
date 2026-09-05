import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  PermissionFlagsBits,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} from "discord.js";
import { prisma } from "@aeris/shared";

export default {
  data: new SlashCommandBuilder()
    .setName("ticket")
    .setDescription("Ticket system commands")
    .addSubcommand((sub) =>
      sub
        .setName("setup")
        .setDescription("Set up the ticket panel in this channel")
        .addChannelOption((o) =>
          o.setName("category").setDescription("Category for new tickets").setRequired(false),
        ),
    )
    .addSubcommand((sub) => sub.setName("close").setDescription("Close the current ticket")),
  async execute(interaction: ChatInputCommandInteraction) {
    const guildId = interaction.guildId!;
    const subcommand = interaction.options.getSubcommand();

    if (subcommand === "setup") {
      const category = interaction.options.getChannel("category");
      await prisma.ticketConfig.upsert({
        where: { guildId },
        create: { id: guildId, guildId, categoryId: category?.id ?? null },
        update: { categoryId: category?.id ?? null },
      });

      const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder()
          .setCustomId("ticket_open")
          .setLabel("Open a Ticket")
          .setEmoji("🎫")
          .setStyle(ButtonStyle.Primary),
      );

      const panelChannel = interaction.channel;
      if (panelChannel && "send" in panelChannel) {
        await (panelChannel as { send: (opts: unknown) => Promise<unknown> }).send({
          content: "**🎫 Support Tickets**\nNeed help? Click below to open a private ticket with our staff team.",
          components: [row],
        });
      }
      await interaction.reply({ content: "✅ Ticket panel created.", ephemeral: true });
      return;
    }

    if (subcommand === "close") {
      await interaction.reply({ content: "🔒 Closing ticket…", ephemeral: true });
      await interaction.channel?.delete().catch(() => undefined);
    }
  },
};
