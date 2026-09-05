import { ChatInputCommandInteraction } from "discord.js";
import { prisma } from "@aeris/shared";

export async function handleBlackjack(
  interaction: ChatInputCommandInteraction,
  guildId: string,
) {
  const memberId = interaction.user.id;
  const seed = Math.floor(Math.random() * 1000);
  const dealerCard = Math.floor(Math.random() * 13) + 1;
  const playerCard = Math.floor(Math.random() * 13) + 1;

  const playerTotal = Math.min(playerCard, 10);
  const dealerTotal = Math.min(dealerCard, 10);

  let result: string;
  if (playerTotal > 21) {
    result = "You busted!";
  } else if (dealerTotal > 21) {
    result = "Dealer busted! You win!";
  } else if (playerTotal > dealerTotal) {
    result = "You win!";
  } else if (dealerTotal > playerTotal) {
    result = "Dealer wins.";
  } else {
    result = "It's a draw.";
  }

  const bet = 10;
  const wonCards = result.includes("win") ? bet * 2 : 0;

  await prisma.economyUser.upsert({
    where: { id: `${guildId}:${memberId}` },
    create: { id: `${guildId}:${memberId}`, guildId, userId: memberId, cash: -bet },
    update: {
      cash: { increment: wonCards - bet },
    },
  });

  await interaction.reply({
    content: [
      `**Blackjack**`,
      `Your hand: ${playerTotal} | Dealer: ${dealerTotal}`,
      result,
      `Bet: **${bet}** | Payout: **${wonCards}**`,
    ].join("\n"),
    components: [],
  });
}

export async function handleTrade(
  interaction: ChatInputCommandInteraction,
  guildId: string,
) {
  const targetId = interaction.options.getUser("user")?.id;
  const amount = interaction.options.getInteger("amount");

  if (!targetId || !amount || amount <= 0) {
    await interaction.reply({
      content: "Usage: /economy trade <user> <amount>",
      components: [],
    });
    return;
  }

  const sender = await prisma.economyUser.findUnique({
    where: { id: `${guildId}:${interaction.user.id}` },
  });
  const receiver = await prisma.economyUser.findUnique({
    where: { id: `${guildId}:${targetId}` },
  });

  if (!sender || sender.cash < amount) {
    await interaction.reply({
      content: "You do not have enough cash to send that much.",
      components: [],
    });
    return;
  }

  await prisma.economyUser.update({
    where: { id: `${guildId}:${interaction.user.id}` },
    data: { cash: { decrement: amount } },
  });
  await prisma.economyUser.upsert({
    where: { id: `${guildId}:${targetId}` },
    create: { id: `${guildId}:${targetId}`, guildId, userId: targetId, cash: amount },
    update: { cash: { increment: amount } },
  });

  await interaction.reply({
    content: `Sent **${amount}** coins to <@${targetId}>.`,
    components: [],
  });
}
