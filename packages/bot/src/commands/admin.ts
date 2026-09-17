import {
  ChatInputCommandInteraction,
  ChannelType,
  PermissionFlagsBits,
  SlashCommandBuilder,
} from "discord.js";
import { replyV2 } from "../components.js";
import { loadCommandModules } from "./registry.js";

const disabledCommands = new Set<string>();

const data = new SlashCommandBuilder()
  .setName("admin")
  .setDescription("Administrator tools for Aeris")
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
  .addSubcommand((sub) => sub.setName("status").setDescription("Show live bot status"))
  .addSubcommand((sub) => sub.setName("stats").setDescription("Show cached guild and member totals"))
  .addSubcommand((sub) => sub.setName("shards").setDescription("Show shard and latency information"))
  .addSubcommand((sub) => sub.setName("about").setDescription("Show runtime and integration information"))
  .addSubcommand((sub) => sub.setName("permissions").setDescription("Show Aeris permissions in this server"))
  .addSubcommand((sub) => sub.setName("integrations").setDescription("Show configured provider integrations"))
  .addSubcommand((sub) => sub.setName("announce").setDescription("Send an announcement to a text channel").addChannelOption((o) => o.setName("channel").setDescription("Destination channel").addChannelTypes(ChannelType.GuildText).setRequired(true)).addStringOption((o) => o.setName("message").setDescription("Announcement text").setMaxLength(1900).setRequired(true)))
  .addSubcommand((sub) => sub.setName("broadcast").setDescription("Send an announcement to every cached guild").addStringOption((o) => o.setName("message").setDescription("Announcement text").setMaxLength(1900).setRequired(true)))
  .addSubcommand((sub) => sub.setName("webhook-create").setDescription("Create a webhook in a text channel").addChannelOption((o) => o.setName("channel").setDescription("Channel").addChannelTypes(ChannelType.GuildText).setRequired(true)).addStringOption((o) => o.setName("name").setDescription("Webhook name").setMaxLength(80).setRequired(true)))
  .addSubcommand((sub) => sub.setName("webhook-delete").setDescription("Delete a webhook by ID").addStringOption((o) => o.setName("id").setDescription("Webhook ID").setRequired(true)))
  .addSubcommand((sub) => sub.setName("webhook-list").setDescription("List webhooks in a text channel").addChannelOption((o) => o.setName("channel").setDescription("Channel").addChannelTypes(ChannelType.GuildText).setRequired(true)))
  .addSubcommand((sub) => sub.setName("maintenance").setDescription("Set the bot presence to maintenance mode").addBooleanOption((o) => o.setName("enabled").setDescription("Enable maintenance mode").setRequired(true)))
  .addSubcommand((sub) => sub.setName("reload").setDescription("Reload the bot command module cache"))
  .addSubcommand((sub) => sub.setName("command-enable").setDescription("Enable a command in this process").addStringOption((o) => o.setName("command").setDescription("Command name").setRequired(true)))
  .addSubcommand((sub) => sub.setName("command-disable").setDescription("Disable a command in this process").addStringOption((o) => o.setName("command").setDescription("Command name").setRequired(true)))
  .addSubcommand((sub) => sub.setName("command-permissions").setDescription("Show the current command permission policy"));

function can(interaction: ChatInputCommandInteraction, permission: bigint) {
  return Boolean(interaction.guild?.members.me?.permissions.has(permission));
}

function providerCount(value: string | undefined, fallback: string | undefined) {
  try {
    const parsed = JSON.parse(value ?? "[]");
    if (Array.isArray(parsed)) return parsed.filter((item) => item?.url && (item?.key || item?.password)).length;
  } catch {
    // Fall through to the single provider setting.
  }
  return fallback ? 1 : 0;
}

