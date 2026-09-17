import { ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";
import { replyV2 } from "../components.js";

const data = new SlashCommandBuilder()
  .setName("lookup")
  .setDescription("Look up Minecraft and Roblox data")
  .addSubcommand((sub) =>
    sub
      .setName("minecraft-player")
      .setDescription("Look up a Minecraft Java player")
      .addStringOption((option) => option.setName("username").setDescription("Minecraft username").setRequired(true)),
  )
  .addSubcommand((sub) =>
    sub
      .setName("minecraft-server")
      .setDescription("Check a Minecraft server")
      .addStringOption((option) => option.setName("address").setDescription("Host or host:port").setRequired(true)),
  )
  .addSubcommand((sub) =>
    sub
      .setName("roblox-user")
      .setDescription("Look up a Roblox user")
      .addStringOption((option) => option.setName("username").setDescription("Roblox username").setRequired(true)),
  )
  .addSubcommand((sub) =>
    sub
      .setName("roblox-games")
      .setDescription("List public Roblox games owned by a user")
      .addStringOption((option) => option.setName("username").setDescription("Roblox username").setRequired(true)),
  )
  .addSubcommand((sub) =>
    sub
      .setName("movie")
      .setDescription("Search movies and TV shows")
      .addStringOption((option) => option.setName("query").setDescription("Movie or show title").setRequired(true)),
  );

async function json<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, { ...init, signal: AbortSignal.timeout(10_000) });
  if (!response.ok) throw new Error(`Lookup provider returned HTTP ${response.status}`);
  return (await response.json()) as T;
}

async function minecraftPlayer(username: string) {
  const profile = await json<{ id: string; name: string }>(
    `https://api.mojang.com/users/profiles/minecraft/${encodeURIComponent(username)}`,
  );
  const skin = await json<{ id: string; name: string; properties?: Array<{ name: string; value: string }> }>(
    `https://sessionserver.mojang.com/session/minecraft/profile/${profile.id}`,
  ).catch(() => profile);
  return {
    title: `Minecraft · ${profile.name}`,
    body: `**UUID:** \`${profile.id}\`\n**Name:** ${profile.name}`,
    imageUrls: [`https://mc-heads.net/avatar/${encodeURIComponent(profile.name)}/256`],
    skin,
  };
}

async function minecraftServer(address: string) {
  const status = await json<{
    online?: boolean;
    host?: string;
    port?: number;
    players?: { online?: number; max?: number };
    version?: { name_clean?: string };
    motd?: { clean?: string };
    icon?: string;
  }>(`https://api.mcstatus.io/v2/status/java/${encodeURIComponent(address)}`);
  if (!status.online) return { title: `Minecraft server · ${address}`, body: "The server is offline or unreachable." };
  return {
    title: `Minecraft server · ${status.host ?? address}`,
    body: [
      "**Status:** Online",
      `**Players:** ${status.players?.online ?? 0}/${status.players?.max ?? "?"}`,
      `**Version:** ${status.version?.name_clean ?? "Unknown"}`,
      status.motd?.clean ? `**MOTD:** ${status.motd.clean}` : "",
    ].filter(Boolean).join("\n"),
    imageUrls: status.icon ? [status.icon] : undefined,
  };
}

async function robloxUser(username: string) {
  const result = await json<{ data?: Array<{ id: number; name: string; displayName: string; description?: string }> }>(
    "https://users.roblox.com/v1/usernames/users",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ usernames: [username], excludeBannedUsers: false }),
    },
  );
  const user = result.data?.[0];
  if (!user) throw new Error(`No Roblox user found for ${username}`);
  const thumbnails = await json<{ data?: Array<{ imageUrl?: string }> }>(
    `https://thumbnails.roblox.com/v1/users/avatar-headshot?userIds=${user.id}&size=420x420&format=Png&isCircular=false`,
  ).catch(() => ({ data: [] }));
  return {
    id: user.id,
    title: `Roblox · ${user.displayName}`,
    body: `**Username:** ${user.name}\n**User ID:** \`${user.id}\`\n${user.description ? `\n${user.description.slice(0, 800)}` : ""}`,
    imageUrls: thumbnails.data?.[0]?.imageUrl ? [thumbnails.data[0].imageUrl] : undefined,
  };
}

async function movieLookup(query: string) {
  const key = process.env.TMDB_API_KEY;
  if (!key) throw new Error("Movie lookup requires TMDB_API_KEY in the bot environment.");
  const result = await json<{ results?: Array<{ title?: string; name?: string; overview?: string; release_date?: string; first_air_date?: string; poster_path?: string; media_type?: string }> }>(
    `https://api.themoviedb.org/3/search/multi?api_key=${encodeURIComponent(key)}&query=${encodeURIComponent(query)}&include_adult=false&language=en-US&page=1`,
  );
  const item = result.results?.find((entry) => entry.media_type === "movie" || entry.media_type === "tv");
  if (!item) throw new Error(`No movie or show found for ${query}`);
  return {
    title: item.title ?? item.name ?? query,
    body: [
      `**Type:** ${item.media_type === "tv" ? "TV show" : "Movie"}`,
      `**Release:** ${item.release_date ?? item.first_air_date ?? "Unknown"}`,
      item.overview ?? "No description available.",
    ].join("\\n"),
    imageUrls: item.poster_path ? [`https://image.tmdb.org/t/p/w780${item.poster_path}`] : undefined,
  };
}

async function robloxGames(username: string) {
  const user = await robloxUser(username);
  const games = await json<{ data?: Array<{ name: string; id: number; playing?: number; visits?: number }> }>(
    `https://games.roblox.com/v1/users/${user.id}/games?accessFilter=Public&limit=10&sortOrder=Asc`,
  );
  const lines = games.data?.map((game, index) =>
    `**${index + 1}.** ${game.name} · ${game.playing ?? 0} playing · ${(game.visits ?? 0).toLocaleString()} visits`,
  ) ?? [];
  return {
    title: `Roblox games · ${username}`,
    body: lines.length ? lines.join("\n") : "This user has no public games.",
  };
}

export default {
  data,
  async execute(interaction: ChatInputCommandInteraction) {
    try {
      const subcommand = interaction.options.getSubcommand();
      if (subcommand === "minecraft-player") {
        const result = await minecraftPlayer(interaction.options.getString("username", true));
        await replyV2(interaction, { title: result.title, body: result.body, imageUrls: result.imageUrls });
      } else if (subcommand === "minecraft-server") {
        const result = await minecraftServer(interaction.options.getString("address", true));
        await replyV2(interaction, result);
      } else if (subcommand === "roblox-user") {
        const result = await robloxUser(interaction.options.getString("username", true));
        await replyV2(interaction, result);
      } else if (subcommand === "roblox-games") {
        await replyV2(interaction, await robloxGames(interaction.options.getString("username", true)));
      } else {
        await replyV2(interaction, await movieLookup(interaction.options.getString("query", true)));
      }
    } catch (error) {
      await replyV2(interaction, {
        title: "Lookup failed",
        body: error instanceof Error ? error.message : "The lookup provider is unavailable.",
        ephemeral: true,
      });
    }
  },
};
