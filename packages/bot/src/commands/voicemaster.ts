import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  VoiceChannel,
  GuildChannel,
} from "discord.js";
import { prisma } from "@aeris/shared";

export default {
  data: new SlashCommandBuilder()
    .setName("voicemaster")
    .setDescription("Temporary voice channel commands")
    .addSubcommand((sub) =>
      sub
        .setName("create")
        .setDescription("Create a temporary voice channel")
        .addStringOption((opt) =>
          opt
            .setName("name")
            .setDescription("Channel name")
            .setRequired(false),
        )
        .addIntegerOption((opt) =>
          opt
            .setName("user_limit")
            .setDescription("Max users")
            .setMinValue(1)
            .setMaxValue(99)
            .setRequired(false),
        ),
    )
    .addSubcommand((sub) =>
      sub
        .setName("rename")
        .setDescription("Rename your temporary channel")
        .addStringOption((opt) =>
          opt
            .setName("name")
            .setDescription("New name")
            .setRequired(true),
        ),
    )
    .addSubcommand((sub) =>
      sub
        .setName("limit")
        .setDescription("Set user limit on your channel")
        .addIntegerOption((opt) =>
          opt
            .setName("limit")
            .setDescription("Max users")
            .setMinValue(0)
            .setMaxValue(99)
            .setRequired(true),
        ),
    )
    .addSubcommand((sub) =>
      sub
        .setName("destroy")
        .setDescription("Delete your temporary channel"),
    ),
  async execute(interaction: ChatInputCommandInteraction) {
    const guildId = interaction.guildId!;
    const subcommand = interaction.options.getSubcommand();
    const member = interaction.member;

    switch (subcommand) {
      case "create":
        return handleCreate(interaction);
      case "rename":
        return handleRename(interaction);
      case "limit":
        return handleLimit(interaction);
      case "destroy":
        return handleDestroy(interaction, member);
    }
  },
};

async function handleCreate(interaction: ChatInputCommandInteraction) {
  const name = interaction.options.getString("name") ?? "🎤 Temporary";
  const limit = interaction.options.getInteger("user_limit");

  const category =
    (interaction.guild?.channels.cache.find(
      (ch) => ch.type === "GUILD_CATEGORY" && ch.permissionOverwrites.size > 0,
    ) as GuildChannel | undefined) ??
    interaction.guild?.channels.cache.find((ch) => ch.type === "GUILD_CATEGORY");

  const channel = await interaction.guild?.channels.create({
    name,
    type: "GUILD_VOICE",
    userLimit: limit ?? 5,
    parent: category?.id ?? undefined,
    permissionOverwrites: [
      {
        id: interaction.guild?.id ?? "0",
        allow: ["VOICE_CONNECT", "VOICE_SPEAK", "VOICE_MUTE_MEMBERS"],
      },
    ],
  });

  await interaction.reply({
    content: channel
      ? `Created temporary channel **${name}**`
      : "Failed to create channel.",
    components: [],
  });
}

async function handleRename(interaction: ChatInputCommandInteraction) {
  const voiceState = interaction.member?.voiceState;
  const channel = (voiceState?.channel as VoiceChannel | undefined) ?? null;
  if (!channel) {
    await interaction.reply({
      content: "You must be in a voice channel to rename it.",
      components: [],
    });
    return;
  }
  await channel.edit({ name: interaction.options.getString("name") ?? channel.name });
  await interaction.reply({
    content: `Renamed channel to **${interaction.options.getString("name")}**`,
    components: [],
  });
}

async function handleLimit(interaction: ChatInputCommandInteraction) {
  const voiceState = interaction.member?.voiceState;
  const channel = (voiceState?.channel as VoiceChannel | undefined) ?? null;
  if (!channel) {
    await interaction.reply({
      content: "You must be in a voice channel to set a limit.",
      components: [],
    });
    return;
  }
  const limit = interaction.options.getInteger("limit") ?? 5;
  await channel.edit({ userLimit: limit });
  await interaction.reply({
    content: limit === 0
      ? "User limit removed."
      : `Set user limit to **${limit}**`,
    components: [],
  });
}

async function handleDestroy(
  interaction: ChatInputCommandInteraction,
  member: { voiceState: { channel?: { id?: string } | null } | null },
) {
  const channel = member.voiceState?.channel;
  if (!channel) {
    await interaction.reply({
      content: "You must be in a voice channel to delete it.",
      components: [],
    });
    return;
  }
  if (channel.deletable) {
    await channel.delete();
    await interaction.reply({
      content: "Temporary channel deleted.",
      components: [],
    });
  } else {
    await interaction.reply({
      content: "I cannot delete this channel.",
      components: [],
    });
  }
}
