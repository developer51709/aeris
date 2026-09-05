import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ComponentType,
} from "discord.js";
import { prisma } from "@aeris/shared";

export default {
  data: new SlashCommandBuilder()
    .setName("economy")
    .setDescription("Economy commands")
    .addSubcommand((sub) => sub.setName("balance").setDescription("Check your balance"))
    .addSubcommand((sub) => sub.setName("daily").setDescription("Claim your daily reward"))
    .addSubcommand((sub) =>
      sub.setName("work").setDescription("Work for coins"),
    )
    .addSubcommand((sub) =>
      sub
        .setName("pay")
        .setDescription("Send coins to another user")
        .addUserOption((o) => o.setName("user").setDescription("Recipient").setRequired(true))
        .addIntegerOption((o) => o.setName("amount").setDescription("Amount").setRequired(true).setMinValue(1)),
    )
    .addSubcommand((sub) =>
      sub.setName("leaderboard").setDescription("Economy leaderboard"),
    ),
  async execute(interaction: ChatInputCommandInteraction) {
    const guildId = interaction.guildId!;
    const userId = interaction.user.id;
    const key = `${guildId}:${userId}`;

    const getWallet = () =>
      prisma.economyUser.upsert({
        where: { id: key },
        create: { id: key, guildId, userId },
        update: {},
      });

    switch (interaction.options.getSubcommand()) {
      case "balance": {
        const w = await getWallet();
        await interaction.reply({
          content: `💰 **Balance** — Cash: **${w.cash}** | Bank: **${w.bank}**`,
        });
        break;
      }
      case "daily": {
        const w = await getWallet();
        const now = Date.now();
        const last = w.lastDaily ? new Date(w.lastDaily).getTime() : 0;
        const cooldown = 24 * 60 * 60 * 1000;
        if (now - last < cooldown) {
          const remaining = Math.ceil((cooldown - (now - last)) / 3600000);
          await interaction.reply({
            content: `⏳ You already claimed your daily reward. Come back in **${remaining}h**.`,
          });
          return;
        }
        const settings = await prisma.economySettings.findUnique({ where: { guildId } });
        const amount = settings?.dailyAmount ?? 500;
        await prisma.economyUser.update({
          where: { id: key },
          data: { cash: { increment: amount }, lastDaily: new Date() },
        });
        await interaction.reply({
          content: `🎁 Daily reward claimed: **${amount}** coins!`,
        });
        break;
      }
      case "work": {
        const earnings = Math.floor(Math.random() * 150) + 50;
        await getWallet();
        await prisma.economyUser.update({
          where: { id: key },
          data: { cash: { increment: earnings } },
        });
        const jobs = ["delivered packages", "walked dogs", "tutored students", "fixed a server", "wrote some code"];
        const job = jobs[Math.floor(Math.random() * jobs.length)];
        await interaction.reply({
          content: `🛠️ You ${job} and earned **${earnings}** coins!`,
        });
        break;
      }
      case "pay": {
        const target = interaction.options.getUser("user")!;
        const amount = interaction.options.getInteger("amount")!;
        if (target.id === userId) {
          await interaction.reply({ content: "❌ You can't pay yourself." });
          return;
        }
        const w = await getWallet();
        if (w.cash < amount) {
          await interaction.reply({ content: "❌ Insufficient funds." });
          return;
        }
        const targetKey = `${guildId}:${target.id}`;
        await prisma.economyUser.upsert({
          where: { id: targetKey },
          create: { id: targetKey, guildId, userId: target.id, cash: amount },
          update: { cash: { increment: amount } },
        });
        await prisma.economyUser.update({
          where: { id: key },
          data: { cash: { decrement: amount } },
        });
        await interaction.reply({
          content: `✅ Sent **${amount}** coins to ${target}.`,
        });
        break;
      }
      case "leaderboard": {
        const rows = await prisma.economyUser.findMany({
          where: { guildId },
          orderBy: [{ cash: "desc" }, { bank: "desc" }],
          take: 10,
        });
        if (rows.length === 0) {
          await interaction.reply({ content: "No economy data yet." });
          return;
        }
        const lines = rows.map(
          (r: { userId: string; cash: number; bank: number }, i: number) => `**${i + 1}.** <@${r.userId}> — 💰 ${r.cash} | 🏦 ${r.bank}`,
        );
        await interaction.reply({
          content: `**💰 Economy Leaderboard**\n\n${lines.join("\n")}`,
        });
        break;
      }
    }
  },
};
