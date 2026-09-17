import {
  ChannelType,
  ChatInputCommandInteraction,
  PermissionFlagsBits,
  SlashCommandBuilder,
} from "discord.js";
import { prisma } from "@aeris/shared";
import { replyV2 } from "../components.js";

const names = ["clear", "purge", "slowmode", "lock", "unlock", "hide", "unhide", "timeout", "untimeout", "softban", "unban", "modlog", "history", "notes", "case", "cases", "massrole", "nick", "resetnick", "dehoist", "striproles", "verify", "unverify", "quarantine", "audit"] as const;

const data = new SlashCommandBuilder()
  .setName("moderationx")
  .setDescription("Moderation and audit tools")
  .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers);

for (const name of names) {
  data.addSubcommand((sub) => {
    sub.setName(name).setDescription(`${name.replace(/-/g, " ")} moderation operation`);
    if (["clear", "purge"].includes(name)) sub.addIntegerOption((o) => o.setName("amount").setDescription("Messages to delete").setMinValue(1).setMaxValue(100).setRequired(true));
    if (name === "slowmode") sub.addIntegerOption((o) => o.setName("seconds").setDescription("0 to disable").setMinValue(0).setMaxValue(21600).setRequired(true));
    if (["timeout", "untimeout", "softban", "unban", "history", "notes", "nick", "resetnick", "verify", "unverify", "quarantine"].includes(name)) sub.addUserOption((o) => o.setName("user").setDescription("Target member").setRequired(true));
    if (name === "timeout") sub.addIntegerOption((o) => o.setName("minutes").setDescription("Timeout length").setMinValue(1).setMaxValue(40320).setRequired(true));
    if (["timeout", "softban", "notes", "nick"].includes(name)) sub.addStringOption((o) => o.setName(name === "nick" ? "nickname" : "reason").setDescription(name === "nick" ? "New nickname" : "Reason").setMaxLength(500).setRequired(name === "nick"));
    if (["massrole", "verify", "unverify", "quarantine"].includes(name)) sub.addRoleOption((o) => o.setName("role").setDescription("Role to apply or remove").setRequired(name === "massrole" || name === "verify" || name === "unverify"));
    if (name === "massrole") sub.addStringOption((o) => o.setName("action").setDescription("Add or remove").addChoices({ name: "Add", value: "add" }, { name: "Remove", value: "remove" }).setRequired(true));
    if (["case", "modlog"].includes(name)) sub.addIntegerOption((o) => o.setName("limit").setDescription("Number of records").setMinValue(1).setMaxValue(25));
    return sub;
  });
}

function has(interaction: ChatInputCommandInteraction, permission: bigint) {
  return Boolean(interaction.guild?.members.me?.permissions.has(permission));
}

async function log(interaction: ChatInputCommandInteraction, action: string, userId = interaction.user.id, reason?: string) {
  if (!interaction.guildId) return;
  await prisma.moderationLog.create({ data: { id: `${interaction.guildId}:${Date.now()}:${Math.random().toString(36).slice(2, 7)}`, guildId: interaction.guildId, userId, action, reason, moderatorId: interaction.user.id } });
}

function targetMember(interaction: ChatInputCommandInteraction) {
  const user = interaction.options.getUser("user", true);
  return interaction.guild!.members.fetch(user.id).then((member) => ({ user, member }));
}

