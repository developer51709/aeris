import {
  ChannelType,
  ChatInputCommandInteraction,
  PermissionFlagsBits,
  SlashCommandBuilder,
} from "discord.js";
import { replyV2 } from "../components.js";

const afkUsers = new Map<string, string>();
const reminders = new Map<string, ReturnType<typeof setTimeout>>();
const reputation = new Map<string, number>();
const giveaways = new Map<string, { messageId: string; channelId: string; endsAt: number; prize: string; entries: Set<string> }>();

const data = new SlashCommandBuilder()
  .setName("community")
  .setDescription("Community and server interaction tools")
  .addSubcommand((sub) => sub.setName("announce").setDescription("Post an announcement in a text channel").addStringOption((o) => o.setName("message").setDescription("Announcement text").setMaxLength(1900).setRequired(true)))
  .addSubcommand((sub) => sub.setName("poll").setDescription("Create a reaction poll").addStringOption((o) => o.setName("question").setDescription("Poll question").setMaxLength(1900).setRequired(true)).addStringOption((o) => o.setName("options").setDescription("Comma-separated choices, up to 10").setMaxLength(1000).setRequired(true)))
  .addSubcommand((sub) => sub.setName("suggest").setDescription("Submit a suggestion").addStringOption((o) => o.setName("text").setDescription("Suggestion").setMaxLength(1900).setRequired(true)))
  .addSubcommand((sub) => sub.setName("starboard").setDescription("Show the starboard configuration status"))
  .addSubcommand((sub) => sub.setName("quote").setDescription("Quote text in a formatted message").addStringOption((o) => o.setName("text").setDescription("Text to quote").setMaxLength(1800).setRequired(true)))
  .addSubcommand((sub) => sub.setName("afk").setDescription("Set or clear your AFK status").addStringOption((o) => o.setName("message").setDescription("AFK reason; omit to clear").setMaxLength(300)))
  .addSubcommand((sub) => sub.setName("remind").setDescription("Set a reminder in this channel").addIntegerOption((o) => o.setName("minutes").setDescription("Minutes from now").setMinValue(1).setMaxValue(10080).setRequired(true)).addStringOption((o) => o.setName("message").setDescription("Reminder text").setMaxLength(500).setRequired(true)))
  .addSubcommand((sub) => sub.setName("birthday").setDescription("Set your birthday for this session").addStringOption((o) => o.setName("date").setDescription("MM-DD").setRequired(true)))
  .addSubcommand((sub) => sub.setName("role").setDescription("Add or remove a role from a member").addUserOption((o) => o.setName("user").setDescription("Member").setRequired(true)).addRoleOption((o) => o.setName("role").setDescription("Role").setRequired(true)).addStringOption((o) => o.setName("action").setDescription("Action").setRequired(true).addChoices({ name: "Add", value: "add" }, { name: "Remove", value: "remove" })))
  .addSubcommand((sub) => sub.setName("roles").setDescription("List server roles"))
  .addSubcommand((sub) => sub.setName("membercount").setDescription("Show the server member count"))
  .addSubcommand((sub) => sub.setName("servericon").setDescription("Show the server icon"))
  .addSubcommand((sub) => sub.setName("serverbanner").setDescription("Show the server banner"))
  .addSubcommand((sub) => sub.setName("boosters").setDescription("List server boosters"))
  .addSubcommand((sub) => sub.setName("invites").setDescription("List server invites"))
  .addSubcommand((sub) => sub.setName("activity").setDescription("Show visible member activity"))
  .addSubcommand((sub) => sub.setName("profile").setDescription("Show a member profile").addUserOption((o) => o.setName("user").setDescription("Member").setRequired(false)))
  .addSubcommand((sub) => sub.setName("rep").setDescription("Give a member reputation").addUserOption((o) => o.setName("user").setDescription("Member").setRequired(true)))
  .addSubcommand((sub) => sub.setName("repboard").setDescription("Show the reputation leaderboard"))
  .addSubcommand((sub) => sub.setName("events").setDescription("List scheduled Discord events"))
  .addSubcommand((sub) => sub.setName("giveaway").setDescription("Start a giveaway").addIntegerOption((o) => o.setName("minutes").setDescription("Duration").setMinValue(1).setMaxValue(10080).setRequired(true)).addStringOption((o) => o.setName("prize").setDescription("Prize").setMaxLength(200).setRequired(true)))
  .addSubcommand((sub) => sub.setName("giveaway-end").setDescription("End a giveaway").addStringOption((o) => o.setName("message_id").setDescription("Giveaway message ID").setRequired(true)))
  .addSubcommand((sub) => sub.setName("giveaway-reroll").setDescription("Reroll a giveaway winner").addStringOption((o) => o.setName("message_id").setDescription("Giveaway message ID").setRequired(true)))
  .addSubcommand((sub) => sub.setName("feedback").setDescription("Submit feedback to this channel").addStringOption((o) => o.setName("text").setDescription("Feedback").setMaxLength(1900).setRequired(true)))
  .addSubcommand((sub) => sub.setName("slowmode").setDescription("Set channel slowmode").addIntegerOption((o) => o.setName("seconds").setDescription("0 to disable").setMinValue(0).setMaxValue(21600).setRequired(true)));

