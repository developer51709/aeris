import { Client, ChatInputCommandInteraction, Collection } from "discord.js";
import fs from "node:fs";
import path from "node:path";

const handlers = new Collection<string, { execute: (i: ChatInputCommandInteraction) => Promise<void> }>();

export async function loadInteractionHandlers(client: Client) {
  const dir = path.resolve("src/commands");
  if (fs.existsSync(dir)) {
    for (const file of fs.readdirSync(dir)) {
      if (!file.endsWith(".js") && !file.endsWith(".ts")) continue;
      const mod = await import(path.join(dir, file));
      if (mod.default?.data && mod.default?.execute) {
        handlers.set(mod.default.data.name, mod.default);
      }
    }
  }
}

export async function routeInteraction(interaction: ChatInputCommandInteraction) {
  const handler = handlers.get(interaction.commandName);
  if (!handler) return;
  try {
    await handler.execute(interaction);
  } catch (error) {
    console.error(`Error in /${interaction.commandName}:`, error);
    const payload = { content: "❌ Something went wrong running that command.", ephemeral: true as const };
    if (interaction.deferred || interaction.replied) {
      await interaction.followUp(payload).catch(() => undefined);
    } else {
      await interaction.reply(payload).catch(() => undefined);
    }
  }
}
