import { SlashCommandBuilder, ChatInputCommandInteraction } from "discord.js";
import { prisma } from "@aeris/shared";

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
    const guildId = interaction.guildId!;
    const userId = interaction.user.id;
    const key = `${guildId}:${userId}`;
    const subcommand = interaction.options.getSubcommand();

    if (subcommand === "list") {
      const items = await prisma.economyShopItem.findMany({ where: { guildId } });
      if (items.length === 0) {
        await interaction.reply({ content: "The shop is empty. Server admins can add items from the dashboard." });
        return;
      }
      const lines = items.map((i: { name: string; price: number; description?: string | null }) => `• **${i.name}** — ${i.price} coins ${i.description ? `— ${i.description}` : ""}`);
      await interaction.reply({ content: [`**🛒 Shop**`, "", ...lines].join("\n") });
      return;
    }

    if (subcommand === "buy") {
      const name = interaction.options.getString("item")!;
      const item = await prisma.economyShopItem.findFirst({ where: { guildId, name } });
      if (!item) {
        await interaction.reply({ content: `❌ Item **${name}** not found.` });
        return;
      }
      const wallet = await prisma.economyUser.upsert({
        where: { id: key },
        create: { id: key, guildId, userId },
        update: {},
      });
      if (wallet.cash < item.price) {
        await interaction.reply({ content: "❌ Insufficient funds." });
        return;
      }
      await prisma.economyUser.update({ where: { id: key }, data: { cash: { decrement: item.price } } });
      await prisma.economyInventory.upsert({
        where: { id: `${key}:${item.id}` },
        create: { id: `${key}:${item.id}`, guildId, userId, itemId: item.id, quantity: 1 },
        update: { quantity: { increment: 1 } },
      });
      await interaction.reply({ content: `✅ Purchased **${item.name}** for ${item.price} coins.` });
      return;
    }

    if (subcommand === "inventory") {
      const items = await prisma.economyInventory.findMany({ where: { guildId, userId } });
      if (items.length === 0) {
        await interaction.reply({ content: "Your inventory is empty." });
        return;
      }
      const lines = items.map((i: { itemId: string; quantity: number }) => `• Item \`${i.itemId}\` × ${i.quantity}`);
      await interaction.reply({ content: [`**🎒 Inventory**`, "", ...lines].join("\n") });
    }
  },
};
