import { Router, Request, Response } from "express";

const router = Router();

function requireAuth(req: Request) {
  const user = (req.session as any)?.user;
  if (!user?.id) throw new Error("Unauthorized");
}

async function providerJson<T>(url: string, init?: RequestInit) {
  const response = await fetch(url, { ...init, signal: AbortSignal.timeout(10_000) });
  if (!response.ok) throw new Error(`Provider returned HTTP ${response.status}`);
  return (await response.json()) as T;
}

router.get("/minecraft/player/:username", async (req, res) => {
  try {
    requireAuth(req);
    const profile = await providerJson<{ id: string; name: string }>(
      `https://api.mojang.com/users/profiles/minecraft/${encodeURIComponent(req.params.username)}`,
    );
    return res.json({
      id: profile.id,
      name: profile.name,
      avatarUrl: `https://mc-heads.net/avatar/${encodeURIComponent(profile.name)}/256`,
    });
  } catch (error) {
    return res.status(error instanceof Error && error.message === "Unauthorized" ? 401 : 502).json({
      error: error instanceof Error ? error.message : "Minecraft lookup failed",
    });
  }
});

router.get("/minecraft/server/:address", async (req, res) => {
  try {
    requireAuth(req);
    const status = await providerJson<Record<string, unknown>>(
      `https://api.mcstatus.io/v2/status/java/${encodeURIComponent(req.params.address)}`,
    );
    return res.json(status);
  } catch (error) {
    return res.status(error instanceof Error && error.message === "Unauthorized" ? 401 : 502).json({
      error: error instanceof Error ? error.message : "Minecraft server lookup failed",
    });
  }
});

router.get("/movie/:query", async (req, res) => {
  try {
    requireAuth(req);
    const key = process.env.TMDB_API_KEY;
    if (!key) return res.status(503).json({ error: "TMDB_API_KEY is not configured" });
    const result = await providerJson<Record<string, unknown>>(
      `https://api.themoviedb.org/3/search/multi?api_key=${encodeURIComponent(key)}&query=${encodeURIComponent(req.params.query)}&include_adult=false&language=en-US&page=1`,
    );
    return res.json(result);
  } catch (error) {
    return res.status(error instanceof Error && error.message === "Unauthorized" ? 401 : 502).json({
      error: error instanceof Error ? error.message : "Movie lookup failed",
    });
  }
});

router.get("/roblox/user/:username", async (req, res) => {
  try {
    requireAuth(req);
    const result = await providerJson<{ data?: Array<{ id: number; name: string; displayName: string; description?: string }> }>(
      "https://users.roblox.com/v1/usernames/users",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ usernames: [req.params.username], excludeBannedUsers: false }),
      },
    );
    const user = result.data?.[0];
    if (!user) return res.status(404).json({ error: "Roblox user not found" });
    return res.json(user);
  } catch (error) {
    return res.status(error instanceof Error && error.message === "Unauthorized" ? 401 : 502).json({
      error: error instanceof Error ? error.message : "Roblox lookup failed",
    });
  }
});

export { router as lookupRoutes };
