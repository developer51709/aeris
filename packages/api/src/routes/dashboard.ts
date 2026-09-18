import { Router, Request, Response } from "express";
import { prisma } from "@aeris/shared";

const router = Router();

let botProfileCache: { id: string; username: string; avatarUrl: string | null } | null = null;
let botProfileCacheExpires = 0;

function requireAuth(req: Request): { id: string; username: string; avatar?: string | null; guildIds: string[]; accessToken?: string } {
  const user = (req.session as any)?.user;
  if (!user || typeof user?.id !== "string") {
    throw new Error("Unauthorized");
  }
  return user as { id: string; username: string; avatar?: string | null; guildIds: string[]; accessToken?: string };
}

function requireGuildAccess(req: Request, guildId: string | undefined) {
  const user = requireAuth(req);
  if (!guildId || !user.guildIds.includes(guildId)) {
    throw new Error("Unauthorized");
  }
  return user;
}

router.get("/bot-profile", async (_req: Request, res: Response) => {
  try {
    if (botProfileCache && botProfileCacheExpires > Date.now()) {
      return res.json(botProfileCache);
    }

    const token = process.env.DISCORD_TOKEN;
    if (!token) {
      return res.json({ id: null, username: "Aeris", avatarUrl: null });
    }

    const discordResponse = await fetch("https://discord.com/api/v10/users/@me", {
      headers: { Authorization: `Bot ${token}` },
    });
    if (!discordResponse.ok) {
      console.error("Discord bot profile request failed:", discordResponse.status);
      return res.json({ id: null, username: "Aeris", avatarUrl: null });
    }

    const bot = (await discordResponse.json()) as {
      id: string;
      username: string;
      avatar?: string | null;
    };
    botProfileCache = {
      id: bot.id,
      username: bot.username,
      avatarUrl: bot.avatar
        ? `https://cdn.discordapp.com/avatars/${bot.id}/${bot.avatar}.png?size=128`
        : null,
    };
    botProfileCacheExpires = Date.now() + 15 * 60 * 1000;
    return res.json(botProfileCache);
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return res.status(401).json({ error: "Not authenticated" });
    }
    console.error("GET /api/bot-profile error:", error);
    return res.json({ id: null, username: "Aeris", avatarUrl: null });
  }
});

router.get("/status", async (req: Request, res: Response) => {
  try {
    requireAuth(req);
    const [guildCount, memberAggregate] = await Promise.all([
      prisma.guild.count(),
      prisma.guild.aggregate({ _sum: { memberCount: true } }),
    ]);
    let aiProviderCount = process.env.AI_API_KEY ? 1 : 0;
    try {
      const configured = JSON.parse(process.env.AI_PROVIDERS ?? "[]");
      if (Array.isArray(configured)) aiProviderCount = configured.filter((provider) => provider?.url && provider?.key).length;
    } catch {
      // Keep the single-provider count when the optional pool is malformed.
    }
    let lavalinkNodeCount = 0;
    try {
      const configured = JSON.parse(process.env.LAVALINK_NODES ?? "[]");
      if (Array.isArray(configured)) lavalinkNodeCount = configured.filter((node) => node?.url).length;
    } catch {
      lavalinkNodeCount = process.env.LAVALINK_NODE_URLS?.split(",").filter(Boolean).length ?? 0;
    }
    if (lavalinkNodeCount === 0 && process.env.LAVALINK_NODE_1_URL) lavalinkNodeCount = 1;

    return res.json({
      online: true,
      guildCount,
      memberCount: memberAggregate._sum.memberCount ?? 0,
      aiProviderCount,
      lavalinkNodeCount,
      checkedAt: new Date().toISOString(),
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return res.status(401).json({ error: "Not authenticated" });
    }
    console.error("GET /api/status error:", error);
    return res.status(500).json({ error: "Failed to load bot status" });
  }
});

router.get("/guilds", async (req: Request, res: Response) => {
  try {
    const user = requireAuth(req);
    const sessionUser = (req.session as any).user as typeof user & { accessToken?: string };
    let userManagedGuilds = Array.isArray(sessionUser.guildIds) ? sessionUser.guildIds : [];

    // The profile and guild requests can run in parallel in the dashboard. Refresh
    // the OAuth guild list here too, ensuring a newly-installed server is not
    // hidden by a stale cookie-session snapshot.
    if (sessionUser.accessToken) {
      try {
        const response = await fetch("https://discord.com/api/v10/users/@me/guilds", {
          headers: { Authorization: `Bearer ${sessionUser.accessToken}` },
        });
        if (response.ok) {
          const guilds = (await response.json()) as {
            id: string;
            permissions?: string;
            owner?: boolean;
          }[];
          userManagedGuilds = guilds
            .filter((guild) =>
              guild.owner === true ||
              (BigInt(guild.permissions || "0") & (1n << 5n)) !== 0n,
            )
            .map((guild) => guild.id);
          sessionUser.guildIds = userManagedGuilds;
          (req.session as any).user = sessionUser;
        }
      } catch (error) {
        console.error("Discord guild refresh failed:", error);
      }
    }

    const knownGuilds = (await prisma.guild.findMany({
      ...(userManagedGuilds.length > 0
        ? { where: { id: { in: userManagedGuilds } } }
        : {}),
      orderBy: { createdAt: "desc" },
    })) as { id: string; name: string | null; icon: string | null; memberCount: number }[];

    console.log("Guild dashboard lookup:", {
      oauthManagedGuildCount: userManagedGuilds.length,
      botSyncedGuildCount: knownGuilds.length,
    });

    // A persistent session created before guild permissions were refreshed can
    // legitimately have an empty guildIds snapshot. In that case, use only the
    // bot-synced guilds as the recovery set rather than returning an empty
    // dashboard. The bot database remains the source of truth, so unrelated user
    // guilds are never appended here.
    if (userManagedGuilds.length === 0 && knownGuilds.length > 0) {
      sessionUser.guildIds = knownGuilds.map((guild) => guild.id);
      (req.session as any).user = sessionUser;
    }

    // Do not discard a valid bot-synced guild because Discord has not supplied
    // its name yet. The dashboard can safely fall back to the guild ID.
    return res.json(knownGuilds);
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return res.status(401).json({ error: "Not authenticated" });
    }
    console.error("GET /api/guilds error:", error);
    return res.status(500).json({
      error: "Failed to load servers",
      message: "Could not load your servers. Please try again later.",
    });
  }
});

