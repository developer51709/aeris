import { Client, GatewayIntentBits, Partials, Events } from "discord.js";
import { prisma } from "@aeris/shared";
import { registerCommands } from "./commands/registry.js";
import { loadInteractionHandlers, routeInteraction } from "./commands/interaction-router.js";
import { initEventHandlers } from "./events/index.js";

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.GuildMembers,
  ],
  partials: [Partials.Message, Partials.Channel, Partials.User],
});

client.once(Events.ClientReady, async () => {
  console.log(`Aeris ready as ${client.user?.tag}`);
  await loadInteractionHandlers(client);
  await registerCommands(client);
  initEventHandlers(client);
});

client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isChatInputCommand()) return;
  await routeInteraction(interaction);
});

async function main() {
  await prisma.$connect();
  await client.login(process.env.DISCORD_TOKEN);
}

main().catch((error) => {
  console.error("Failed to start Aeris", error);
  process.exit(1);
});

process.on("unhandledRejection", (error) => {
  console.error("Unhandled promise rejection:", error);
});
