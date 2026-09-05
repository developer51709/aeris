import {
  Client,
  Collection,
  REST,
  Routes,
  SlashCommandBuilder,
} from "discord.js";
import fs from "node:fs";
import path from "node:path";

export const commands = new Collection<string, SlashCommandBuilder>();

export async function registerCommands(client: Client) {
  const rest = new REST({ version: "10" }).setToken(
    process.env.DISCORD_TOKEN ?? "",
  );

  const dir = path.resolve("src/commands");
  if (fs.existsSync(dir)) {
    for (const file of fs.readdirSync(dir)) {
      if (!file.endsWith(".js")) continue;
      const mod = await import(path.join(dir, file));
      if (mod.default && mod.default.data) {
        commands.set(mod.default.data.name, mod.default.data);
      }
    }
  }

  try {
    console.log("Started refreshing application (/) commands.");
    await rest.put(
      Routes.applicationGuildCommands(
        process.env.BOT_OAUTH_CLIENT_ID ?? "",
        process.env.GUILD_ID ?? "",
      ),
      { body: commands.map((c) => c.toJSON()) },
    );
    console.log("Successfully reloaded application (/) commands.");
  } catch (error) {
    console.error("Error registering commands:", error);
  }
}
