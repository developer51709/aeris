import { ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";
import { editV2, replyV2 } from "../components.js";

const data = new SlashCommandBuilder()
  .setName("movies")
  .setDescription("Search movies and TV shows")
  .addSubcommand((sub) =>
    sub
      .setName("search")
      .setDescription("Search movies and TV shows")
      .addStringOption((option) => option.setName("query").setDescription("Title to search for").setRequired(true)),
  )
  .addSubcommand((sub) =>
    sub
      .setName("movie")
      .setDescription("Look up a movie by TMDB ID")
      .addIntegerOption((option) => option.setName("id").setDescription("TMDB movie ID").setRequired(true)),
  )
  .addSubcommand((sub) =>
    sub
      .setName("tv")
      .setDescription("Look up a TV show by TMDB ID")
      .addIntegerOption((option) => option.setName("id").setDescription("TMDB TV ID").setRequired(true)),
  );

async function tmdb<T>(path: string) {
  const key = process.env.TMDB_API_KEY;
  if (!key) throw new Error("TMDB_API_KEY is not configured");
  const response = await fetch(`https://api.themoviedb.org/3${path}${path.includes("?") ? "&" : "?"}api_key=${encodeURIComponent(key)}`, {
    signal: AbortSignal.timeout(10_000),
  });
  if (!response.ok) throw new Error(`TMDB returned HTTP ${response.status}`);
  return (await response.json()) as T;
}

export default {
  data,
  async execute(interaction: ChatInputCommandInteraction) {
    await interaction.deferReply();
    try {
      const subcommand = interaction.options.getSubcommand();
      if (subcommand === "search") {
        const query = interaction.options.getString("query", true);
        const result = await tmdb<{ results: Array<{ id: number; media_type?: string; title?: string; name?: string; overview?: string; release_date?: string; first_air_date?: string; poster_path?: string | null }> }>(`/search/multi?query=${encodeURIComponent(query)}&include_adult=false&language=en-US`);
        const items = result.results.slice(0, 5);
        await replyV2(interaction, {
          title: `Search results · ${query}`,
          body: items.length
            ? items.map((item, index) => `${index + 1}. **${item.title ?? item.name}** (${item.release_date ?? item.first_air_date ?? "date unknown"}) — ${item.media_type ?? "title"}\n${item.overview ?? "No overview."}`).join("\n\n").slice(0, 3900)
            : "No titles matched that search.",
          imageUrls: items[0]?.poster_path ? [`https://image.tmdb.org/t/p/w500${items[0].poster_path}`] : undefined,
        });
        return;
      }

      const id = interaction.options.getInteger("id", true);
      const type = subcommand === "movie" ? "movie" : "tv";
      const item = await tmdb<{ title?: string; name?: string; overview?: string; vote_average?: number; runtime?: number; episode_run_time?: number[]; poster_path?: string | null; homepage?: string }>(`/${type}/${id}?language=en-US`);
      await replyV2(interaction, {
        title: item.title ?? item.name ?? "Title details",
        body: [`${item.overview ?? "No overview."}`, `**Rating:** ${item.vote_average?.toFixed(1) ?? "—"}/10`, `**Runtime:** ${item.runtime ?? item.episode_run_time?.[0] ?? "—"} minutes`].join("\n"),
        imageUrls: item.poster_path ? [`https://image.tmdb.org/t/p/w780${item.poster_path}`] : undefined,
        buttons: item.homepage ? [{ label: "Open official page", url: item.homepage }] : undefined,
      });
    } catch (error) {
      await editV2(interaction, {
        title: "Movie lookup failed",
        body: error instanceof Error ? error.message : "The movie provider is unavailable.",
      });
    }
  },
};
