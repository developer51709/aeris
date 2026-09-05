import { Router, Request, Response } from "express";

const router = Router();

const CLIENT_ID = process.env.BOT_OAUTH_CLIENT_ID ?? "";
const CLIENT_SECRET = process.env.BOT_OAUTH_CLIENT_SECRET ?? "";
const REDIRECT_URI = process.env.BOT_OAUTH_REDIRECT_URI ?? "";

const DISCORD_API = "https://discord.com/api/v10";

router.get("/discord", (req: Request, res: Response) => {
  const state = Math.random().toString(36).slice(2);
  (req.session as any).authState = state;

  const params = new URLSearchParams({
    client_id: CLIENT_ID,
    redirect_uri: REDIRECT_URI,
    response_type: "code",
    scope: "identify guilds",
    state,
  });

  res.redirect(`https://discord.com/oauth2/authorize?${params.toString()}`);
});

router.get("/callback", async (req: Request, res: Response) => {
  const code = req.query.code as string;
  const state = req.query.state as string;

  if (!code || !state) {
    return res.status(400).send("Missing OAuth parameters");
  }

  const sessionState = (req.session as any).authState;
  if (state !== sessionState) {
    return res.status(400).send("State mismatch");
  }

  try {
    const tokenRes = await fetch(`${DISCORD_API}/oauth2/token`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        grant_type: "authorization_code",
        code,
        redirect_uri: REDIRECT_URI,
      }),
    });

    if (!tokenRes.ok) {
      throw new Error(`Token exchange failed: ${tokenRes.status}`);
    }

    const tokens = (await tokenRes.json()) as { access_token: string };

    const [userRes, guildsRes] = await Promise.all([
      fetch(`${DISCORD_API}/users/@me`, {
        headers: { Authorization: `Bearer ${tokens.access_token}` },
      }),
      fetch(`${DISCORD_API}/users/@me/guilds`, {
        headers: { Authorization: `Bearer ${tokens.access_token}` },
      }),
    ]);

    const user = (await userRes.json()) as {
      id: string;
      username: string;
      global_name?: string;
      avatar?: string;
    };

    const guilds = (await guildsRes.json()) as { id: string; permissions: string }[];
    const MANAGE_SERVER = 1n << 5n;
    const managedGuilds = guilds
      .filter((g) => (BigInt(g.permissions) & MANAGE_SERVER) !== 0n)
      .map((g) => g.id);

    (req.session as any).user = {
      id: user.id,
      username: user.global_name ?? user.username,
      avatar: user.avatar,
      guildIds: managedGuilds,
    };

    return res.redirect(process.env.DASHBOARD_URL ?? "http://localhost:5173/dashboard");
  } catch (error) {
    console.error("OAuth callback error:", error);
    return res.status(500).send("Authentication failed");
  }
});

router.get("/me", (req: Request, res: Response) => {
  const user = (req.session as any).user;
  if (!user) {
    return res.status(401).json({ error: "Not authenticated" });
  }
  return res.json(user);
});

router.post("/logout", (req: Request, res: Response) => {
  req.session = null as any;
  return res.json({ ok: true });
});

export { router as authRoutes };