router.get("/guilds/:id", async (req: Request, res: Response) => {
  try {
    requireGuildAccess(req, req.params.id);
    const guild = await prisma.guild.findUnique({
      where: { id: req.params.id },
    });
    if (!guild) {
      return res.status(404).json({
        error: "Server not found",
        message: "The requested server does not exist or is unavailable.",
      });
    }
    return res.json(guild);
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return res.status(401).json({ error: "Not authenticated" });
    }
    console.error("GET /api/guilds/:id error:", error);
    return res.status(500).json({
      error: "Failed to load server",
      message: "Could not load the requested server. Please try again later.",
    });
  }
});

router.put("/guilds/:id", async (req: Request, res: Response) => {
  try {
    requireGuildAccess(req, req.params.id);
    const body = req.body ?? {};

    const guild = await prisma.guild.update({
      where: { id: req.params.id },
      data: {
        ...(body.name !== undefined ? { name: body.name } : {}),
        ...(body.icon !== undefined ? { icon: body.icon } : {}),
        ...(body.memberCount !== undefined && typeof body.memberCount === "number"
          ? { memberCount: body.memberCount }
          : {}),
      },
    });
    return res.json(guild);
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return res.status(401).json({ error: "Not authenticated" });
    }
    console.error("PUT /api/guilds/:id error:", error);
    return res.status(500).json({
      error: "Failed to update server",
      message: "Could not update the server settings. Please try again later.",
    });
  }
});

