import {
  SlashCommandBuilder,
  PermissionFlagsBits,
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
} from "discord.js";

export const data = new SlashCommandBuilder()
  .setName("automod")
  .setDescription("Configure automod settings")
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
  .addSubcommand((sub) =>
    sub
      .setName("add")
      .setDescription("Add an automod rule")
      .addStringOption((opt) =>
        opt
          .setName("type")
          .setDescription("Rule type")
          .setRequired(true)
          .addChoices(
            { name: "Word Filter", value: "word_filter" },
            { name: "Link Filter", value: "link_filter" },
            { name: "Spam Detection", value: "spam" },
            { name: "Raid Protection", value: "raid" }
          )
      )
      .addStringOption((opt) =>
        opt
          .setName("config")
          .setDescription("JSON config for the rule")
          .setRequired(true)
      )
  )
  .addSubcommand((sub) =>
    sub.setName("list").setDescription("List all automod rules")
  )
  .addSubcommand((sub) =>
    sub
      .setName("remove")
      .setDescription("Remove an automod rule")
      .addStringOption((opt) =>
        opt.setName("type").setDescription("Rule type to remove").setRequired(true)
      )
  );

export async function execute(interaction: any, prisma: any) {
  const subcommand = interaction.options.getSubcommand();

  if (subcommand === "add") {
    const type = interaction.options.getString("type");
    const configStr = interaction.options.getString("config");

    let config;
    try {
      config = JSON.parse(configStr);
    } catch {
      return interaction.reply({
        components: [
          new ContainerBuilder().addTextDisplayComponents(
            new TextDisplayBuilder().setContent("❌ Invalid JSON configuration.")
          ),
        ],
        flags: 4096,
        ephemeral: true,
      });
    }

    await prisma.automodRule.create({
      data: {
        guildId: interaction.guild.id,
        type,
        config,
      },
    });

    await interaction.reply({
      components: [
        new ContainerBuilder()
          .addTextDisplayComponents(
            new TextDisplayBuilder().setContent(
              `## ✅ Automod Rule Added\n\n**Type:** \`${type}\`\n**Status:** Enabled`
            )
          ),
      ],
      flags: 4096,
    });
  } else if (subcommand === "list") {
    const rules = await prisma.automodRule.findMany({
      where: { guildId: interaction.guild.id },
    });

    const ruleList =
      rules.length > 0
        ? rules.map((r: any) => `\`${r.type}\` — ${r.enabled ? "🟢" : "🔴"}`).join("\n")
        : "No rules configured.";

    await interaction.reply({
      components: [
        new ContainerBuilder()
          .addTextDisplayComponents(
            new TextDisplayBuilder().setContent(
              `## 🛡️ Automod Rules\n\n${ruleList}`
            )
          ),
      ],
      flags: 4096,
    });
  } else if (subcommand === "remove") {
    const type = interaction.options.getString("type");
    await prisma.automodRule.deleteMany({
      where: { guildId: interaction.guild.id, type },
    });

    await interaction.reply({
      components: [
        new ContainerBuilder().addTextDisplayComponents(
          new TextDisplayBuilder().setContent(
            `## 🗑️ Removed \`${type}\` rule`
          )
        ),
      ],
      flags: 4096,
    });
  }
}
