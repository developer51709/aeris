import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
} from "discord.js";
import { prisma } from "@aeris/shared";
import { aerisEmbed, COLORS, successEmbed } from "../lib/embeds.js";

export default {
  data: new SlashCommandBuilder()
    .setName("automod")
    .setDescription("Automod configuration commands")
    .addSubcommand((sub) =>
      sub
        .setName("status")
        .setDescription("View current automod status for this server"),
    )
    .addSubcommand((sub) =>
      sub
        .setName("enable")
        .setDescription("Enable automod features")
        .addBooleanOption((opt) =>
          opt
            .setName("word_filter")
            .setDescription("Enable word filters")
            .setRequired(false),
        )
        .addBooleanOption((opt) =>
          opt
            .setName("link_filter")
            .setDescription("Enable link filters")
            .setRequired(false),
        )
        .addBooleanOption((opt) =>
          opt
            .setName("spam")
            .setDescription("Enable spam detection")
            .setRequired(false),
        )
        .addBooleanOption((opt) =>
          opt
            .setName("raid")
            .setDescription("Enable raid protection")
            .setRequired(false),
        ),
    )
    .addSubcommand((sub) =>
      sub
        .setName("wordfilter")
        .setDescription("Manage word filters")
        .addStringOption((opt) =>
          opt
            .setName("word")
            .setDescription("Word to add/remove")
            .setRequired(true),
        )
        .addStringOption((opt) =>
          opt
            .setName("action")
            .setDescription("Add or remove")
            .setRequired(true)
            .addChoices(
              { name: "Add", value: "add" },
              { name: "Remove", value: "remove" },
            ),
        ),
    )
    .addSubcommand((sub) =>
      sub
        .setName("linkfilter")
        .setDescription("Manage link filters")
        .addStringOption((opt) =>
          opt
            .setName("domain")
            .setDescription("Domain to add/remove")
            .setRequired(true),
        )
        .addStringOption((opt) =>
          opt
            .setName("action")
            .setDescription("Add or remove")
            .setRequired(true)
            .addChoices(
              { name: "Add", value: "add" },
              { name: "Remove", value: "remove" },
            ),
        ),
    ),
  async execute(interaction: ChatInputCommandInteraction) {
    const guildId = interaction.guildId!;
    const subcommand = interaction.options.getSubcommand();

    switch (subcommand) {
      case "status":
        await handleStatus(interaction, guildId);
        break;
      case "enable":
        await handleEnable(interaction, guildId);
        break;
      case "wordfilter":
        await handleWordFilter(interaction, guildId);
        break;
      case "linkfilter":
        await handleLinkFilter(interaction, guildId);
        break;
    }
  },
};

async function handleStatus(
  interaction: ChatInputCommandInteraction,
  guildId: string,
) {
  const settings = await prisma
    .automodSettings.findUnique({ where: { guildId } })
    .catch(() => undefined);

  const enabled = (val: boolean | undefined) => val ? "✅ Enabled" : "❌ Disabled";

  const embed = aerisEmbed()
    .setColor(COLORS.primary)
    .setTitle(`🛡️ Automod Status`)
    .setDescription(interaction.guild?.name ?? "")
    .addFields(
      { name: "Word Filter", value: enabled(settings?.wordFilters ? JSON.parse(settings.wordFilters).length > 0 : false), inline: true },
      { name: "Link Filter", value: enabled(settings?.linkFilters ? JSON.parse(settings.linkFilters).length > 0 : false), inline: true },
      { name: "Spam Detection", value: enabled(settings?.spamEnabled), inline: true },
      { name: "Raid Protection", value: enabled(settings?.raidEnabled), inline: true },
      { name: "Max Links", value: String(settings?.maxLinks ?? 5), inline: true },
      { name: "Max Emotes", value: String(settings?.maxEmotes ?? 10), inline: true },
    );

  await interaction.reply({ embeds: [embed] });
}

async function handleEnable(
  interaction: ChatInputCommandInteraction,
  guildId: string,
) {
  const word = interaction.options.getBoolean("word_filter");
  const link = interaction.options.getBoolean("link_filter");
  const spam = interaction.options.getBoolean("spam");
  const raid = interaction.options.getBoolean("raid");

  const existing = await prisma
    .automodSettings.findUnique({ where: { guildId } })
    .catch(() => undefined);

  await prisma.automodSettings.upsert({
    where: { guildId },
    create: {
      guildId,
      wordFilters: word ? "[]" : existing?.wordFilters ?? "[]",
      linkFilters: link ? "[]" : existing?.linkFilters ?? "[]",
      spamEnabled: spam ?? true,
      raidEnabled: raid ?? true,
      maxLinks: existing?.maxLinks ?? 5,
      maxEmotes: existing?.maxEmotes ?? 10,
      blockInvites: existing?.blockInvites ?? true,
    },
    update: {
      spamEnabled: spam ?? existing?.spamEnabled ?? true,
      raidEnabled: raid ?? existing?.raidEnabled ?? true,
      wordFilters: word ? JSON.stringify([]) : existing?.wordFilters ?? "[]",
      linkFilters: link ? JSON.stringify([]) : existing?.linkFilters ?? "[]",
    },
  });

  const embed = successEmbed(
    "Automod Updated",
    "Automod settings have been saved.",
  );

  await interaction.reply({ embeds: [embed] });
}

async function handleWordFilter(
  interaction: ChatInputCommandInteraction,
  guildId: string,
) {
  const word = interaction.options.getString("word")!;
  const action = interaction.options.getString("action")!;

  const settings = await prisma
    .automodSettings.findUnique({ where: { guildId } })
    .catch(() => undefined);

  const list: string[] =
    settings?.wordFilters ? JSON.parse(settings.wordFilters) : [];

  if (action === "add") {
    if (!list.includes(word)) list.push(word);
    await prisma.automodSettings.update({
      where: { guildId },
      data: { wordFilters: JSON.stringify(list) },
    });
    const embed = successEmbed(
      "Word Filter Added",
      `Added **${word}** to the word filter list.`,
    );
    await interaction.reply({ embeds: [embed] });
  } else {
    const next = list.filter((w) => w !== word);
    await prisma.automodSettings.update({
      where: { guildId },
      data: { wordFilters: JSON.stringify(next) },
    });
    const embed = successEmbed(
      "Word Filter Removed",
      `Removed **${word}** from the word filter list.`,
    );
    await interaction.reply({ embeds: [embed] });
  }
}

async function handleLinkFilter(
  interaction: ChatInputCommandInteraction,
  guildId: string,
) {
  const domain = interaction.options.getString("domain")!;
  const action = interaction.options.getString("action")!;

  const settings = await prisma
    .automodSettings.findUnique({ where: { guildId } })
    .catch(() => undefined);

  const list: string[] =
    settings?.linkFilters ? JSON.parse(settings.linkFilters) : [];

  if (action === "add") {
    if (!list.includes(domain)) list.push(domain);
    await prisma.automodSettings.update({
      where: { guildId },
      data: { linkFilters: JSON.stringify(list) },
    });
    const embed = successEmbed(
      "Link Filter Added",
      `Added **${domain}** to the link filter list.`,
    );
    await interaction.reply({ embeds: [embed] });
  } else {
    const next = list.filter((d) => d !== domain);
    await prisma.automodSettings.update({
      where: { guildId },
      data: { linkFilters: JSON.stringify(next) },
    });
    const embed = successEmbed(
      "Link Filter Removed",
      `Removed **${domain}** from the link filter list.`,
    );
    await interaction.reply({ embeds: [embed] });
  }
}
