import { REST, Routes } from "discord.js";
import { readdirSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export async function registerCommands() {
  const commands: any[] = [];
  const commandsPath = join(__dirname, "commands");
  const commandFiles = readdirSync(commandsPath).filter(
    (file) => file.endsWith(".ts") || file.endsWith(".js")
  );

  for (const file of commandFiles) {
    const command = await import(join(commandsPath, file));
    if ("data" in command) {
      commands.push(command.data.toJSON());
    }
  }

  const rest = new REST({ version: "10" }).setToken(
    process.env.DISCORD_BOT_TOKEN!
  );

  try {
    console.log(`🔄 Registering ${commands.length} slash commands...`);
    await rest.put(
      Routes.applicationCommands(process.env.DISCORD_CLIENT_ID!),
      { body: commands }
    );
    console.log("✅ Slash commands registered successfully.");
  } catch (error) {
    console.error("❌ Failed to register commands:", error);
  }
}
