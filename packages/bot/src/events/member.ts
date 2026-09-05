import { GuildMember, TextChannel } from "discord.js";
import { prisma } from "@aeris/shared";

export async function onGuildMemberAdd(member: GuildMember) {
  const guildId = member.guild.id;

  await prisma.guildMember.upsert({
    where: { id: `${guildId}:${member.id}` },
    create: {
      id: `${guildId}:${member.id}`,
      guildId,
      userId: member.id,
    },
    update: {},
  });

  try {
    const config = await prisma
      .welcomeConfig.findUnique({ where: { guildId } })
      .catch(() => undefined);

    if (config) {
      if (config.channelId) {
        const channel = (member.guild.channels.cache.get(config.channelId) as TextChannel) ?? null;
        if (channel) {
          const message = config.message
            .replace("{user}", member.user.username)
            .replace("{server}", member.guild.name)
            .replace(/{mention}/g, member.user.toString());
          await channel.send({ content: message });
        }
      }

      if (config.dmEnabled) {
        const dm = config.dmMessage
          .replace("{user}", member.user.username)
          .replace("{server}", member.guild.name);
        try {
          await member.send({ content: dm });
        } catch {
          // cannot dm
        }
      }
    }
  } catch (error) {
    console.error("Welcome error:", error);
  }
}
