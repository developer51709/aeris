import { SlashCommandBuilder, ChatInputCommandInteraction } from "discord.js";
import { prisma } from "@aeris/shared";

type Card = { rank: string; suit: string };

const RANKS = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];
const SUITS = ["♠️", "♥️", "♦️", "♣️"];

function draw(): Card {
  return {
    rank: RANKS[Math.floor(Math.random() * RANKS.length)],
    suit: SUITS[Math.floor(Math.random() * SUITS.length)],
  };
}

function handValue(cards: Card[]): number {
  let total = 0;
  let aces = 0;
  for (const c of cards) {
    if (c.rank === "A") {
      aces++;
      total += 11;
    } else if (["J", "Q", "K"].includes(c.rank)) {
      total += 10;
    } else {
      total += parseInt(c.rank, 10);
    }
  }
  while (total > 21 && aces > 0) {
    total -= 10;
    aces--;
  }
  return total;
}

function fmt(cards: Card[]): string {
  return cards.map((c) => `${c.rank}${c.suit}`).join(" ");
}

export default {
  data: new SlashCommandBuilder()
    .setName("blackjack")
    .setDescription("Play blackjack")
    .addIntegerOption((o) =>
      o.setName("bet").setDescription("Bet amount").setRequired(true).setMinValue(10),
    ),
  async execute(interaction: ChatInputCommandInteraction) {
    const guildId = interaction.guildId!;
    const userId = interaction.user.id;
    const key = `${guildId}:${userId}`;
    const bet = interaction.options.getInteger("bet")!;

    const wallet = await prisma.economyUser.upsert({
      where: { id: key },
      create: { id: key, guildId, userId },
      update: {},
    });

    if (wallet.cash < bet) {
      await interaction.reply({ content: "❌ Insufficient funds for that bet." });
      return;
    }

    const playerHand = [draw(), draw()];
    const dealerHand = [draw(), draw()];

    let playerTotal = handValue(playerHand);
    const dealerTotal = handValue(dealerHand);

    await prisma.economyUser.update({
      where: { id: key },
      data: { cash: { decrement: bet } },
    });

    let outcome: string;
    let delta = 0;

    if (playerTotal === 21) {
      delta = Math.floor(bet * 2.5);
      outcome = "🎉 **Blackjack!** You win 2.5× your bet!";
    } else if (playerTotal > 21) {
      outcome = "💥 **Bust!** You lose.";
    } else if (dealerTotal > 21) {
      delta = bet * 2;
      outcome = "🏆 **Dealer busts!** You win 2× your bet!";
    } else if (playerTotal > dealerTotal) {
      delta = bet * 2;
      outcome = "🏆 **You win!** 2× your bet.";
    } else if (playerTotal === dealerTotal) {
      delta = bet;
      outcome = "🤝 **Push.** Bet returned.";
    } else {
      outcome = "😢 **Dealer wins.** You lose.";
    }

    if (delta > 0) {
      await prisma.economyUser.update({
        where: { id: key },
        data: { cash: { increment: delta } },
      });
    }

    await interaction.reply({
      content: [
        "**🃏 Blackjack**",
        "",
        `**Your hand** (${playerTotal}): ${fmt(playerHand)}`,
        `**Dealer's hand** (${dealerTotal}): ${fmt(dealerHand)}`,
        "",
        outcome,
        `Bet: **${bet}** coins`,
      ].join("\n"),
    });
  },
};
