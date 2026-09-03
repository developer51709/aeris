import { Client, GatewayIntentBits, Collection, Events } from "discord.js";
import dotenv from "dotenv";
import { PrismaClient } from "@prisma/client";
import { loadCommands } from "./handler.js";
import { registerCommands } from "./deploy.js";

dotenv.config({ path: "../../.env" });

const prisma = new PrismaClient();

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.DirectMessages,
  ],
});

// Store commands on client
(client as any).commands = new Collection();
(client as any).prisma = prisma;
(client as any).cooldowns = new Collection();

async function main() {
  console.log("🌸 Aeris is starting...");

  // Load all commands
  await loadCommands(client);
  console.log(`✅ Loaded ${(client as any).commands.size} commands`);

  // Register slash commands
  await registerCommands();

  // Event handlers
  client.on(Events.InteractionCreate, async (interaction) => {
    if (!interaction.isChatInputCommand()) return;

    const command = (client as any).commands.get(interaction.commandName);
    if (!command) return;

    // Cooldown check
    const { cooldowns } = client as any;
    if (!cooldowns.has(interaction.commandName)) {
      cooldowns.set(interaction.commandName, new Collection());
    }

    const now = Date.now();
    const timestamps = cooldowns.get(interaction.commandName);
    const cooldownAmount = (command.cooldown ?? 3) * 1000;

    if (timestamps.has(interaction.user.id)) {
      const expirationTime =
        timestamps.get(interaction.user.id) + cooldownAmount;
      if (now < expirationTime) {
        const expiredTimestamp = Math.round(expirationTime / 1000);
        return interaction.reply({
          content: `⏰ Please wait, cooldown active. Try again <t:${expiredTimestamp}:R>.`,
          ephemeral: true,
        });
      }
    }

    timestamps.set(interaction.user.id, now);
    setTimeout(() => timestamps.delete(interaction.user.id), cooldownAmount);

    try {
      await command.execute(interaction, prisma);
    } catch (error) {
      console.error(`Error executing ${interaction.commandName}:`, error);
      const reply = {
        content: "❌ An error occurred while executing this command.",
        ephemeral: true,
      };
      if (interaction.replied || interaction.deferred) {
        await interaction.followUp(reply);
      } else {
        await interaction.reply(reply);
      }
    }
  });

  client.on(Events.GuildCreate, async (guild) => {
    await prisma.guild.upsert({
      where: { guildId: guild.id },
      create: {
        guildId: guild.id,
        name: guild.name,
        iconUrl: guild.iconURL(),
      },
      update: { name: guild.name, iconUrl: guild.iconURL() },
    });
  });

  client.on(Events.MessageCreate, async (message) => {
    if (message.author.bot) return;
    // Leveling XP logic handled in module
    const { handleLeveling } = await import("./modules/leveling.js");
    await handleLeveling(message, prisma);
  });

  client.on(Events.GuildMemberAdd, async (member) => {
    const { handleWelcome } = await import("./modules/welcome.js");
    await handleWelcome(member, prisma);
  });

  client.on(Events.GuildMemberRemove, async (member) => {
    const { handleGoodbye } = await import("./modules/welcome.js");
    await handleGoodbye(member, prisma);
  });

  client.on(Events.VoiceStateUpdate, async (oldState, newState) => {
    const { handleVoiceStateUpdate } = await import(
      "./modules/voicemaster.js"
    );
    await handleVoiceStateUpdate(oldState, newState, prisma);
  });

  await client.login(process.env.DISCORD_BOT_TOKEN);
}

main().catch(console.error);
