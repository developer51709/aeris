import { Client, Collection, REST, Routes } from "discord.js";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { contextCommands } from "./context.js";

export type RegisteredCommand = {
  data: { name: string; toJSON: () => unknown };
  execute?: (interaction: import("discord.js").ChatInputCommandInteraction) => Promise<void>;
};

export const commands = new Collection<string, RegisteredCommand["data"]>();

function commandFiles(dir: string) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir).filter((file) =>
    (file.endsWith(".ts") || file.endsWith(".js")) &&
    !file.startsWith("registry.") &&
    !file.startsWith("interaction-router."),
  );
}

export async function loadCommandModules(): Promise<RegisteredCommand[]> {
  // Resolve from this module instead of process.cwd(). The root `npm start`
  // supervisor launches the bot from the repository root, while package-local
  // starts use packages/bot as cwd.
  const dir = path.dirname(fileURLToPath(import.meta.url));
  const modules: RegisteredCommand[] = [];
  for (const file of commandFiles(dir)) {
    const mod = await import(path.join(dir, file));
    const entries = Array.isArray(mod.default) ? mod.default : [mod.default];
    for (const command of entries) {
      if (command?.data?.name) modules.push(command as RegisteredCommand);
    }
  }
  return modules;
}

export async function registerCommands(client: Client) {
  const token = process.env.DISCORD_TOKEN;
  const appId = client.application?.id ?? process.env.BOT_OAUTH_CLIENT_ID ?? process.env.DISCORD_CLIENT_ID;
  if (!token || !appId) {
    throw new Error("Cannot register slash commands: DISCORD_TOKEN and an application ID are required");
  }

  const rest = new REST({ version: "10" }).setToken(token);
  const modules = await loadCommandModules();
  commands.clear();
  for (const command of modules) commands.set(command.data.name, command.data);

  const body = [
    ...commands.map((command) => command.toJSON()),
    ...contextCommands.map((command) => command.data.toJSON()),
  ];
  const guildId = process.env.GUILD_ID;
  const route = guildId
    ? Routes.applicationGuildCommands(appId, guildId)
    : Routes.applicationCommands(appId);

  console.log(
    `Refreshing ${body.length} top-level Discord commands${guildId ? ` for guild ${guildId}` : " globally"}.`,
  );
  await rest.put(route, { body });
  console.log(`Successfully reloaded ${body.length} application commands.`);
}
