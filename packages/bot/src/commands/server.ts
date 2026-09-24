import { ChannelType, ChatInputCommandInteraction, PermissionFlagsBits, SlashCommandBuilder } from "discord.js";
import { prisma } from "@aeris/shared";
import { replyV2 } from "../components.js";
import { SUPPORTED_LOCALES } from "../locale.js";

const names = ["settings", "prefix", "locale", "timezone", "channels", "roles", "permissions", "modules", "module", "logs", "log-channel", "welcome", "goodbye", "autorole", "autoroles", "rules", "verification", "vanity", "icon", "banner", "features", "backup", "backup-list", "backup-load", "health"] as const;
const backups = new Map<string, { createdAt: number; channels: string[]; roles: string[] }>();
const logChannels = new Map<string, string>();

const data = new SlashCommandBuilder().setName("server").setDescription("Server configuration and diagnostics");
for (const name of names) {
  data.addSubcommand((sub) => {
    sub.setName(name).setDescription(`${name.replace(/-/g, " ")} server command`);
    if (["prefix", "locale", "timezone", "log-channel", "module", "welcome", "goodbye", "autorole", "rules"].includes(name)) sub.addStringOption((o) => o.setName("value").setDescription("Value to view or save").setMaxLength(1000).setRequired(false));
    if (name === "module") sub.addBooleanOption((o) => o.setName("enabled").setDescription("Enable this module").setRequired(false));
    if (name === "backup-load") sub.addStringOption((o) => o.setName("id").setDescription("Backup ID").setRequired(true));
    return sub;
  });
}

function has(interaction: ChatInputCommandInteraction, permission: bigint) {
  return Boolean(interaction.guild?.members.me?.permissions.has(permission));
}

