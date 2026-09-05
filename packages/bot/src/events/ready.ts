import { Client } from "discord.js";

export function onReady(client: Client) {
  console.log(`Aeris online | ${client.guilds.cache.size} guilds`);
}
