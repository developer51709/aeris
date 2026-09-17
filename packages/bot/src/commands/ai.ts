import { ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";
import { editV2, replyV2 } from "../components.js";

interface AiProvider {
  name: string;
  url: string;
  key: string;
  model: string;
}

function providers(): AiProvider[] {
  const configured = process.env.AI_PROVIDERS;
  if (configured) {
    try {
      const parsed = JSON.parse(configured) as Array<Partial<AiProvider>>;
      const result = parsed
        .filter((provider) => provider.url && provider.key)
        .map((provider, index) => ({
          name: provider.name ?? `provider-${index + 1}`,
          url: provider.url!.replace(/\/$/, ""),
          key: provider.key!,
          model: provider.model ?? process.env.AI_MODEL ?? "gpt-4o-mini",
        }));
      if (result.length > 0) return result;
    } catch {
      console.error("AI_PROVIDERS must be a JSON array; using the single-provider fallback");
    }
  }

  return process.env.AI_API_KEY
    ? [{
        name: "default",
        url: (process.env.AI_API_URL ?? "https://api.openai.com/v1").replace(/\/$/, ""),
        key: process.env.AI_API_KEY,
        model: process.env.AI_MODEL ?? "gpt-4o-mini",
      }]
    : [];
}

const data = new SlashCommandBuilder()
  .setName("ai")
  .setDescription("AI assistant tools")
  .addSubcommand((sub) =>
    sub
      .setName("ask")
      .setDescription("Ask the Aeris AI assistant a question")
      .addStringOption((option) =>
        option
          .setName("prompt")
          .setDescription("Your question or request")
          .setRequired(true)
          .setMaxLength(2000),
      ),
  );

export default {
  data,
  async execute(interaction: ChatInputCommandInteraction) {
    const prompt = interaction.options.getString("prompt", true);
    const configuredProviders = providers();

    if (configuredProviders.length === 0) {
      await replyV2(interaction, {
        title: "AI is not configured",
        body: "Add **AI_API_KEY** or an **AI_PROVIDERS** JSON pool to the bot environment to enable `/ai ask`.",
        ephemeral: true,
      });
      return;
    }

    await interaction.deferReply();
    let lastError: unknown;
    for (const provider of configuredProviders) {
      try {
        const response = await fetch(`${provider.url}/chat/completions`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${provider.key}`,
          },
          body: JSON.stringify({
            model: provider.model,
            temperature: 0.7,
            max_tokens: 800,
            messages: [
              { role: "system", content: "You are Aeris, a concise and helpful Discord server assistant." },
              { role: "user", content: prompt },
            ],
          }),
          signal: AbortSignal.timeout(30_000),
        });
        if (!response.ok) throw new Error(`${provider.name} returned HTTP ${response.status}`);

        const payload = (await response.json()) as {
          choices?: Array<{ message?: { content?: string } }>;
        };
        const answer = payload.choices?.[0]?.message?.content?.trim();
        if (!answer) throw new Error(`${provider.name} returned an empty response`);

        await editV2(interaction, {
          title: "AI response",
          body: answer.slice(0, 3900),
        });
        return;
      } catch (error) {
        lastError = error;
        console.error(`AI provider ${provider.name} failed; trying the next provider`);
      }
    }

    console.error("All AI providers failed:", lastError);
    await editV2(interaction, {
      title: "AI unavailable",
      body: "Every configured AI provider failed. Please try again shortly.",
    });
  },
};
