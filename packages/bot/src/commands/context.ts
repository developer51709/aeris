import {
  ApplicationCommandType,
  ContextMenuCommandBuilder,
  MessageContextMenuCommandInteraction,
  UserContextMenuCommandInteraction,
} from "discord.js";
import { containerResponse } from "../components.js";

export const contextCommands = [
  {
    data: new ContextMenuCommandBuilder()
      .setName("View Aeris Profile")
      .setType(ApplicationCommandType.User),
    async execute(interaction: UserContextMenuCommandInteraction) {
      const user = interaction.targetUser;
      await interaction.reply({
        flags: 32768,
        components: [containerResponse({
          title: "Discord profile",
          body: `**${user.username}**\nUser ID: \`${user.id}\`\nCreated: <t:${Math.floor(user.createdTimestamp / 1000)}:D>`,
          imageUrls: [user.displayAvatarURL({ size: 256 })],
        })],
      });
    },
  },
  {
    data: new ContextMenuCommandBuilder()
      .setName("Quote with Aeris")
      .setType(ApplicationCommandType.Message),
    async execute(interaction: MessageContextMenuCommandInteraction) {
      const message = interaction.targetMessage;
      const content = message.content.trim() || "[This message has no text content.]";
      await interaction.reply({
        flags: 32768,
        components: [containerResponse({
          title: `Quote · ${message.author.username}`,
          body: `> ${content.slice(0, 1800).replace(/\n/g, "\n> ")}\n\n[Jump to message](${message.url})`,
        })],
      });
    },
  },
];
