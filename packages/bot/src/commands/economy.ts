import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
} from "discord.js";
import { prisma } from "@aeris/shared";

export default {
  data: new SlashCommandBuilder()
    .setName("economy")
    .setDescription("Economy system commands")
    .addSubcommand((sub) =>
      sub
        .setName("balance")
        .setDescription("Check your or another user's balance")
        .addUserOption((opt) =>
          opt.setName("user").setDescription("User to check").setRequired(false),
        ),
    )
    .addSubcommand((sub) =>
      sub
        .setName("daily")
        .setDescription("Claim your daily rewards"),
    )
    .addSubcommand((sub) =>
      sub
        .setName("work")
        .setDescription("Earn some cash by working"),
    )
    .addSubcommand((sub) =>
      sub
        .setName("leaderboard")
        .setDescription("View the server economy leaderboard")
        .addIntegerOption((opt) =>
          opt
            .setName("page")
            .setDescription("Page number")
            .setMinValue(1)
            .setMaxValue(100)
            .setRequired(false),
        ),
    ),
  async execute(interaction: ChatInputCommandInteraction) {
    const guildId = interaction.guildId!;
    const subcommand = interaction.options.getSubcommand();

    switch (subcommand) {
      case "balance":
        return handleBalance(interaction, guildId);
      case "daily":
        return handleDaily(interaction, guildId);
      case "work":
        return handleWork(interaction, guildId);
      case "leaderboard":
        return handleEcoLeaderboard(interaction, guildId);
    }
  },
};

async function handleBalance(
  interaction: ChatInputCommandInteraction,
  guildId: string,
) {
  const target = interaction.options.getUser("user") ?? interaction.user;
  const data = await prisma.economyUser.findUnique({
    where: { id: `${guildId}:${target.id}` },
  });

  const balance = data ?? { cash: 0, bank: 0 };

  await interaction.reply({
    content: [
      `**Balance** — ${target.username ?? "Unknown"}`,
      `Cash: **${balance.cash.toLocaleString()}**`,
      `Bank: **${balance.bank.toLocaleString()}**`,
      `Total: **${(balance.cash + balance.bank).toLocaleString()}**`,
    ].join("\n"),
    components: [],
  });
}

async function handleDaily(interaction: ChatInputCommandInteraction, guildId: string) {
  const memberId = interaction.user.id;
  const data = await prisma.economyUser.findUnique({
    where: { id: `${guildId}:${memberId}` },
  });

  if (data && data.lastDaily) {
    const diff = Date.now() - data.lastDaily.getTime();
    if (diff < 86400000) {
      await interaction.reply({
        content: "You already claimed your daily reward. Come back in 24 hours.",
        components: [],
      });
      return;
    }
  }

  const earning = 500 + Math.floor(Math.random() * 100);
  await prisma.economyUser.upsert({
    where: { id: `${guildId}:${memberId}` },
    create: {
      id: `${guildId}:${memberId}`,
      guildId,
      userId: memberId,
      cash: earning,
    },
    update: {
      cash: { increment: earning },
      lastDaily: new Date(),
    },
  });

  const settings = await prisma.economySettings.findUnique({ where: { guildId } });
  const amount = settings?.dailyAmount ?? earning;

  await interaction.reply({
    content: `You collected your daily reward of **${amount}** coins!`,
    components: [],
  });
}

async function handleWork(interaction: ChatInputCommandInteraction, guildId: string) {
  const memberId = interaction.user.id;
  const earning = 100 + Math.floor(Math.random() * 400);
  const job = [
    "Programmer",
    "Artist",
    "Chef",
    "Builder",
    "Miner",
    "Merchant",
  ][Math.floor(Math.random() * 6)];

  await prisma.economyUser.upsert({
    where: { id: `${guildId}:${memberId}` },
    create: {
      id: `${guildId}:${memberId}`,
      guildId,
      userId: memberId,
      cash: earning,
    },
    update: {
      cash: { increment: earning },
    },
  });

  await interaction.reply({
    content: `You worked as a **${job}** and earned **${earning}** coins!`,
    components: [],
  });
}

async function handleEcoLeaderboard(
  interaction: ChatInputCommandInteraction,
  guildId: string,
) {
  const page = (interaction.options.getInteger("page") ?? 1) - 1;
  const entries = await prisma
    .economyUser.findMany({
      where: { guildId },
      orderBy: { cash: "desc" },
    })
    .catch(() => []);

  const pageEntries = entries.slice(page * 10, page * 10 + 10);
  if (pageEntries.length === 0) {
    await interaction.reply({
      content: page === 0
        ? "No one has any cash yet."
        : "No entries on this page.",
      components: [],
    });
    return;
  }

  const lines = pageEntries.map((e, i) => {
    const rank = page * 10 + i + 1;
    const medal = rank === 1 ? "🥇" : rank === 2 ? "🥈" : rank === 3 ? "🥉" : `#${rank}`;
    return `${medal}  <@${e.userId}> — **${e.cash.toLocaleString()}**`;
  });

  await interaction.reply({
    content: ["**Economy Leaderboard**", ...lines].join("\n"),
    components: [],
  });
}
