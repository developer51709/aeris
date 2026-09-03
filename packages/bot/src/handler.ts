import { Client } from "discord.js";
import { readdirSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export async function loadCommands(client: Client) {
  const commandsPath = join(__dirname, "commands");
  const commandFiles = readdirSync(commandsPath).filter(
    (file) => file.endsWith(".ts") || file.endsWith(".js")
  );

  for (const file of commandFiles) {
    const filePath = join(commandsPath, file);
    const command = await import(filePath);

    if ("data" in command && "execute" in command) {
      (client as any).commands.set(command.data.name, command);
      console.log(`  📝 Loaded command: /${command.data.name}`);
    } else {
      console.warn(`⚠️ Command ${file} is missing "data" or "execute".`);
    }
  }
}
