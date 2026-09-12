import { Client } from "discord.js";
import { prisma } from "@aeris/shared";

export async function onReady(client: Client) {
  console.log(`Aeris online | ${client.guilds.cache.size} guilds`);

  // Sync all guilds the bot is in to the database so the dashboard can display them
  try {
    const guilds = client.guilds.cache.values();
    for (const guild of guilds) {
      await prisma.guild.upsert({
        where: { id: guild.id },
        create: {
          id: guild.id,
          name: guild.name,
          icon: guild.icon,
          memberCount: guild.memberCount ?? 0,
        },
        update: {
          name: guild.name,
          icon: guild.icon,
          memberCount: guild.memberCount ?? 0,
        },
      });
    }
    console.log(`Synced ${client.guilds.cache.size} guilds to database`);
  } catch (error) {
    console.error("Failed to sync guilds to database:", error);
  }
}
