import { Message, TextChannel } from "discord.js";
import { prisma } from "@aeris/shared";

export async function onMessageCreate(message: Message) {
  if (message.author.bot || !message.guild) return;

  const guildId = message.guild.id;
  const userId = message.author.id;

  await prisma.guildMember.upsert({
    where: { id: `${guildId}:${userId}` },
    create: { id: `${guildId}:${userId}`, guildId, userId },
    update: {},
  });

  try {
    const leveling = await prisma
      .levelingSettings.findUnique({ where: { guildId } })
      .catch(() => undefined);

    if (leveling?.enabled) {
      await prisma.levelingData.upsert({
        where: { id: `${guildId}:${userId}` },
        create: {
          id: `${guildId}:${userId}`,
          guildId,
          userId,
          level: 1,
          xp: 0,
          totalXp: 0,
        },
        update: {
          xp: { increment: 5 },
          totalXp: { increment: 5 },
        },
      });

      const data = await prisma
        .levelingData.findUnique({ where: { id: `${guildId}:${userId}` } })
        .catch(() => undefined);

      if (data) {
        await maybeLevelUp(message, data, guildId, userId, leveling);
      }
    }
  } catch (error) {
    console.error("Leveling error:", error);
  }
}

async function maybeLevelUp(
  message: Message,
  data: NonNullable<Awaited<ReturnType<typeof prisma.levelingData.findUnique>>>,
  guildId: string,
  userId: string,
  settings: NonNullable<Awaited<ReturnType<typeof prisma.levelingSettings.findUnique>>>,
) {
  const requiredXp = data.level * 100 + 50;
  if (data.xp < requiredXp) return;

  await prisma.levelingData.update({
    where: { id: `${guildId}:${userId}` },
    data: {
      level: { increment: 1 },
      xp: 0,
    },
  });

  const next = await prisma
    .levelingData.findUnique({ where: { id: `${guildId}:${userId}` } })
    .catch(() => undefined);

  if (!next) return;

  const formatted = settings.levelUpMessage
    .replace("{user}", message.author.username)
    .replace("{level}", String(next.level));

  const channel = message.channel;
  if ("send" in channel) {
    await (channel as { send: (opts: { content: string }) => Promise<unknown> }).send({ content: formatted });
  }
}
