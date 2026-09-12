import { Router, Request, Response } from "express";
import { prisma } from "@aeris/shared";

const router = Router();

function requireAuth(req: Request): { id: string; username: string; avatar?: string | null; guildIds: string[] } {
  const user = (req.session as any)?.user;
  if (!user || typeof user?.id !== "string") {
    throw new Error("Unauthorized");
  }
  return user as { id: string; username: string; avatar?: string | null; guildIds: string[] };
}

function requireGuildAccess(req: Request, guildId: string | undefined) {
  const user = requireAuth(req);
  if (!guildId || !user.guildIds.includes(guildId)) {
    throw new Error("Unauthorized");
  }
  return user;
}

router.get("/guilds", async (req: Request, res: Response) => {
  try {
    requireAuth(req);
    const userManagedGuilds = (req.session as any)?.user?.guildIds ?? [];
    if (!Array.isArray(userManagedGuilds) || userManagedGuilds.length === 0) {
      return res.json([]);
    }

    const guilds = await prisma.guild.findMany({
      where: {
        id: { in: userManagedGuilds },
        name: { not: null },
      },
      orderBy: { createdAt: "desc" },
    });

    return res.json(guilds);
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

    const [memberCount, levelingCount, economyCount] = await Promise.all([
      memberCountResult,
      prisma.levelingData.count({ where: { guildId } }),
      prisma.economyUser.count({ where: { guildId } }),
    ]);

    return res.json({
      memberCount,
      levelingUsers: levelingCount,
      economyUsers: economyCount,
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
    // Placeholder: actual card generation happens in the bot package
    return res.json({
      ok: true,
      message: "Card generation is handled by the bot. Use /leveling profile to preview.",
    });
  } catch (error) {
    return res.status(500).json({ error: (error as Error).message });
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
