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
      if (!file.endsWith(".ts") && !file.endsWith(".js")) continue;
      if (file === "registry.ts" || file === "registry.js" || file === "interaction-router.ts" || file === "interaction-router.js") continue;
      const mod = await import(path.join(dir, file));
      if (mod.default && mod.default.data) {
        commands.set(mod.default.data.name, mod.default.data);
      }
    }
  }

  try {
    const appId = process.env.BOT_OAUTH_CLIENT_ID ?? "";
    const guildId = process.env.GUILD_ID;

    console.log("Started refreshing application (/) commands.");
    if (guildId) {
      // Register guild-specific commands (faster, good for development)
      await rest.put(
        Routes.applicationGuildCommands(appId, guildId),
        { body: commands.map((c) => c.toJSON()) },
      );
      console.log(`Successfully reloaded ${commands.size} guild commands for guild ${guildId}.`);
    } else {
      // Register global commands (takes up to an hour to propagate)
      await rest.put(
        Routes.applicationCommands(appId),
        { body: commands.map((c) => c.toJSON()) },
      );
      console.log(`Successfully reloaded ${commands.size} global commands.`);
    }
  } catch (error) {
    console.error("Error registering commands:", error);
  }
}
