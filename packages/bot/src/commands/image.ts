import {
  AttachmentBuilder,
  ChatInputCommandInteraction,
  SlashCommandBuilder,
} from "discord.js";
import { loadImage, createCanvas } from "@napi-rs/canvas";
import { replyV2 } from "../components.js";

const data = new SlashCommandBuilder()
  .setName("image")
  .setDescription("Create and transform images")
  .addSubcommand((sub) => sub.setName("avatar").setDescription("Render a Discord avatar card").addUserOption((o) => o.setName("user").setDescription("User to render").setRequired(false)))
  .addSubcommand((sub) => sub.setName("filter").setDescription("Apply a visual filter to an image URL").addStringOption((o) => o.setName("url").setDescription("Direct image URL").setRequired(true)).addStringOption((o) => o.setName("style").setDescription("Filter style").setRequired(true).addChoices({ name: "Grayscale", value: "grayscale" }, { name: "Sepia", value: "sepia" }, { name: "Invert", value: "invert" })))
  .addSubcommand((sub) => sub.setName("resize").setDescription("Resize an image URL").addStringOption((o) => o.setName("url").setDescription("Direct image URL").setRequired(true)).addIntegerOption((o) => o.setName("width").setDescription("Width in pixels").setMinValue(64).setMaxValue(1920).setRequired(true)).addIntegerOption((o) => o.setName("height").setDescription("Height in pixels").setMinValue(64).setMaxValue(1920).setRequired(true)));

async function render(url: string, width: number, height: number, filter?: string) {
  const image = await loadImage(url);
  const canvas = createCanvas(width, height);
  const context = canvas.getContext("2d");
  context.filter = filter === "grayscale" ? "grayscale(1)" : filter === "sepia" ? "sepia(1)" : filter === "invert" ? "invert(1)" : "none";
  context.drawImage(image, 0, 0, width, height);
  return canvas.toBuffer("image/png");
}

export default {
  data,
  async execute(interaction: ChatInputCommandInteraction) {
    try {
      const subcommand = interaction.options.getSubcommand();
      let url = interaction.options.getString("url");
      let width = interaction.options.getInteger("width") ?? 512;
      let height = interaction.options.getInteger("height") ?? 512;
      const user = interaction.options.getUser("user") ?? interaction.user;
      if (subcommand === "avatar") {
        url = user.displayAvatarURL({ extension: "png", size: 512 });
        width = 512;
        height = 512;
      }
      if (!url) throw new Error("An image URL is required.");
      const buffer = await render(url, width, height, interaction.options.getString("style") ?? undefined);
      const filename = `aeris-${subcommand}-${Date.now()}.png`;
      await replyV2(interaction, {
        title: `Image · ${subcommand}`,
        body: `Rendered ${width}×${height} PNG for **${user.username}**.`,
        imageUrls: [`attachment://${filename}`],
        files: [new AttachmentBuilder(buffer, { name: filename })],
      });
    } catch (error) {
      await replyV2(interaction, { title: "Image processing failed", body: error instanceof Error ? error.message : "The image could not be processed.", ephemeral: true });
    }
  },
};
