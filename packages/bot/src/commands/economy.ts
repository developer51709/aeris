import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
} from "discord.js";
import { prisma } from "@aeris/shared";
import { aerisEmbed, COLORS } from "../lib/embeds.js";

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
        const embed = aerisEmbed()
          .setColor(COLORS.economy)
          .setTitle("💰 Balance")
          .addFields(
            { name: "Cash", value: w.cash.toLocaleString(), inline: true },
            { name: "Bank", value: w.bank.toLocaleString(), inline: true },
            { name: "Total", value: (w.cash + w.bank).toLocaleString(), inline: true },
          );
        await interaction.reply({ embeds: [embed] });
        break;
      }
      case "daily": {
        const w = await getWallet();
        const now = Date.now();
        const last = w.lastDaily ? new Date(w.lastDaily).getTime() : 0;
        const cooldown = 24 * 60 * 60 * 1000;
        if (now - last < cooldown) {
          const remaining = Math.ceil((cooldown - (now - last)) / 3600000);
          const embed = aerisEmbed()
            .setColor(COLORS.warning)
            .setTitle("⏳ Daily Reward")
            .setDescription(`You already claimed your daily reward. Come back in **${remaining}h**.`);
          await interaction.reply({ embeds: [embed] });
          return;
        }
        const settings = await prisma.economySettings.findUnique({ where: { guildId } });
        const amount = settings?.dailyAmount ?? 500;
        await prisma.economyUser.update({
          where: { id: key },
          data: { cash: { increment: amount }, lastDaily: new Date() },
        });
        const embed = aerisEmbed()
          .setColor(COLORS.economy)
          .setTitle("🎁 Daily Reward")
          .setDescription(`You claimed **${amount.toLocaleString()}** coins!`);
        await interaction.reply({ embeds: [embed] });
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
        const embed = aerisEmbed()
          .setColor(COLORS.economy)
          .setTitle("🛠️ Work")
          .setDescription(`You ${job} and earned **${earnings}** coins!`);
        await interaction.reply({ embeds: [embed] });
        break;
      }
      case "pay": {
        const target = interaction.options.getUser("user")!;
        const amount = interaction.options.getInteger("amount")!;
        if (target.id === userId) {
          const embed = aerisEmbed()
            .setColor(COLORS.danger)
            .setTitle("Invalid Payment")
            .setDescription("You can't pay yourself.");
          await interaction.reply({ embeds: [embed] });
          return;
        }
        const w = await getWallet();
        if (w.cash < amount) {
          const embed = aerisEmbed()
            .setColor(COLORS.danger)
            .setTitle("Insufficient Funds")
            .setDescription("You don't have enough coins for this transfer.");
          await interaction.reply({ embeds: [embed] });
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
        const embed = aerisEmbed()
          .setColor(COLORS.success)
          .setTitle("✅ Payment Sent")
          .setDescription(`Sent **${amount.toLocaleString()}** coins to ${target}.`);
        await interaction.reply({ embeds: [embed] });
        break;
      }
      case "leaderboard": {
        const rows = await prisma.economyUser.findMany({
          where: { guildId },
          orderBy: [{ cash: "desc" }, { bank: "desc" }],
          take: 10,
        });
        if (rows.length === 0) {
          const embed = aerisEmbed()
            .setColor(COLORS.neutral)
            .setTitle("💰 Economy Leaderboard")
            .setDescription("No economy data yet.");
          await interaction.reply({ embeds: [embed] });
          return;
        }
        const lines = rows.map(
          (r: { userId: string; cash: number; bank: number }, i: number) => {
            const medal = i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `#${i + 1}`;
            return `${medal} <@${r.userId}> — 💰 ${r.cash.toLocaleString()} | 🏦 ${r.bank.toLocaleString()}`;
          },
        );
        const embed = aerisEmbed()
          .setColor(COLORS.economy)
          .setTitle("💰 Economy Leaderboard")
          .setDescription(lines.join("\n"));
        await interaction.reply({ embeds: [embed] });
        break;
      }
    }
  },
};
