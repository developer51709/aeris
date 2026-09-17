import { ChatInputCommandInteraction, Collection, MessageFlags, MessageContextMenuCommandInteraction, UserContextMenuCommandInteraction } from "discord.js";
import { contextCommands } from "./context.js";
import { containerResponse } from "../components.js";
import { loadCommandModules, RegisteredCommand } from "./registry.js";

const handlers = new Collection<string, RegisteredCommand>();
type ContextInteraction = UserContextMenuCommandInteraction | MessageContextMenuCommandInteraction;
const contextHandlers = new Collection<string, (interaction: ContextInteraction) => Promise<void>>();
for (const command of contextCommands) {
  contextHandlers.set(
    command.data.name,
    command.execute as unknown as (interaction: ContextInteraction) => Promise<void>,
  );
}

type InteractionMethod = "reply" | "followUp" | "editReply";

function installV2ResponseGuard(interaction: ChatInputCommandInteraction) {
  const target = interaction as unknown as Record<InteractionMethod, unknown>;
  for (const method of ["reply", "followUp", "editReply"] as const) {
    const original = target[method];
    if (typeof original !== "function") continue;
    target[method] = (payload: unknown) => {
      if (!payload || typeof payload !== "object") {
        return (original as Function).call(interaction, payload);
      }

      const input = payload as Record<string, unknown>;
      const components = Array.isArray(input.components) ? input.components : [];
      const hasV2Container = components.some((component) => {
        if (!component || typeof component !== "object" || !("toJSON" in component)) return false;
        const json = (component as { toJSON: () => unknown }).toJSON();
        return Boolean(json && typeof json === "object" && (json as { type?: number }).type === 17);
      });

      if (hasV2Container) {
        input.flags = Number(input.flags ?? 0) | MessageFlags.IsComponentsV2;
        return (original as Function).call(interaction, input);
      }

      const embedText = Array.isArray(input.embeds)
        ? input.embeds
            .map((embed) => {
              if (!embed || typeof embed !== "object") return "";
              const value = embed as { data?: { title?: string; description?: string; fields?: Array<{ name: string; value: string }> } };
              const data = value.data;
              if (!data) return "";
              const fields = "fields" in data && Array.isArray(data.fields)
                ? data.fields.map((field: { name: string; value: string }) => `**${field.name}**\n${field.value}`).join("\n")
                : "";
              return [data.title, data.description, fields].filter(Boolean).join("\n");
            })
            .filter(Boolean)
            .join("\n\n")
        : "";
      const content = typeof input.content === "string" ? input.content : "";
      const body = [content, embedText].filter(Boolean).join("\n\n") || "Aeris completed the request.";
      const next = {
        flags: Number(input.flags ?? 0) | MessageFlags.IsComponentsV2,
        components: [containerResponse({ body })],
      };
      return (original as Function).call(interaction, next);
    };
  }
}

export async function loadInteractionHandlers() {
  handlers.clear();
  for (const command of await loadCommandModules()) {
    if (command.execute) handlers.set(command.data.name, command);
  }
}

export async function routeContextInteraction(
  interaction: UserContextMenuCommandInteraction | MessageContextMenuCommandInteraction,
) {
  const handler = contextHandlers.get(interaction.commandName);
  if (!handler) return;
  try {
    await handler(interaction);
  } catch (error) {
    console.error(`Error in context command ${interaction.commandName}:`, error);
  }
}

export async function routeInteraction(interaction: ChatInputCommandInteraction) {
  const handler = handlers.get(interaction.commandName);
  if (!handler?.execute) return;
  installV2ResponseGuard(interaction);

  try {
    await handler.execute(interaction);
  } catch (error) {
    console.error(`Error in /${interaction.commandName}:`, error);
    const payload = {
      flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
      components: [containerResponse({ title: "Command error", body: "Something went wrong running that command." })],
    };
    if (interaction.deferred || interaction.replied) {
      await interaction.followUp(payload).catch(() => undefined);
    } else {
      await interaction.reply(payload).catch(() => undefined);
    }
  }
}
