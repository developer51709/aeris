import {
  ChatInputCommandInteraction,
  ChannelType,
  PermissionFlagsBits,
  SlashCommandBuilder,
} from "discord.js";
import { replyV2 } from "../components.js";

const data = new SlashCommandBuilder()
  .setName("automate")
  .setDescription("Moderation and server automation")
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
  .addSubcommand((sub) => sub.setName("clear").setDescription("Bulk delete recent messages").addIntegerOption((o) => o.setName("amount").setDescription("Messages to delete").setMinValue(1).setMaxValue(100).setRequired(true)))
  .addSubcommand((sub) => sub.setName("timeout").setDescription("Timeout a member").addUserOption((o) => o.setName("user").setDescription("Member").setRequired(true)).addIntegerOption((o) => o.setName("minutes").setDescription("Duration").setMinValue(1).setMaxValue(40320).setRequired(true)).addStringOption((o) => o.setName("reason").setDescription("Reason").setMaxLength(500)))
  .addSubcommand((sub) => sub.setName("lock").setDescription("Lock the current text channel"))
  .addSubcommand((sub) => sub.setName("unlock").setDescription("Unlock the current text channel"));

function has(interaction: ChatInputCommandInteraction, permission: bigint) {
  return Boolean(interaction.guild?.members.me?.permissions.has(permission));
}

export default {
  data,
  async execute(interaction: ChatInputCommandInteraction) {
    if (!interaction.guild || !interaction.guildId) {
      await replyV2(interaction, { title: "Server only", body: "Automation commands must be used inside a server.", ephemeral: true });
      return;
    }
    const subcommand = interaction.options.getSubcommand();
    try {
      if (subcommand === "clear") {
        if (!has(interaction, PermissionFlagsBits.ManageMessages)) throw new Error("I need Manage Messages to clear messages.");
        if (!interaction.channel || !interaction.channel.isTextBased() || !("bulkDelete" in interaction.channel)) throw new Error("This channel does not support bulk deletion.");
        const amount = interaction.options.getInteger("amount", true);
        const deleted = await interaction.channel.bulkDelete(amount, true);
        await replyV2(interaction, { title: "Messages cleared", body: `Deleted **${deleted.size}** recent messages.` });
        return;
      }
      if (subcommand === "timeout") {
        if (!has(interaction, PermissionFlagsBits.ModerateMembers)) throw new Error("I need Moderate Members to apply timeouts.");
        const user = interaction.options.getUser("user", true);
        const member = await interaction.guild.members.fetch(user.id);
        const minutes = interaction.options.getInteger("minutes", true);
        await member.timeout(minutes * 60_000, interaction.options.getString("reason") ?? "Aeris moderation action");
        await replyV2(interaction, { title: "Member timed out", body: `${user} was timed out for **${minutes} minutes**.` });
        return;
      }
      if (subcommand === "lock" || subcommand === "unlock") {
        if (!has(interaction, PermissionFlagsBits.ManageChannels)) throw new Error("I need Manage Channels to change channel permissions.");
        const channel = interaction.channel;
        if (!channel || channel.type !== ChannelType.GuildText) throw new Error("Locking is supported for text channels only.");
        const everyone = interaction.guild.roles.everyone;
        await channel.permissionOverwrites.edit(everyone, { SendMessages: subcommand === "unlock" ? null : false }, { reason: `Aeris ${subcommand}` });
        await replyV2(interaction, { title: `Channel ${subcommand}ed`, body: `${channel} is now ${subcommand === "lock" ? "read-only" : "open for messages"}.` });
      }
    } catch (error) {
      await replyV2(interaction, { title: "Automation failed", body: error instanceof Error ? error.message : "The Discord action could not be completed.", ephemeral: true });
    }
  },
};
