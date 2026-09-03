import {
  SlashCommandBuilder,
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
} from "discord.js";
import { uploadToCloudinary } from "../utils/cloudinary.js";
import { generateBlackjackCard } from "../image/blackjackCard.js";
import { AttachmentBuilder } from "discord.js";

export const data = new SlashCommandBuilder()
  .setName("economy")
  .setDescription("Economy commands")
  .addSubcommand((sub) =>
    sub.setName("balance").setDescription("Check your balance")
  )
  .addSubcommand((sub) =>
    sub.setName("daily").setDescription("Claim your daily reward")
  )
  .addSubcommand((sub) =>
    sub
      .setName("work")
      .setDescription("Work to earn coins")
  )
  .addSubcommand((sub) =>
    sub
      .setName("blackjack")
      .setDescription("Play blackjack")
      .addIntegerOption((opt) =>
        opt.setName("bet").setDescription("Amount to bet").setRequired(true).setMinValue(1)
      )
  )
  .addSubcommand((sub) =>
    sub
      .setName("pay")
      .setDescription("Send coins to another user")
      .addUserOption((opt) => opt.setName("user").setDescription("User to pay").setRequired(true))
      .addIntegerOption((opt) => opt.setName("amount").setDescription("Amount to send").setRequired(true).setMinValue(1))
  )
  .addSubcommand((sub) =>
    sub.setName("leaderboard").setDescription("View economy leaderboard")
  );