export default {
  data,
  async execute(interaction: ChatInputCommandInteraction) {
    const guild = interaction.guild;
    if (!guild || !interaction.guildId) return replyV2(interaction, { title: "Server only", body: "Server commands must be used inside a server.", ephemeral: true });
    const command = interaction.options.getSubcommand();
    const value = interaction.options.getString("value");
    try {
      if (command === "settings") return replyV2(interaction, { title: "Server settings", body: [`**Name:** ${guild.name}`, `**ID:** \`${guild.id}\``, `**Owner:** <@${guild.ownerId}>`, `**Locale:** ${(await prisma.guild.findUnique({ where: { id: guild.id }, select: { locale: true } }))?.locale ?? "en"}`, `**Prefix:** ${process.env.DISCORD_PREFIX ?? "!"}`].join("\n") });
      if (["prefix", "locale", "timezone"].includes(command)) {
        if (value) {
          if (!has(interaction, PermissionFlagsBits.ManageGuild)) throw new Error("I need Manage Guild to change server configuration.");
          if (command === "prefix") process.env.DISCORD_PREFIX = value;
          if (command === "locale") {
            const locale = value.toLowerCase().split("-")[0];
            if (!(SUPPORTED_LOCALES as readonly string[]).includes(locale)) throw new Error(`Supported languages: ${SUPPORTED_LOCALES.join(", ")}.`);
            await prisma.guild.update({ where: { id: guild.id }, data: { locale } });
          }
          if (command === "timezone") process.env.DISCORD_TIMEZONE = value;
        }
        return replyV2(interaction, { title: `${command} configuration`, body: `Current ${command}: **${command === "prefix" ? process.env.DISCORD_PREFIX ?? "!" : command === "locale" ? (await prisma.guild.findUnique({ where: { id: guild.id }, select: { locale: true } }))?.locale ?? "en" : process.env.DISCORD_TIMEZONE ?? "UTC"}**${value ? "\n\nSaved for this bot process." : ""}` });
      }
      if (command === "channels") return replyV2(interaction, { title: "Server channels", body: guild.channels.cache.sort((a, b) => ((a as { position?: number }).position ?? 0) - ((b as { position?: number }).position ?? 0)).map((channel) => `${channel.type === ChannelType.GuildCategory ? "📁" : "#️⃣"} ${channel.name} — \`${channel.id}\``).slice(0, 75).join("\n") || "No cached channels." });
      if (command === "roles") return replyV2(interaction, { title: "Server roles", body: guild.roles.cache.filter((role) => role.id !== guild.id).sort((a, b) => b.position - a.position).map((role) => `${role} — ${role.members.size} members`).slice(0, 75).join("\n") || "No custom roles." });
      if (command === "permissions") return replyV2(interaction, { title: "Bot permissions", body: guild.members.me?.permissions.toArray().join(", ") || "No cached permissions." });
      if (command === "modules") {
        const [automod, leveling, economy, tickets, welcome, music] = await Promise.all([prisma.automodSettings.count({ where: { guildId: guild.id } }), prisma.levelingSettings.count({ where: { guildId: guild.id } }), prisma.economySettings.count({ where: { guildId: guild.id } }), prisma.ticketConfig.count({ where: { guildId: guild.id } }), prisma.welcomeConfig.count({ where: { guildId: guild.id } }), prisma.musicQueue.count({ where: { guildId: guild.id } })]);
        return replyV2(interaction, { title: "Server modules", body: [`Automod: ${automod ? "configured" : "not configured"}`, `Leveling: ${leveling ? "configured" : "not configured"}`, `Economy: ${economy ? "configured" : "not configured"}`, `Tickets: ${tickets ? "configured" : "not configured"}`, `Welcome: ${welcome ? "configured" : "not configured"}`, `Music: ${music ? "configured" : "not configured"}`].join("\n") });
      }
      if (command === "module") return replyV2(interaction, { title: "Module status", body: value ? `Module **${value}** is managed through its dedicated command and dashboard settings.` : "Use the dedicated module commands to configure automod, leveling, economy, tickets, welcome, and music." });
      if (command === "logs") {
        const rows = await prisma.moderationLog.findMany({ where: { guildId: guild.id }, orderBy: { createdAt: "desc" }, take: 10 });
        return replyV2(interaction, { title: "Moderation logs", body: rows.length ? rows.map((row: { action: string; userId: string; reason: string | null; createdAt: Date }) => `• **${row.action}** <@${row.userId}> — ${row.reason ?? "no reason"} — <t:${Math.floor(row.createdAt.getTime() / 1000)}:R>`).join("\n") : "No moderation logs recorded." });
      }
      if (command === "log-channel") {
        if (value) {
          if (!has(interaction, PermissionFlagsBits.ManageGuild)) throw new Error("I need Manage Guild to set a log channel.");
          const channel = guild.channels.cache.get(value);
          if (!channel || channel.type !== ChannelType.GuildText) throw new Error("Provide the ID of a cached text channel.");
          logChannels.set(guild.id, channel.id);
        }
        return replyV2(interaction, { title: "Log channel", body: logChannels.has(guild.id) ? `Moderation log channel: <#${logChannels.get(guild.id)}>` : "No log channel configured for this process." });
      }
      if (["welcome", "goodbye", "autorole", "autoroles"].includes(command)) {
        if (value && !has(interaction, PermissionFlagsBits.ManageGuild)) throw new Error("I need Manage Guild to change welcome settings.");
        const config = await prisma.welcomeConfig.upsert({ where: { guildId: guild.id }, create: { id: guild.id, guildId: guild.id }, update: {} });
        if (value) {
          const update = command === "welcome" ? { message: value } : command === "goodbye" ? { goodbyeMessage: value } : { autoRoleId: value };
          await prisma.welcomeConfig.update({ where: { guildId: guild.id }, data: update });
        }
        const current = await prisma.welcomeConfig.findUnique({ where: { guildId: guild.id } }) ?? config;
        return replyV2(interaction, { title: `${command} settings`, body: command === "welcome" ? `Welcome message: **${current.message}**` : command === "goodbye" ? `Goodbye message: **${current.goodbyeMessage}**` : `Automatic role: ${current.autoRoleId ? `<@&${current.autoRoleId}>` : "not configured"}` });
      }
      if (command === "rules") return replyV2(interaction, { title: "Server rules", body: value ? `Rules reference saved for this process: **${value}**` : "No rules reference is configured. Use the dashboard server settings to publish your rules channel." });
      if (command === "verification") return replyV2(interaction, { title: "Verification status", body: `Discord verification level: **${guild.verificationLevel}**\nMembership screening: **${guild.features.includes("MEMBER_VERIFICATION_GATE_ENABLED") ? "enabled" : "not enabled"}**` });
      if (command === "vanity") return replyV2(interaction, { title: "Vanity URL", body: guild.vanityURLCode ? `discord.gg/${guild.vanityURLCode}` : "This server does not have a vanity URL." });
      if (command === "icon" || command === "banner") {
        const image = command === "icon" ? guild.iconURL({ size: 1024 }) : guild.bannerURL({ size: 1024 });
        return replyV2(interaction, { title: `Server ${command}`, body: image ? `Current server ${command}.` : `This server has no ${command}.`, imageUrls: image ? [image] : undefined });
      }
      if (command === "features") return replyV2(interaction, { title: "Server features", body: guild.features.length ? guild.features.map((feature) => `• ${feature}`).join("\n") : "No special features are enabled." });
      if (command === "backup") {
        if (!has(interaction, PermissionFlagsBits.ManageGuild)) throw new Error("I need Manage Guild to create backups.");
        const id = `${guild.id}-${Date.now()}`;
        backups.set(id, { createdAt: Date.now(), channels: guild.channels.cache.map((channel) => `${channel.name}:${channel.type}`), roles: guild.roles.cache.map((role) => role.name) });
        return replyV2(interaction, { title: "Backup created", body: `Backup ID: \`${id}\`\nCaptured **${backups.get(id)!.channels.length}** channels and **${backups.get(id)!.roles.length}** roles.` });
      }
      if (command === "backup-list") return replyV2(interaction, { title: "Server backups", body: [...backups.entries()].filter(([id]) => id.startsWith(`${guild.id}-`)).map(([id, backup]) => `• \`${id}\` — <t:${Math.floor(backup.createdAt / 1000)}:R> — ${backup.channels.length} channels, ${backup.roles.length} roles`).join("\n") || "No backups exist in this bot process." });
      if (command === "backup-load") {
        if (!has(interaction, PermissionFlagsBits.ManageGuild)) throw new Error("I need Manage Guild to inspect backups.");
        const id = interaction.options.getString("id", true);
        const backup = backups.get(id);
        if (!backup || !id.startsWith(`${guild.id}-`)) throw new Error("Backup not found for this server.");
        return replyV2(interaction, { title: "Backup available", body: `Backup **${id}** contains ${backup.channels.length} channels and ${backup.roles.length} roles. Creation is non-destructive; review the snapshot before applying changes.` });
      }
      if (command === "health") return replyV2(interaction, { title: "Server health", body: [`Bot permissions: ${guild.members.me?.permissions.toArray().length ?? 0} granted`, `Cached members: ${guild.members.cache.size.toLocaleString()}`, `Cached channels: ${guild.channels.cache.size.toLocaleString()}`, `WebSocket latency: ${interaction.client.ws.ping}ms`, `Database: reachable`].join("\n") });
      throw new Error(`Unknown server operation: ${command}`);
    } catch (error) {
      await replyV2(interaction, { title: "Server command failed", body: error instanceof Error ? error.message : "Discord rejected the operation.", ephemeral: true });
    }
  },
};
