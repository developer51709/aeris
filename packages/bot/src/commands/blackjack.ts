import { SlashCommandBuilder, ChatInputCommandInteraction } from "discord.js";
import { prisma } from "@aeris/shared";
import { aerisEmbed, COLORS } from "../lib/embeds.js";
import { getGuildLocale } from "../locale.js";
import { localizeEmbed } from "../lib/embeds.js";

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
    const locale = await getGuildLocale(interaction.guildId);
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
      const embed = aerisEmbed()
        .setColor(COLORS.danger)
        .setTitle("Insufficient Funds")
        .setDescription("You don't have enough coins for that bet.");
      localizeEmbed(embed, locale);
    await interaction.reply({ embeds: [embed] });
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
    let color: number;
    let delta = 0;

    if (playerTotal === 21) {
      delta = Math.floor(bet * 2.5);
      outcome = "🎉 **Blackjack!** You win 2.5× your bet!";
      color = COLORS.economy;
    } else if (playerTotal > 21) {
      outcome = "💥 **Bust!** You lose.";
      color = COLORS.danger;
    } else if (dealerTotal > 21) {
      delta = bet * 2;
      outcome = "🏆 **Dealer busts!** You win 2× your bet!";
      color = COLORS.success;
    } else if (playerTotal > dealerTotal) {
      delta = bet * 2;
      outcome = "🏆 **You win!** 2× your bet.";
      color = COLORS.success;
    } else if (playerTotal === dealerTotal) {
      delta = bet;
      outcome = "🤝 **Push.** Bet returned.";
      color = COLORS.warning;
    } else {
      outcome = "😢 **Dealer wins.** You lose.";
      color = COLORS.danger;
    }

    if (delta > 0) {
      await prisma.economyUser.update({
        where: { id: key },
        data: { cash: { increment: delta } },
      });
    }

    const embed = aerisEmbed()
      .setColor(color)
      .setTitle("🃏 Blackjack")
      .addFields(
        { name: `Your Hand (${playerTotal})`, value: fmt(playerHand), inline: true },
        { name: `Dealer (${dealerTotal})`, value: fmt(dealerHand), inline: true },
        { name: "Result", value: outcome, inline: false },
        { name: "Bet", value: `${bet.toLocaleString()} coins`, inline: true },
        { name: "Payout", value: delta > 0 ? `+${delta.toLocaleString()}` : `${-bet}`, inline: true },
      );

    localizeEmbed(embed, locale);
      await interaction.reply({ embeds: [embed] });
  },
};