export async function execute(interaction: any, prisma: any) {
  const subcommand = interaction.options.getSubcommand();
  const guildId = interaction.guild.id;
  const userId = interaction.user.id;

  const getMember = async () => {
    let member = await prisma.guildMember.findUnique({
      where: { guildId_userId: { guildId, userId } },
    });
    if (!member) {
      member = await prisma.guildMember.create({
        data: { guildId, userId },
      });
    }
    return member;
  };

  if (subcommand === "balance") {
    const member = await getMember();
    await interaction.reply({
      components: [
        new ContainerBuilder().addTextDisplayComponents(
          new TextDisplayBuilder().setContent(
            `## 💰 Balance\n\n**${member.balance.toLocaleString()}** coins`
          )
        ),
      ],
      flags: 4096,
    });
  } else if (subcommand === "daily") {
    const member = await getMember();
    const now = new Date();
    const lastDaily = member.lastDaily;

    if (lastDaily && now.getTime() - lastDaily.getTime() < 86400000) {
      const nextDaily = new Date(lastDaily.getTime() + 86400000);
      return interaction.reply({
        components: [
          new ContainerBuilder().addTextDisplayComponents(
            new TextDisplayBuilder().setContent(
              `## ⏰ Daily Cooldown\n\nCome back <t:${Math.round(nextDaily.getTime() / 1000)}:R>`
            )
          ),
        ],
        flags: 4096,
        ephemeral: true,
      });
    }

    const config = await prisma.economyConfig.findUnique({
      where: { guildId },
    });
    const amount = config?.dailyAmount || 100;

    await prisma.guildMember.update({
      where: { guildId_userId: { guildId, userId } },
      data: { balance: member.balance + amount, lastDaily: now },
    });

    await interaction.reply({
      components: [
        new ContainerBuilder().addTextDisplayComponents(
          new TextDisplayBuilder().setContent(
            `## 🎁 Daily Reward\n\nYou claimed **${amount}** coins!\n**New Balance:** ${(member.balance + amount).toLocaleString()} coins`
          )
        ),
      ],
      flags: 4096,
    });
  } else if (subcommand === "work") {
    const member = await getMember();
    const config = await prisma.economyConfig.findUnique({
      where: { guildId },
    });
    const min = config?.workMin || 50;
    const max = config?.workMax || 200;
    const earned = Math.floor(Math.random() * (max - min + 1)) + min;

    const jobs = [
      "mined some diamonds",
      "coded a website",
      "delivered pizza",
      "fought a dragon",
      "gardened flowers",
      "fixed a computer",
      "walked dogs",
      "tutored students",
    ];
    const job = jobs[Math.floor(Math.random() * jobs.length)];

    await prisma.guildMember.update({
      where: { guildId_userId: { guildId, userId } },
      data: { balance: member.balance + earned },
    });

    await interaction.reply({
      components: [
        new ContainerBuilder().addTextDisplayComponents(
          new TextDisplayBuilder().setContent(
            `## 💼 Work\n\nYou ${job} and earned **${earned}** coins!\n**New Balance:** ${(member.balance + earned).toLocaleString()} coins`
          )
        ),
      ],
      flags: 4096,
    });
  } else if (subcommand === "blackjack") {
    const bet = interaction.options.getInteger("bet");
    const member = await getMember();

    if (member.balance < bet) {
      return interaction.reply({
        components: [
          new ContainerBuilder().addTextDisplayComponents(
            new TextDisplayBuilder().setContent("❌ Insufficient balance!")
          ),
        ],
        flags: 4096,
        ephemeral: true,
      });
    }

    // Simple blackjack
    const cards = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];
    const suits = ["♠", "♥", "♦", "♣"];

    const dealCard = () => ({
      value: cards[Math.floor(Math.random() * cards.length)],
      suit: suits[Math.floor(Math.random() * suits.length)],
    });

    const handValue = (hand: any[]) => {
      let val = 0;
      let aces = 0;
      for (const c of hand) {
        if (c.value === "A") { aces++; val += 11; }
        else if (["K", "Q", "J"].includes(c.value)) val += 10;
        else val += parseInt(c.value);
      }
      while (val > 21 && aces > 0) { val -= 10; aces--; }
      return val;
    };

    const playerHand = [dealCard(), dealCard()];
    const dealerHand = [dealCard(), dealCard()];

    const playerVal = handValue(playerHand);
    const dealerVal = handValue(dealerHand);

    let result: string;
    let newBalance: number;

    if (playerVal === 21 && dealerVal !== 21) {
      result = "🎉 **Blackjack!** You win!";
      newBalance = member.balance + Math.floor(bet * 1.5);
    } else if (dealerVal === 21 && playerVal !== 21) {
      result = "💀 Dealer has Blackjack. You lose.";
      newBalance = member.balance - bet;
    } else if (playerVal > 21) {
      result = "💥 **Bust!** You went over 21.";
      newBalance = member.balance - bet;
    } else if (dealerVal > 21) {
      result = "🎉 **Dealer busts!** You win!";
      newBalance = member.balance + bet;
    } else if (playerVal > dealerVal) {
      result = "🎉 **You win!**";
      newBalance = member.balance + bet;
    } else if (dealerVal > playerVal) {
      result = "💀 **Dealer wins.**";
      newBalance = member.balance - bet;
    } else {
      result = "🤝 **Push!** It's a tie.";
      newBalance = member.balance;
    }

    await prisma.guildMember.update({
      where: { guildId_userId: { guildId, userId } },
      data: { balance: newBalance },
    });

    const cardBuffer = await generateBlackjackCard({
      playerHand,
      dealerHand,
      playerVal,
      dealerVal,
      result,
      bet,
      newBalance,
    });
    const attachment = new AttachmentBuilder(cardBuffer, { name: "blackjack.png" });

    await interaction.reply({
      files: [attachment],
      flags: 4096,
    });
  } else if (subcommand === "pay") {
    const target = interaction.options.getUser("user");
    const amount = interaction.options.getInteger("amount");

    if (target.id === userId) {
      return interaction.reply({
        components: [
          new ContainerBuilder().addTextDisplayComponents(
            new TextDisplayBuilder().setContent("❌ You can't pay yourself!")
          ),
        ],
        flags: 4096,
        ephemeral: true,
      });
    }

    const member = await getMember();
    if (member.balance < amount) {
      return interaction.reply({
        components: [
          new ContainerBuilder().addTextDisplayComponents(
            new TextDisplayBuilder().setContent("❌ Insufficient balance!")
          ),
        ],
        flags: 4096,
        ephemeral: true,
      });
    }

    await prisma.guildMember.update({
      where: { guildId_userId: { guildId, userId } },
      data: { balance: member.balance - amount },
    });

    await prisma.guildMember.upsert({
      where: { guildId_userId: { guildId, userId: target.id } },
      create: { guildId, userId: target.id, balance: amount },
      update: { balance: { increment: amount } },
    });

    await interaction.reply({
      components: [
        new ContainerBuilder().addTextDisplayComponents(
          new TextDisplayBuilder().setContent(
            `## 💸 Payment Sent\n\n**${amount.toLocaleString()}** coins → ${target}`
          )
        ),
      ],
      flags: 4096,
    });
  } else if (subcommand === "leaderboard") {
    const members = await prisma.guildMember.findMany({
      where: { guildId },
      orderBy: { balance: "desc" },
      take: 10,
    });

    const medals = ["🥇", "🥈", "🥉"];
    const lb = members
      .map((m: any, i: number) =>
        `${medals[i] || `${i + 1}.`} <@${m.userId}> — **${m.balance.toLocaleString()}** coins`
      )
      .join("\n");

    await interaction.reply({
      components: [
        new ContainerBuilder().addTextDisplayComponents(
          new TextDisplayBuilder().setContent(`## 💰 Economy Leaderboard\n\n${lb || "No data yet."}`)
        ),
      ],
      flags: 4096,
    });
  }
}