export default {
  data,
  async execute(interaction: ChatInputCommandInteraction) {
    const subcommand = interaction.options.getSubcommand();
    const guild = interaction.guild;
    try {
      if (["announce", "broadcast"].includes(subcommand) && !can(interaction, PermissionFlagsBits.ManageMessages)) throw new Error("I need Manage Messages for announcements.");
      if (["webhook-create", "webhook-delete", "webhook-list"].includes(subcommand) && !can(interaction, PermissionFlagsBits.ManageWebhooks)) throw new Error("I need Manage Webhooks for webhook operations.");
      if (subcommand === "announce") {
        const channel = interaction.options.getChannel("channel", true);
        if (channel.type !== ChannelType.GuildText) throw new Error("The destination must be a text channel.");
        await (channel as import("discord.js").TextChannel).send({ content: `📢 **Announcement from ${guild?.name ?? "Aeris"}**\n${interaction.options.getString("message", true)}` });
        await replyV2(interaction, { title: "Announcement sent", body: `Published the announcement in ${channel}.` });
        return;
      }
      if (subcommand === "broadcast") {
        const content = `📢 **Aeris announcement**\n${interaction.options.getString("message", true)}`;
        let sent = 0;
        for (const targetGuild of interaction.client.guilds.cache.values()) {
          const channel = targetGuild.systemChannel ?? targetGuild.channels.cache.find((candidate) => candidate.type === ChannelType.GuildText && candidate.permissionsFor(targetGuild.members.me!)?.has(PermissionFlagsBits.SendMessages));
          if (channel?.type === ChannelType.GuildText) {
            await channel.send({ content }).then(() => { sent += 1; }).catch(() => undefined);
          }
        }
        await replyV2(interaction, { title: "Broadcast complete", body: `Delivered the announcement to **${sent}** cached server${sent === 1 ? "" : "s"}.` });
        return;
      }
      if (subcommand === "webhook-create") {
        const channel = interaction.options.getChannel("channel", true);
        if (channel.type !== ChannelType.GuildText) throw new Error("Webhooks can only be created in text channels.");
        const webhook = await (channel as import("discord.js").TextChannel).createWebhook({ name: interaction.options.getString("name", true), reason: `Created by ${interaction.user.tag}` });
        await replyV2(interaction, { title: "Webhook created", body: `Created **${webhook.name}** in ${channel}.\n**ID:** \`${webhook.id}\`\nKeep the generated webhook URL private.` });
        return;
      }
      if (subcommand === "webhook-delete") {
        const id = interaction.options.getString("id", true);
        const webhook = await interaction.client.fetchWebhook(id);
        await webhook.delete(`Deleted by ${interaction.user.tag}`);
        await replyV2(interaction, { title: "Webhook deleted", body: `Deleted webhook \`${id}\`.` });
        return;
      }
      if (subcommand === "webhook-list") {
        const channel = interaction.options.getChannel("channel", true);
        if (channel.type !== ChannelType.GuildText) throw new Error("Webhooks can only be listed for text channels.");
        const webhooks = await (channel as import("discord.js").TextChannel).fetchWebhooks();
        await replyV2(interaction, { title: "Channel webhooks", body: webhooks.size ? webhooks.map((webhook) => `• **${webhook.name}** — \`${webhook.id}\` — ${webhook.owner?.username ?? "unknown owner"}`).join("\n") : "No webhooks exist in this channel." });
        return;
      }
      if (subcommand === "maintenance") {
        if (!can(interaction, PermissionFlagsBits.ManageGuild)) throw new Error("I need Manage Guild to change maintenance mode.");
        const enabled = interaction.options.getBoolean("enabled", true);
        interaction.client.user?.setPresence({ status: enabled ? "dnd" : "online", activities: [{ name: enabled ? "maintenance mode" : `${interaction.client.guilds.cache.size} servers`, type: 0 }] });
        await replyV2(interaction, { title: `Maintenance ${enabled ? "enabled" : "disabled"}`, body: enabled ? "The bot presence now indicates maintenance mode." : "The bot is back to its normal online presence." });
        return;
      }
      if (subcommand === "reload") {
        const modules = await loadCommandModules();
        await replyV2(interaction, { title: "Commands reloaded", body: `Loaded **${modules.length}** command modules. Restart or run registration to publish changed slash schemas.` });
        return;
      }
      if (subcommand === "command-enable" || subcommand === "command-disable") {
        const command = interaction.options.getString("command", true).toLowerCase();
        if (subcommand === "command-enable") disabledCommands.delete(command); else disabledCommands.add(command);
        await replyV2(interaction, { title: `Command ${subcommand === "command-enable" ? "enabled" : "disabled"}`, body: `**${command}** is ${disabledCommands.has(command) ? "disabled" : "enabled"} for this bot process.` });
        return;
      }
      if (subcommand === "command-permissions") {
        await replyV2(interaction, { title: "Command permissions", body: "Admin commands require Manage Guild. Moderation commands enforce their Discord permission at execution time.\n\nProcess-disabled commands: " + (disabledCommands.size ? [...disabledCommands].join(", ") : "none") });
        return;
      }
      if (subcommand === "permissions") {
        await replyV2(interaction, { title: "Aeris permissions", body: guild?.members.me?.permissions.toArray().join(", ") || "No permissions available." });
        return;
      }
      if (subcommand === "integrations") {
        await replyV2(interaction, { title: "Configured integrations", body: [`AI providers: **${providerCount(process.env.AI_PROVIDERS, process.env.AI_API_KEY)}**`, `Lavalink nodes: **${providerCount(process.env.LAVALINK_NODES, process.env.LAVALINK_NODE_URLS)}**`, `TMDB: **${process.env.TMDB_API_KEY ? "configured" : "not configured"}**`, `Cloudinary: **${process.env.CLOUDINARY_CLOUD_NAME ? "configured" : "not configured"}**`].join("\n") });
        return;
      }
      if (["status", "stats", "shards", "about"].includes(subcommand)) {
        const members = interaction.client.guilds.cache.reduce((total, item) => total + item.memberCount, 0);
        await replyV2(interaction, { title: `Admin · ${subcommand}`, body: [`**Guilds:** ${interaction.client.guilds.cache.size.toLocaleString()}`, `**Cached members:** ${members.toLocaleString()}`, `**Latency:** ${interaction.client.ws.ping}ms`, `**Uptime:** ${Math.floor(process.uptime()).toLocaleString()} seconds`, `**Disabled commands:** ${disabledCommands.size}`].join("\n") });
        return;
      }
      throw new Error(`Unknown admin operation: ${subcommand}`);
    } catch (error) {
      await replyV2(interaction, { title: "Admin command failed", body: error instanceof Error ? error.message : "Discord rejected the operation.", ephemeral: true });
    }
  },
};
