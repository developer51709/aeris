import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  TextChannel,
  ThreadChannel,
} from "discord.js";
import { prisma } from "@aeris/shared";

export default {
  data: new SlashCommandBuilder()
    .setName("ticket")
    .setDescription("Ticket system commands")
    .addSubcommand((sub) =>
      sub
        .setName("create")
        .setDescription("Create a new support ticket")
        .addStringOption((opt) =>
          opt
            .setName("subject")
            .setDescription("Ticket subject")
            .setRequired(false),
        ),
    )
    .addSubcommand((sub) =>
      sub
        .setName("close")
        .setDescription("Close the ticket you are viewing"),
    )
    .addSubcommand((sub) =>
      sub
        .setName("config")
        .setDescription("Configure ticket settings for this server")
        .addStringOption((opt) =>
          opt
            .setName("channel")
            .setDescription("Ticket creation channel")
            .setRequired(false),
        )
        .addStringOption((opt) =>
          opt
            .setName("category")
            .setDescription("Ticket category")
            .setRequired(false),
        )
        .addBooleanOption((opt) =>
          opt
            .setName("transcripts")
            .setDescription("Enable transcripts")
            .setRequired(false),
        ),
    ),
  async execute(interaction: ChatInputCommandInteraction) {
    const guildId = interaction.guildId!;
    const subcommand = interaction.options.getSubcommand();

    switch (subcommand) {
      case "create":
        return handleCreate(interaction, guildId);
      case "close":
        return handleClose(interaction, guildId);
      case "config":
        return handleConfig(interaction, guildId);
    }
  },
};

async function handleCreate(
  interaction: ChatInputCommandInteraction,
  guildId: string,
) {
  const subject = interaction.options.getString("subject") ?? "Support Ticket";
  const channel = await interaction.guild?.channels.create({
    name: `ticket-${interaction.user.id}-${subject.replace(/[^a-z0-9]/gi, "-")}`,
    type: "GUILD_TEXT",
    permissionOverwrites: [
      {
        id: interaction.guild?.id ?? "0",
        deny: ["VIEW_CHANNEL"],
      },
      {
        id: interaction.user.id,
        allow: ["VIEW_CHANNEL", "SEND_MESSAGES", "READ_MESSAGE_HISTORY"],
      },
    ],
  });

  if (!channel) {
    await interaction.reply({
      content: "Failed to create ticket.",
      components: [],
    });
    return;
  }

  await prisma.ticket.create({
    data: {
      id: channel.id,
      guildId,
      channelId: channel.id,
      openerId: interaction.user.id,
      subject,
    },
  });

  await interaction.reply({
    content: `Created ticket in <#${channel.id}>`,
    components: [],
  });
}

async function handleClose(interaction: ChatInputCommandInteraction, guildId: string) {
  const thread = interaction.channel as ThreadChannel | undefined;
  const text = interaction.channel as TextChannel | undefined;
  const channelId =
    thread?.id ?? text?.id ?? (interaction.channel as { id?: string }).id;

  if (!channelId) {
    await interaction.reply({
      content: "This command must be used in a ticket channel.",
      components: [],
    });
    return;
  }

  await prisma.ticket.update({
    where: { id: channelId },
    data: { closedAt: new Date() },
  }).catch(() => {});

  await interaction.reply({
    content: "Ticket closed.",
    components: [],
  });
}

async function handleConfig(
  interaction: ChatInputCommandInteraction,
  guildId: string,
) {
  const channelId = interaction.options.getString("channel") ?? undefined;
  const categoryId = interaction.options.getString("category") ?? undefined;
  const transcripts = interaction.options.getBoolean("transcripts") ?? undefined;

  await prisma.ticketConfig.upsert({
    where: { guildId },
    create: {
      guildId,
      channelId,
      categoryId,
      transcriptEnabled: transcripts ?? true,
      closable: true,
    },
    update: {
      channelId,
      categoryId,
      transcriptEnabled: transcripts ?? true,
    },
  });

  await interaction.reply({
    content: "Ticket configuration updated.",
    components: [],
  });
}
