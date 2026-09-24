import { SlashCommandBuilder, ChatInputCommandInteraction } from "discord.js";
import { prisma } from "@aeris/shared";
import { aerisEmbed, COLORS, successEmbed, errorEmbed } from "../lib/embeds.js";
import { getGuildLocale } from "../locale.js";
import { localizeEmbed } from "../lib/embeds.js";

export default {
  data: new SlashCommandBuilder()
    .setName("shop")
    .setDescription("Browse and buy items")
    .addSubcommand((sub) => sub.setName("list").setDescription("Show available items"))
    .addSubcommand((sub) =>
      sub
        .setName("buy")
        .setDescription("Buy an item")
        .addStringOption((o) => o.setName("item").setDescription("Item name").setRequired(true)),
    )
    .addSubcommand((sub) => sub.setName("inventory").setDescription("Show your inventory")),
  async execute(interaction: ChatInputCommandInteraction) {
    const locale = await getGuildLocale(interaction.guildId);
    const guildId = interaction.guildId!;
    const userId = interaction.user.id;
    const key = `${guildId}:${userId}`;
    const subcommand = interaction.options.getSubcommand();

    if (subcommand === "list") {
      const items = await prisma.economyShopItem.findMany({ where: { guildId } });
      if (items.length === 0) {
        const embed = aerisEmbed()
          .setColor(COLORS.neutral)
          .setTitle("🛒 Shop")
          .setDescription("The shop is empty. Server admins can add items from the dashboard.");
        localizeEmbed(embed, locale);
      await interaction.reply({ embeds: [embed] });
        return;
      }
      const lines = items.map(
        (i: { name: string; price: number; description?: string | null }) =>
          `• **${i.name}** — ${i.price.toLocaleString()} coins${i.description ? ` — ${i.description}` : ""}`,
      );
      const embed = aerisEmbed()
        .setColor(COLORS.economy)
        .setTitle("🛒 Shop")
        .setDescription(lines.join("\n"));
      localizeEmbed(embed, locale);
      await interaction.reply({ embeds: [embed] });
      return;
    }

    if (subcommand === "buy") {
      const name = interaction.options.getString("item")!;
      const item = await prisma.economyShopItem.findFirst({ where: { guildId, name } });
      if (!item) {
        await interaction.reply({ embeds: [localizeEmbed(errorEmbed("Item Not Found", `**${name}** doesn't exist in the shop.`), locale)] });
        return;
      }
      const wallet = await prisma.economyUser.upsert({
        where: { id: key },
        create: { id: key, guildId, userId },
        update: {},
      });
      if (wallet.cash < item.price) {
        await interaction.reply({ embeds: [localizeEmbed(errorEmbed("Insufficient Funds", "You don't have enough coins to buy this item."), locale)] });
        return;
      }
      await prisma.economyUser.update({ where: { id: key }, data: { cash: { decrement: item.price } } });
      await prisma.economyInventory.upsert({
        where: { id: `${key}:${item.id}` },
        create: { id: `${key}:${item.id}`, guildId, userId, itemId: item.id, quantity: 1 },
        update: { quantity: { increment: 1 } },
      });
      const embed = successEmbed(
        "Item Purchased",
        `Bought **${item.name}** for ${item.price.toLocaleString()} coins.`,
      );
      localizeEmbed(embed, locale);
      await interaction.reply({ embeds: [embed] });
      return;
    }

    if (subcommand === "inventory") {
      const items = await prisma.economyInventory.findMany({ where: { guildId, userId } });
      if (items.length === 0) {
        const embed = aerisEmbed()
          .setColor(COLORS.neutral)
          .setTitle("🎒 Inventory")
          .setDescription("Your inventory is empty.");
        localizeEmbed(embed, locale);
      await interaction.reply({ embeds: [embed] });
        return;
      }
      const lines = items.map(
        (i: { itemId: string; quantity: number }) => `• \`${i.itemId}\` × ${i.quantity}`,
      );
      const embed = aerisEmbed()
        .setColor(COLORS.economy)
        .setTitle("🎒 Inventory")
        .setDescription(lines.join("\n"));
      localizeEmbed(embed, locale);
      await interaction.reply({ embeds: [embed] });
    }
  },
};