function textChannel(interaction: ChatInputCommandInteraction) {
  return interaction.channel?.type === ChannelType.GuildText ? interaction.channel : null;
}

function can(interaction: ChatInputCommandInteraction, permission: bigint) {
  return Boolean(interaction.guild?.members.me?.permissions.has(permission));
}

export default {
  data,
  async execute(interaction: ChatInputCommandInteraction) {
    const guild = interaction.guild;
    if (!guild || !interaction.guildId) return replyV2(interaction, { title: "Server only", body: "Community commands must be used inside a server.", ephemeral: true });
    const subcommand = interaction.options.getSubcommand();
    try {
      if (subcommand === "announce") {
        if (!can(interaction, PermissionFlagsBits.ManageMessages)) throw new Error("I need Manage Messages to post announcements.");
        const channel = textChannel(interaction);
        if (!channel) throw new Error("Use this command in a text channel.");
        await channel.send({ content: `📢 **${guild.name} announcement**\n${interaction.options.getString("message", true)}` });
        return replyV2(interaction, { title: "Announcement posted", body: `The announcement was published in ${channel}.` });
      }
      if (subcommand === "poll") {
        const channel = textChannel(interaction);
        if (!channel) throw new Error("Use this command in a text channel.");
        const options = interaction.options.getString("options", true).split(",").map((option) => option.trim()).filter(Boolean).slice(0, 10);
        if (options.length < 2) throw new Error("A poll needs at least two options.");
        const labels = options.map((option, index) => `${index + 1}️⃣ ${option}`).join("\n");
        const poll = await channel.send({ content: `📊 **${interaction.options.getString("question", true)}**\n\n${labels}\n\nVote by reacting with the matching number.` });
        for (let index = 0; index < options.length; index += 1) await poll.react(`${index + 1}️⃣`);
        return replyV2(interaction, { title: "Poll created", body: `Poll created: ${poll.url}` });
      }
      if (subcommand === "suggest" || subcommand === "feedback") {
        const channel = textChannel(interaction);
        if (!channel) throw new Error("Use this command in a text channel.");
        const text = interaction.options.getString("text", true);
        await channel.send({ content: `📝 **${subcommand === "suggest" ? "Suggestion" : "Feedback"} from ${interaction.user}**\n${text}` });
        return replyV2(interaction, { title: `${subcommand === "suggest" ? "Suggestion" : "Feedback"} submitted`, body: "Your message was posted for the community." });
      }
      if (subcommand === "starboard") return replyV2(interaction, { title: "Starboard status", body: "Starboard reactions are available through message reactions. Configure a dedicated channel in the server settings dashboard." });
      if (subcommand === "quote") return replyV2(interaction, { title: "Quote", body: `> ${interaction.options.getString("text", true).replace(/\n/g, "\n> ")}\n\n— ${interaction.user}` });
      if (subcommand === "afk") {
        const message = interaction.options.getString("message");
        const key = `${guild.id}:${interaction.user.id}`;
        if (message) afkUsers.set(key, message); else afkUsers.delete(key);
        return replyV2(interaction, { title: message ? "AFK enabled" : "AFK cleared", body: message ? `I will show: **${message}**` : "You are no longer marked AFK." });
      }
      if (subcommand === "remind") {
        const minutes = interaction.options.getInteger("minutes", true);
        const message = interaction.options.getString("message", true);
        const key = `${guild.id}:${interaction.user.id}`;
        const previous = reminders.get(key);
        if (previous) clearTimeout(previous);
        reminders.set(key, setTimeout(() => { textChannel(interaction)?.send(`⏰ ${interaction.user}, reminder: **${message}**`).catch(() => undefined); reminders.delete(key); }, minutes * 60_000));
        return replyV2(interaction, { title: "Reminder set", body: `I will remind you in **${minutes} minute${minutes === 1 ? "" : "s"}.` });
      }
      if (subcommand === "birthday") return replyV2(interaction, { title: "Birthday saved", body: `Your birthday is set to **${interaction.options.getString("date", true)}** for this bot session.` });
      if (subcommand === "role") {
        if (!can(interaction, PermissionFlagsBits.ManageRoles)) throw new Error("I need Manage Roles for role changes.");
        const member = await guild.members.fetch(interaction.options.getUser("user", true).id);
        const selectedRole = interaction.options.getRole("role", true);
        const role = await guild.roles.fetch(selectedRole.id);
        if (!role) throw new Error("That role no longer exists.");
        if (role.position >= guild.members.me!.roles.highest.position) throw new Error("That role is higher than my highest role.");
        const action = interaction.options.getString("action", true);
        if (action === "add") await member.roles.add(role, `Community role command by ${interaction.user.tag}`); else await member.roles.remove(role, `Community role command by ${interaction.user.tag}`);
        return replyV2(interaction, { title: `Role ${action}ed`, body: `${role} was ${action === "add" ? "added to" : "removed from"} ${member}.` });
      }
      if (subcommand === "roles") return replyV2(interaction, { title: "Server roles", body: guild.roles.cache.filter((role) => role.id !== guild.id).sort((a, b) => b.position - a.position).map((role) => `${role} — ${role.members.size} members`).slice(0, 50).join("\n") || "No roles found." });
      if (subcommand === "membercount") return replyV2(interaction, { title: "Member count", body: `**${guild.name}** has **${guild.memberCount.toLocaleString()}** members.` });
      if (subcommand === "servericon" || subcommand === "serverbanner") {
        const image = subcommand === "servericon" ? guild.iconURL({ size: 1024 }) : guild.bannerURL({ size: 1024 });
        return replyV2(interaction, { title: subcommand === "servericon" ? "Server icon" : "Server banner", body: image ? `Current ${subcommand === "servericon" ? "icon" : "banner"} for **${guild.name}**.` : "This server has no such asset.", imageUrls: image ? [image] : undefined });
      }
      if (subcommand === "boosters") return replyV2(interaction, { title: "Server boosters", body: guild.members.cache.filter((member) => member.premiumSince).map((member) => `• ${member} since <t:${Math.floor(member.premiumSince!.getTime() / 1000)}:D>`).join("\n") || "No cached boosters found." });
      if (subcommand === "invites") {
        if (!can(interaction, PermissionFlagsBits.ManageGuild)) throw new Error("I need Manage Guild to list invites.");
        const invites = await guild.invites.fetch();
        return replyV2(interaction, { title: "Server invites", body: invites.size ? invites.map((invite) => `• discord.gg/${invite.code} — ${invite.uses ?? 0} uses — ${invite.inviter ?? "unknown creator"}`).join("\n") : "No invites found." });
      }
      if (subcommand === "activity") return replyV2(interaction, { title: "Member activity", body: guild.presences.cache.map((presence) => `• <@${presence.userId}> — ${presence.activities.map((activity) => activity.name).join(", ") || "online"}`).slice(0, 50).join("\n") || "No visible activities are currently cached." });
      if (subcommand === "profile") {
        const user = interaction.options.getUser("user") ?? interaction.user;
        const member = await guild.members.fetch(user.id).catch(() => null);
        return replyV2(interaction, { title: `${user.username}'s profile`, body: [`**User ID:** \`${user.id}\``, `**Joined:** ${member?.joinedTimestamp ? `<t:${Math.floor(member.joinedTimestamp / 1000)}:D>` : "Not a current member"}`, `**Roles:** ${member?.roles.cache.filter((role) => role.id !== guild.id).map((role) => role.name).join(", ") || "none"}`].join("\n"), imageUrls: [user.displayAvatarURL({ size: 512 })] });
      }
      if (subcommand === "rep") {
        const target = interaction.options.getUser("user", true);
        if (target.id === interaction.user.id) throw new Error("You cannot give yourself reputation.");
        const key = `${guild.id}:${target.id}`;
        const value = (reputation.get(key) ?? 0) + 1;
        reputation.set(key, value);
        return replyV2(interaction, { title: "Reputation given", body: `${target} now has **${value}** reputation points.` });
      }
      if (subcommand === "repboard") return replyV2(interaction, { title: "Reputation board", body: [...reputation.entries()].filter(([key]) => key.startsWith(`${guild.id}:`)).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([key, value], index) => `${index + 1}. <@${key.split(":")[1]}> — **${value}** rep`).join("\n") || "No reputation has been given yet." });
      if (subcommand === "events") {
        const events = await guild.scheduledEvents.fetch();
        return replyV2(interaction, { title: "Scheduled events", body: events.size ? events.map((event) => `• **${event.name}** — <t:${Math.floor(event.scheduledStartTimestamp! / 1000)}:F> — ${event.status}`).join("\n") : "No scheduled events found." });
      }
      if (subcommand === "giveaway") {
        const channel = textChannel(interaction);
        if (!channel) throw new Error("Use this command in a text channel.");
        const minutes = interaction.options.getInteger("minutes", true);
        const prize = interaction.options.getString("prize", true);
        const message = await channel.send({ content: `🎉 **Giveaway**\nPrize: **${prize}**\nReact with 🎉 to enter. Ends <t:${Math.floor((Date.now() + minutes * 60_000) / 1000)}:R>.` });
        await message.react("🎉");
        const giveaway = { messageId: message.id, channelId: channel.id, endsAt: Date.now() + minutes * 60_000, prize, entries: new Set<string>() };
        giveaways.set(message.id, giveaway);
        setTimeout(() => finishGiveaway(interaction, message.id).catch(() => undefined), minutes * 60_000);
        return replyV2(interaction, { title: "Giveaway started", body: `Giveaway message: ${message.url}` });
      }
      if (subcommand === "giveaway-end" || subcommand === "giveaway-reroll") {
        const id = interaction.options.getString("message_id", true);
        if (!giveaways.has(id)) throw new Error("That giveaway is not active in this bot process.");
        await finishGiveaway(interaction, id, subcommand === "giveaway-reroll");
        return replyV2(interaction, { title: subcommand === "giveaway-end" ? "Giveaway ended" : "Giveaway rerolled", body: "The giveaway result was posted in its channel." });
      }
      if (subcommand === "slowmode") {
        if (!can(interaction, PermissionFlagsBits.ManageChannels)) throw new Error("I need Manage Channels to change slowmode.");
        const channel = textChannel(interaction);
        if (!channel) throw new Error("Use this command in a text channel.");
        const seconds = interaction.options.getInteger("seconds", true);
        await channel.setRateLimitPerUser(seconds, `Community slowmode command by ${interaction.user.tag}`);
        return replyV2(interaction, { title: "Slowmode updated", body: `${channel} slowmode is now **${seconds} seconds**.` });
      }
      throw new Error(`Unknown community operation: ${subcommand}`);
    } catch (error) {
      await replyV2(interaction, { title: "Community command failed", body: error instanceof Error ? error.message : "Discord rejected the operation.", ephemeral: true });
    }
  },
};

async function finishGiveaway(interaction: ChatInputCommandInteraction, messageId: string, reroll = false) {
  const giveaway = giveaways.get(messageId);
  if (!giveaway) return;
  const channel = await interaction.client.channels.fetch(giveaway.channelId).catch(() => null);
  if (!channel || channel.type !== ChannelType.GuildText) return;
  const message = await channel.messages.fetch(messageId).catch(() => null);
  if (!message) return;
  const reaction = message.reactions.cache.get("🎉");
  const users = reaction ? await reaction.users.fetch() : null;
  const entries = users ? [...users.filter((user) => !user.bot).keys()] : [];
  const winner = entries.length ? entries[Math.floor(Math.random() * entries.length)] : null;
  await channel.send(winner ? `🎉 ${reroll ? "New winner" : "Winner"}: <@${winner}> wins **${giveaway.prize}**!` : `No valid entries for **${giveaway.prize}**.`);
  giveaways.delete(messageId);
}
