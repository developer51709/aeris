import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  PermissionFlagsBits,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} from "discord.js";
import { prisma } from "@aeris/shared";
import { successEmbed, aerisEmbed, COLORS } from "../lib/embeds.js";

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

      const panelEmbed = aerisEmbed()
        .setColor(COLORS.primary)
        .setTitle("🎫 Support Tickets")
        .setDescription("Need help? Click below to open a private ticket with our staff team.");

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
          embeds: [panelEmbed],
          components: [row],
        });
      }

      const embed = successEmbed("Ticket Panel Created", "The ticket panel has been set up in this channel.");
      await interaction.reply({ embeds: [embed], ephemeral: true });
      return;
    }

    if (subcommand === "close") {
      const embed = aerisEmbed()
        .setColor(COLORS.warning)
        .setTitle("🔒 Closing Ticket")
        .setDescription("This ticket is being closed…");
      await interaction.reply({ embeds: [embed], ephemeral: true });
      await interaction.channel?.delete().catch(() => undefined);
    }
  },
};