export default {
  data,
  async execute(interaction: ChatInputCommandInteraction) {
    if (!interaction.guild || !interaction.guildId) return replyV2(interaction, { title: "Server only", body: "Moderation commands must be used inside a server.", ephemeral: true });
    const command = interaction.options.getSubcommand();
    try {
      if (["clear", "purge"].includes(command)) {
        if (!has(interaction, PermissionFlagsBits.ManageMessages)) throw new Error("I need Manage Messages to delete messages.");
        if (interaction.channel?.type !== ChannelType.GuildText) throw new Error("Use this command in a text channel.");
        const deleted = await interaction.channel.bulkDelete(interaction.options.getInteger("amount", true), true);
        await log(interaction, "purge", interaction.user.id, `Deleted ${deleted.size} messages`);
        return replyV2(interaction, { title: "Messages deleted", body: `Deleted **${deleted.size}** recent messages.` });
      }
      if (command === "slowmode") {
        if (!has(interaction, PermissionFlagsBits.ManageChannels)) throw new Error("I need Manage Channels to change slowmode.");
        if (interaction.channel?.type !== ChannelType.GuildText) throw new Error("Use this command in a text channel.");
        const seconds = interaction.options.getInteger("seconds", true);
        await interaction.channel.setRateLimitPerUser(seconds, `Moderation by ${interaction.user.tag}`);
        return replyV2(interaction, { title: "Slowmode updated", body: `Slowmode is now **${seconds} seconds**.` });
      }
      if (["lock", "unlock", "hide", "unhide"].includes(command)) {
        if (!has(interaction, PermissionFlagsBits.ManageChannels)) throw new Error("I need Manage Channels for channel controls.");
        if (!interaction.channel || !("permissionOverwrites" in interaction.channel)) throw new Error("This channel does not support permission overwrites.");
        const everyone = interaction.guild.roles.everyone;
        const changes = command === "lock" ? { SendMessages: false } : command === "unlock" ? { SendMessages: null } : command === "hide" ? { ViewChannel: false } : { ViewChannel: null };
        await interaction.channel.permissionOverwrites.edit(everyone, changes, { reason: `Moderation ${command} by ${interaction.user.tag}` });
        return replyV2(interaction, { title: `Channel ${command}ed`, body: `${interaction.channel} has been ${command === "lock" || command === "hide" ? "restricted" : "restored"}.` });
      }
      if (["timeout", "untimeout"].includes(command)) {
        if (!has(interaction, PermissionFlagsBits.ModerateMembers)) throw new Error("I need Moderate Members for timeouts.");
        const { user, member } = await targetMember(interaction);
        const reason = interaction.options.getString("reason") ?? "Moderation action";
        if (command === "timeout") await member.timeout(interaction.options.getInteger("minutes", true) * 60_000, reason); else await member.timeout(null, reason);
        await log(interaction, command, user.id, reason);
        return replyV2(interaction, { title: `Member ${command}ed`, body: `${user} was ${command === "timeout" ? "timed out" : "un-timed out"}.` });
      }
      if (command === "softban") {
        if (!has(interaction, PermissionFlagsBits.BanMembers)) throw new Error("I need Ban Members for softbans.");
        const { user } = await targetMember(interaction);
        const reason = interaction.options.getString("reason") ?? "Softban";
        await interaction.guild.members.ban(user, { deleteMessageSeconds: 86400, reason });
        await interaction.guild.members.unban(user, reason);
        await log(interaction, "softban", user.id, reason);
        return replyV2(interaction, { title: "Softban complete", body: `${user} was banned, recent messages were removed, and the ban was lifted.` });
      }
      if (command === "unban") {
        if (!has(interaction, PermissionFlagsBits.BanMembers)) throw new Error("I need Ban Members to unban users.");
        const { user } = await targetMember(interaction).catch(async () => ({ user: interaction.options.getUser("user", true), member: null }));
        await interaction.guild.members.unban(user, interaction.options.getString("reason") ?? "Moderation action");
        await log(interaction, "unban", user.id);
        return replyV2(interaction, { title: "User unbanned", body: `${user} was unbanned.` });
      }
      if (["nick", "resetnick", "dehoist"].includes(command)) {
        if (!has(interaction, PermissionFlagsBits.ManageNicknames)) throw new Error("I need Manage Nicknames for nickname changes.");
        const { user, member } = await targetMember(interaction);
        const nickname = command === "nick" ? interaction.options.getString("nickname", true) : command === "dehoist" ? member.displayName.replace(/^[^a-zA-Z0-9]+/, "") : null;
        await member.setNickname(nickname, `Moderation ${command} by ${interaction.user.tag}`);
        await log(interaction, command, user.id);
        return replyV2(interaction, { title: "Nickname updated", body: `${user}'s nickname was ${nickname ? `set to **${nickname}**` : "reset"}.` });
      }
      if (command === "striproles") {
        if (!has(interaction, PermissionFlagsBits.ManageRoles)) throw new Error("I need Manage Roles to remove roles.");
        const { user, member } = await targetMember(interaction);
        const removable = member.roles.cache.filter((role) => role.editable);
        await member.roles.remove(removable, `Moderation striproles by ${interaction.user.tag}`);
        await log(interaction, command, user.id);
        return replyV2(interaction, { title: "Roles removed", body: `Removed **${removable.size}** manageable roles from ${user}.` });
      }
      if (["verify", "unverify", "quarantine"].includes(command)) {
        if (!has(interaction, PermissionFlagsBits.ManageRoles)) throw new Error("I need Manage Roles for verification roles.");
        const { user, member } = await targetMember(interaction);
        const selected = interaction.options.getRole("role");
        if (!selected) throw new Error("Select a role to apply.");
        const role = await interaction.guild.roles.fetch(selected.id);
        if (!role || !role.editable) throw new Error("That role cannot be managed by me.");
        if (command === "unverify") await member.roles.remove(role); else await member.roles.add(role);
        await log(interaction, command, user.id, role.name);
        return replyV2(interaction, { title: `${command} complete`, body: `${role} was ${command === "unverify" ? "removed from" : "applied to"} ${user}.` });
      }
      if (command === "massrole") {
        if (!has(interaction, PermissionFlagsBits.ManageRoles)) throw new Error("I need Manage Roles for mass role changes.");
        const selected = interaction.options.getRole("role", true);
        const role = await interaction.guild.roles.fetch(selected.id);
        if (!role || !role.editable) throw new Error("That role cannot be managed by me.");
        const action = interaction.options.getString("action", true);
        let changed = 0;
        for (const member of interaction.guild.members.cache.values()) {
          const result = action === "add" ? await member.roles.add(role).then(() => true).catch(() => false) : await member.roles.remove(role).then(() => true).catch(() => false);
          if (result) changed += 1;
        }
        await log(interaction, `massrole-${action}`, interaction.user.id, `${role.name}: ${changed} members`);
        return replyV2(interaction, { title: "Mass role complete", body: `${action === "add" ? "Added" : "Removed"} ${role} for **${changed}** cached members.` });
      }
      if (["modlog", "history", "notes", "case", "cases"].includes(command)) {
        const limit = interaction.options.getInteger("limit") ?? 10;
        const userId = interaction.options.getUser("user")?.id;
        const rows = await prisma.moderationLog.findMany({ where: { guildId: interaction.guildId, ...(userId ? { userId } : {}) }, orderBy: { createdAt: "desc" }, take: limit });
        if (command === "notes") {
          const reason = interaction.options.getString("reason");
          if (!reason) throw new Error("Provide a reason to add a moderation note.");
          await log(interaction, "note", userId ?? interaction.user.id, reason);
          return replyV2(interaction, { title: "Moderation note added", body: `Recorded a note for <@${userId ?? interaction.user.id}>.` });
        }
        return replyV2(interaction, { title: "Moderation log", body: rows.length ? rows.map((row: { action: string; userId: string; reason: string | null; createdAt: Date }) => `• **${row.action}** <@${row.userId}> — ${row.reason ?? "no reason"} — <t:${Math.floor(row.createdAt.getTime() / 1000)}:R>`).join("\n") : "No moderation records found." });
      }
      if (command === "audit") {
        if (!has(interaction, PermissionFlagsBits.ViewAuditLog)) throw new Error("I need View Audit Log to inspect recent actions.");
        const logs = await interaction.guild.fetchAuditLogs({ limit: 10 });
        return replyV2(interaction, { title: "Recent audit actions", body: logs.entries.map((entry) => `• **${entry.action}** by <@${entry.executorId ?? "0"}> — <t:${Math.floor(entry.createdTimestamp / 1000)}:R>`).join("\n") || "No audit entries found." });
      }
      throw new Error(`Unknown moderation operation: ${command}`);
    } catch (error) {
      await replyV2(interaction, { title: "Moderation command failed", body: error instanceof Error ? error.message : "Discord rejected the operation.", ephemeral: true });
    }
  },
};
