import { Client } from "discord.js";
import { onMessageCreate } from "./message.js";
import { onGuildMemberAdd } from "./member.js";
import { onReady } from "./ready.js";

export function initEventHandlers(client: Client) {
  client.on("ready", () => onReady(client));
  client.on("messageCreate", onMessageCreate);
  client.on("guildMemberAdd", onGuildMemberAdd);
}
