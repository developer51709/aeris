import { Events, Guild } from "discord.js";
import { prisma } from "@aeris/shared";

export async function onGuildCreate(guild: Guild) {
  try {
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
    console.log(`Synced new guild: ${guild.name} (${guild.id})`);
  } catch (error) {
    console.error(`Failed to sync guild ${guild.id}:`, error);
  }
}