router.get("/guilds/:id/stats", async (req: Request, res: Response) => {
  try {
    requireGuildAccess(req, req.params.id);
    const guildId = req.params.id;

    const memberCountResult = prisma.guild
      .findUnique({ where: { id: guildId } })
      .then((g: { memberCount: number } | null) => g?.memberCount ?? 0);

    const [memberCount, levelingCount, economyCount, musicConfigured, ticketsConfigured, automodConfigured] = await Promise.all([
      memberCountResult,
      prisma.levelingData.count({ where: { guildId } }),
      prisma.economyUser.count({ where: { guildId } }),
      prisma.musicQueue.count({ where: { guildId } }),
      prisma.ticketConfig.count({ where: { guildId } }),
      prisma.automodSettings.count({ where: { guildId } }),
    ]);

    return res.json({
      memberCount,
      levelingUsers: levelingCount,
      economyUsers: economyCount,
      musicConfigured,
      ticketsConfigured,
      automodConfigured,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return res.status(401).json({ error: "Not authenticated" });
    }
    console.error("GET /api/guilds/:id/stats error:", error);
    return res.status(500).json({
      error: "Failed to load stats",
      message: "Could not load server stats. Please try again later.",
    });
  }
});


router.get("/guilds/:id/leaderboard", async (req: Request, res: Response) => {
  try {
    requireGuildAccess(req, req.params.id);
    const guildId = req.params.id;
    const entries = await prisma.levelingData.findMany({
      where: { guildId },
      orderBy: { totalXp: "desc" },
      take: 20,
    });

    return res.json(
      (entries as { userId: string; level: number; totalXp: number }[]).map((e, i) => ({
        rank: i + 1,
        userId: e.userId,
        level: e.level,
        totalXp: e.totalXp,
      })),
    );
  } catch (error) {
    return res.status(500).json({ error: (error as Error).message });
  }
});

router.get("/guilds/:id/economy", async (req: Request, res: Response) => {
  try {
    requireGuildAccess(req, req.params.id);
    const guildId = req.params.id;
    const entries = await prisma.economyUser.findMany({
      where: { guildId },
      orderBy: { cash: "desc" },
      take: 20,
    });

    return res.json(
      (entries as { userId: string; cash: number; bank: number }[]).map((e, i) => ({
        rank: i + 1,
        userId: e.userId,
        cash: e.cash,
        bank: e.bank,
      })),
    );
  } catch (error) {
    return res.status(500).json({ error: (error as Error).message });
  }
});

router.post("/guilds/:id/test-card", async (req: Request, res: Response) => {
  try {
    requireGuildAccess(req, req.params.id);
    const guild = await prisma.guild.findUnique({ where: { id: req.params.id } });
    if (!guild) return res.status(404).json({ error: "Server not found" });
    return res.json({
      ok: true,
      guildId: guild.id,
      message: "Card generation is available through the bot's live leveling commands.",
    });
  } catch (error) {
    return res.status(500).json({ error: (error as Error).message });
  }
});

const SUPPORTED_LOCALES = ["en", "es", "de", "fr", "hi", "ru"] as const;

router.get("/settings/:guildId/language", async (req: Request, res: Response) => {
  try {
    requireGuildAccess(req, req.params.guildId);
    const guild = await prisma.guild.findUnique({ where: { id: req.params.guildId }, select: { locale: true } });
    return res.json({ locale: guild?.locale && SUPPORTED_LOCALES.includes(guild.locale as (typeof SUPPORTED_LOCALES)[number]) ? guild.locale : "en" });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") return res.status(401).json({ error: "Not authenticated" });
    console.error("GET /api/settings/:guildId/language error:", error);
    return res.status(500).json({ error: "Failed to load language setting" });
  }
});

router.put("/settings/:guildId/language", async (req: Request, res: Response) => {
  try {
    requireGuildAccess(req, req.params.guildId);
    const locale = String(req.body?.locale ?? "en");
    if (!SUPPORTED_LOCALES.includes(locale as (typeof SUPPORTED_LOCALES)[number])) {
      return res.status(400).json({ error: "Unsupported language" });
    }
    const guild = await prisma.guild.update({ where: { id: req.params.guildId }, data: { locale } });
    return res.json({ locale: guild.locale });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") return res.status(401).json({ error: "Not authenticated" });
    console.error("PUT /api/settings/:guildId/language error:", error);
    return res.status(500).json({ error: "Failed to save language setting" });
  }
});

router.get("/settings/:guildId/automod", async (req: Request, res: Response) => {
  try {
    requireGuildAccess(req, req.params.guildId);
    const guildId = req.params.guildId;
    if (!guildId) {
      return res.status(400).json({ error: "Missing server ID" });
    }
    const settings = await prisma.automodSettings.findUnique({
      where: { guildId },
    });
    return res.json(settings ?? {
      wordFilters: [],
      linkFilters: [],
      spamEnabled: true,
      raidEnabled: true,
      maxLinks: 5,
      maxEmotes: 10,
      blockInvites: true,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return res.status(401).json({ error: "Not authenticated" });
    }
    console.error("GET /api/settings/:guildId/automod error:", error);
    return res.status(500).json({
      error: "Failed to load automod settings",
      message: "Could not load automod settings. Please try again later.",
    });
  }
});

router.put("/settings/:guildId/automod", async (req: Request, res: Response) => {
  try {
    requireGuildAccess(req, req.params.guildId);
    const guildId = req.params.guildId;
    if (!guildId) {
      return res.status(400).json({ error: "Missing server ID" });
    }
    const data = req.body as any;
    const settings = await prisma.automodSettings.upsert({
      where: { guildId },
      create: {
        guildId: req.params.guildId,
        wordFilters: JSON.stringify(data.wordFilters ?? []),
        linkFilters: JSON.stringify(data.linkFilters ?? []),
        spamEnabled: data.spamEnabled ?? true,
        raidEnabled: data.raidEnabled ?? true,
        maxLinks: data.maxLinks ?? 5,
        maxEmotes: data.maxEmotes ?? 10,
        blockInvites: data.blockInvites ?? true,
      },
      update: {
        wordFilters: JSON.stringify(data.wordFilters ?? []),
        linkFilters: JSON.stringify(data.linkFilters ?? []),
        spamEnabled: data.spamEnabled ?? true,
        raidEnabled: data.raidEnabled ?? true,
        maxLinks: data.maxLinks ?? 5,
        maxEmotes: data.maxEmotes ?? 10,
        blockInvites: data.blockInvites ?? true,
      },
    });
    return res.json(settings);
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return res.status(401).json({ error: "Not authenticated" });
    }
    console.error("PUT /api/settings/:guildId/automod error:", error);
    return res.status(500).json({
      error: "Failed to save automod settings",
      message: "Could not save automod settings. Please try again later.",
    });
  }
});

router.get("/settings/:guildId/leveling", async (req: Request, res: Response) => {
  try {
    requireGuildAccess(req, req.params.guildId);
    const settings = await prisma.levelingSettings.findUnique({
      where: { guildId: req.params.guildId },
    });
    return res.json(settings ?? {
      enabled: true,
      xpMessage: "Your message earned you **{xp}** XP!",
      levelUpMessage: "🎉 **{user}** just leveled up to **Level {level}**!",
      autoRole: null,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return res.status(401).json({ error: "Not authenticated" });
    }
    console.error("GET /api/settings/:guildId/leveling error:", error);
    return res.status(500).json({
      error: "Failed to load leveling settings",
      message: "Could not load leveling settings. Please try again later.",
    });
  }
});

router.put("/settings/:guildId/leveling", async (req: Request, res: Response) => {
  try {
    requireGuildAccess(req, req.params.guildId);
    const guildId = req.params.guildId;
    if (!guildId) {
      return res.status(400).json({ error: "Missing server ID" });
    }
    const data = req.body as any;
    const settings = await prisma.levelingSettings.upsert({
      where: { guildId },
      create: {
        guildId,
        enabled: data.enabled ?? true,
        xpMessage: data.xpMessage ?? "Your message earned you **{xp}** XP!",
        levelUpMessage: data.levelUpMessage ?? "🎉 **{user}** just leveled up to **Level {level}**!",
        autoRole: data.autoRole ?? null,
      },
      update: {
        enabled: data.enabled ?? true,
        xpMessage: data.xpMessage ?? "Your message earned you **{xp}** XP!",
        levelUpMessage: data.levelUpMessage ?? "🎉 **{user}** just leveled up to **Level {level}**!",
        autoRole: data.autoRole ?? null,
      },
    });
    return res.json(settings);
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return res.status(401).json({ error: "Not authenticated" });
    }
    console.error("PUT /api/settings/:guildId/leveling error:", error);
    return res.status(500).json({
      error: "Failed to save leveling settings",
      message: "Could not save leveling settings. Please try again later.",
    });
  }
});

router.get("/settings/:guildId/economy", async (req: Request, res: Response) => {
  try {
    requireGuildAccess(req, req.params.guildId);
    const guildId = req.params.guildId;
    if (!guildId) {
      return res.status(400).json({ error: "Missing server ID" });
    }
    const settings = await prisma.economySettings.findUnique({
      where: { guildId },
    });
    return res.json(settings ?? {
      enabled: true,
      dailyAmount: 500,
      minCash: 0,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return res.status(401).json({ error: "Not authenticated" });
    }
    console.error("GET /api/settings/:guildId/economy error:", error);
    return res.status(500).json({
      error: "Failed to load economy settings",
      message: "Could not load economy settings. Please try again later.",
    });
  }
});

router.put("/settings/:guildId/economy", async (req: Request, res: Response) => {
  try {
    requireGuildAccess(req, req.params.guildId);
    const guildId = req.params.guildId;
    if (!guildId) {
      return res.status(400).json({ error: "Missing server ID" });
    }
    const data = req.body as any;
    const settings = await prisma.economySettings.upsert({
      where: { guildId },
      create: {
        guildId,
        enabled: data.enabled ?? true,
        dailyAmount: data.dailyAmount ?? 500,
        minCash: data.minCash ?? 0,
      },
      update: {
        enabled: data.enabled ?? true,
        dailyAmount: data.dailyAmount ?? 500,
        minCash: data.minCash ?? 0,
      },
    });
    return res.json(settings);
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return res.status(401).json({ error: "Not authenticated" });
    }
    console.error("PUT /api/settings/:guildId/economy error:", error);
    return res.status(500).json({
      error: "Failed to save economy settings",
      message: "Could not save economy settings. Please try again later.",
    });
  }
});

router.get("/settings/:guildId/welcome", async (req: Request, res: Response) => {
  try {
    requireGuildAccess(req, req.params.guildId);
    const guildId = req.params.guildId;
    if (!guildId) {
      return res.status(400).json({ error: "Missing server ID" });
    }
    const config = await prisma.welcomeConfig.findUnique({
      where: { guildId },
    });
    return res.json(config ?? {
      channelId: null,
      message: "Welcome {user} to {server}! 👋",
      dmEnabled: false,
      dmMessage: "Welcome to {server}, {user}!",
      goodbyeChannelId: null,
      goodbyeMessage: "Goodbye {user}!",
      autoRoleId: null,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return res.status(401).json({ error: "Not authenticated" });
    }
    console.error("GET /api/settings/:guildId/welcome error:", error);
    return res.status(500).json({
      error: "Failed to load welcome settings",
      message: "Could not load welcome settings. Please try again later.",
    });
  }
});

router.put("/settings/:guildId/welcome", async (req: Request, res: Response) => {
  try {
    requireGuildAccess(req, req.params.guildId);
    const guildId = req.params.guildId;
    if (!guildId) {
      return res.status(400).json({ error: "Missing server ID" });
    }
    const data = req.body as any;
    const config = await prisma.welcomeConfig.upsert({
      where: { guildId },
      create: {
        guildId,
        channelId: data.channelId ?? null,
        message: data.message ?? "Welcome {user} to {server}! 👋",
        dmEnabled: data.dmEnabled ?? false,
        dmMessage: data.dmMessage ?? "Welcome to {server}, {user}!",
        goodbyeChannelId: data.goodbyeChannelId ?? null,
        goodbyeMessage: data.goodbyeMessage ?? "Goodbye {user}!",
        autoRoleId: data.autoRoleId ?? null,
      },
      update: {
        channelId: data.channelId ?? null,
        message: data.message ?? "Welcome {user} to {server}! 👋",
        dmEnabled: data.dmEnabled ?? false,
        dmMessage: data.dmMessage ?? "Welcome to {server}, {user}!",
        goodbyeChannelId: data.goodbyeChannelId ?? null,
        goodbyeMessage: data.goodbyeMessage ?? "Goodbye {user}!",
        autoRoleId: data.autoRoleId ?? null,
      },
    });
    return res.json(config);
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return res.status(401).json({ error: "Not authenticated" });
    }
    console.error("PUT /api/settings/:guildId/welcome error:", error);
    return res.status(500).json({
      error: "Failed to save welcome settings",
      message: "Could not save welcome settings. Please try again later.",
    });
  }
});

router.get("/settings/:guildId/tickets", async (req: Request, res: Response) => {
  try {
    requireGuildAccess(req, req.params.guildId);
    const guildId = req.params.guildId;
    if (!guildId) {
      return res.status(400).json({ error: "Missing server ID" });
    }
    const config = await prisma.ticketConfig.findUnique({
      where: { guildId },
    });
    return res.json(config ?? {
      channelId: null,
      categoryId: null,
      transcriptEnabled: true,
      closable: true,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return res.status(401).json({ error: "Not authenticated" });
    }
    console.error("GET /api/settings/:guildId/tickets error:", error);
    return res.status(500).json({
      error: "Failed to load ticket settings",
      message: "Could not load ticket settings. Please try again later.",
    });
  }
});

router.put("/settings/:guildId/tickets", async (req: Request, res: Response) => {
  try {
    requireGuildAccess(req, req.params.guildId);
    const guildId = req.params.guildId;
    if (!guildId) {
      return res.status(400).json({ error: "Missing server ID" });
    }
    const data = req.body as any;
    const config = await prisma.ticketConfig.upsert({
      where: { guildId },
      create: {
        guildId,
        channelId: data.channelId ?? null,
        categoryId: data.categoryId ?? null,
        transcriptEnabled: data.transcriptEnabled ?? true,
        closable: data.closable ?? true,
      },
      update: {
        channelId: data.channelId ?? null,
        categoryId: data.categoryId ?? null,
        transcriptEnabled: data.transcriptEnabled ?? true,
        closable: data.closable ?? true,
      },
    });
    return res.json(config);
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return res.status(401).json({ error: "Not authenticated" });
    }
    console.error("PUT /api/settings/:guildId/tickets error:", error);
    return res.status(500).json({
      error: "Failed to save ticket settings",
      message: "Could not save ticket settings. Please try again later.",
    });
  }
});

export { router as dashboardRoutes };
