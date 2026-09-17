import { Client } from "discord.js";
import { onMessageCreate } from "./message.js";
import { onGuildMemberAdd } from "./member.js";
import { onReady } from "./ready.js";
import { onGuildCreate } from "./guild.js";
import { onPrefixMessage } from "./prefix.js";

export function initEventHandlers(client: Client) {
  client.on("ready", () => onReady(client));
  client.on("messageCreate", async (message) => {
    await onMessageCreate(message);
    await onPrefixMessage(message);
  });
  client.on("guildMemberAdd", onGuildMemberAdd);
  client.on("guildCreate", onGuildCreate);
}
