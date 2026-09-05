import { Router, Request, Response } from "express";
import { prisma } from "@aeris/shared";

const router = Router();

function requireAuth(req: Request): any {
  const user = (req.session as any)?.user;
  if (!user) {
    throw new Error("Unauthorized");
  }
  return user;
}

router.get("/guilds", async (req: Request, res: Response) => {
  try {
    const user = requireAuth(req);
    // In MVP return the guilds the user manages that also have Aeris presence
    const guilds = await prisma.guild.findMany({
      where: {
        // Placeholder: in real setup this would come from bot presence check
        name: { not: null },
      },
      orderBy: { createdAt: "desc" },
    });
    return res.json(guilds);
  } catch (error) {
    return res.status(500).json({ error: (error as Error).message });
  }
});

router.get("/guilds/:id", async (req: Request, res: Response) => {
  try {
    const user = requireAuth(req);
    const guild = await prisma.guild.findUnique({
      where: { id: req.params.id },
    });
    if (!guild) return res.status(404).json({ error: "Guild not found" });
    return res.json(guild);
  } catch (error) {
    return res.status(500).json({ error: (error as Error).message });
  }
});

router.put("/guilds/:id", async (req: Request, res: Response) => {
  try {
    const user = requireAuth(req);
    const body = req.body;

    const guild = await prisma.guild.update({
      where: { id: req.params.id },
      data: {
        name: body.name ?? undefined,
        icon: body.icon ?? undefined,
        memberCount: body.memberCount ?? undefined,
      },
    });
    return res.json(guild);
  } catch (error) {
    return res.status(500).json({ error: (error as Error).message });
  }
});

router.get("/guilds/:id/stats", async (req: Request, res: Response) => {
  try {
    requireAuth(req);
    const guildId = req.params.id;

    const [memberCount, levelingCount, economyCount] = await Promise.all([
      prisma.guild
        .findUnique({ where: { id: guildId } })
        .then((g: { memberCount: number } | null) => g?.memberCount ?? 0),
      prisma.levelingData.count({ where: { guildId } }),
      prisma.economyUser.count({ where: { guildId } }),
    ]);

    return res.json({
      memberCount,
      levelingUsers: levelingCount,
      economyUsers: economyCount,
    });
  } catch (error) {
    return res.status(500).json({ error: (error as Error).message });
  }
});

router.get("/guilds/:id/leaderboard", async (req: Request, res: Response) => {
  try {
    requireAuth(req);
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
    requireAuth(req);
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
    requireAuth(req);
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
    requireAuth(req);
    const settings = await prisma.automodSettings.findUnique({
      where: { guildId: req.params.guildId },
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
    return res.status(500).json({ error: (error as Error).message });
  }
});

router.put("/settings/:guildId/automod", async (req: Request, res: Response) => {
  try {
    requireAuth(req);
    const data = req.body;
    const settings = await prisma.automodSettings.upsert({
      where: { guildId: req.params.guildId },
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
    return res.status(500).json({ error: (error as Error).message });
  }
});

router.get("/settings/:guildId/leveling", async (req: Request, res: Response) => {
  try {
    requireAuth(req);
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
    return res.status(500).json({ error: (error as Error).message });
  }
});

router.put("/settings/:guildId/leveling", async (req: Request, res: Response) => {
  try {
    requireAuth(req);
    const data = req.body;
    const settings = await prisma.levelingSettings.upsert({
      where: { guildId: req.params.guildId },
      create: {
        guildId: req.params.guildId,
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
    return res.status(500).json({ error: (error as Error).message });
  }
});

router.get("/settings/:guildId/economy", async (req: Request, res: Response) => {
  try {
    requireAuth(req);
    const settings = await prisma.economySettings.findUnique({
      where: { guildId: req.params.guildId },
    });
    return res.json(settings ?? {
      enabled: true,
      dailyAmount: 500,
      minCash: 0,
    });
  } catch (error) {
    return res.status(500).json({ error: (error as Error).message });
  }
});

router.put("/settings/:guildId/economy", async (req: Request, res: Response) => {
  try {
    requireAuth(req);
    const data = req.body;
    const settings = await prisma.economySettings.upsert({
      where: { guildId: req.params.guildId },
      create: {
        guildId: req.params.guildId,
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
    return res.status(500).json({ error: (error as Error).message });
  }
});

router.get("/settings/:guildId/welcome", async (req: Request, res: Response) => {
  try {
    requireAuth(req);
    const config = await prisma.welcomeConfig.findUnique({
      where: { guildId: req.params.guildId },
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
    return res.status(500).json({ error: (error as Error).message });
  }
});

router.put("/settings/:guildId/welcome", async (req: Request, res: Response) => {
  try {
    requireAuth(req);
    const data = req.body;
    const config = await prisma.welcomeConfig.upsert({
      where: { guildId: req.params.guildId },
      create: {
        guildId: req.params.guildId,
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
    return res.status(500).json({ error: (error as Error).message });
  }
});

router.get("/settings/:guildId/tickets", async (req: Request, res: Response) => {
  try {
    requireAuth(req);
    const config = await prisma.ticketConfig.findUnique({
      where: { guildId: req.params.guildId },
    });
    return res.json(config ?? {
      channelId: null,
      categoryId: null,
      transcriptEnabled: true,
      closable: true,
    });
  } catch (error) {
    return res.status(500).json({ error: (error as Error).message });
  }
});

router.put("/settings/:guildId/tickets", async (req: Request, res: Response) => {
  try {
    requireAuth(req);
    const data = req.body;
    const config = await prisma.ticketConfig.upsert({
      where: { guildId: req.params.guildId },
      create: {
        guildId: req.params.guildId,
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
    return res.status(500).json({ error: (error as Error).message });
  }
});

export { router as dashboardRoutes };
