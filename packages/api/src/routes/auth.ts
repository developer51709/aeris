import { Router, Request, Response } from "express";

const router = Router();

const CLIENT_ID = process.env.BOT_OAUTH_CLIENT_ID;
const CLIENT_SECRET = process.env.BOT_OAUTH_CLIENT_SECRET;
const REDIRECT_URI = process.env.BOT_OAUTH_REDIRECT_URI;

const OAuthErrors = {
  notConfigured: {
    error: "OAuth is not configured",
    message:
      "BOT_OAUTH_CLIENT_ID, BOT_OAUTH_CLIENT_SECRET, and BOT_OAUTH_REDIRECT_URI must be set.",
  },
  missingParams: {
    error: "Missing OAuth parameters",
    message:
      "Discord returned an incomplete OAuth response. Please try again.",
  },
  stateMismatch: {
    error: "State mismatch",
    message:
      "The OAuth session expired or was reused. Please reconnect again.",
  },
  tokenFailed: {
    error: "Authentication failed",
    message:
      "Discord rejected the OAuth exchange. Please try connecting again.",
  },
  fetchFailed: {
    error: "Authentication failed",
    message: "Could not load your Discord account. Please try again.",
  },
  unknown: {
    error: "Authentication failed",
    message: "An unexpected error occurred. Please try again.",
  },
};

function sendOAuthNotConfigured(res: Response) {
  return res.status(500).json(OAuthErrors.notConfigured);
}

router.get("/discord", (req: Request, res: Response) => {
  if (!CLIENT_ID || !CLIENT_SECRET || !REDIRECT_URI) {
    console.error(
      "OAuth redirect requested but credentials are missing. CLIENT_ID:",
      Boolean(CLIENT_ID),
      "REDIRECT_URI:",
      REDIRECT_URI,
    );
    return sendOAuthNotConfigured(res);
  }

  const state = Math.random().toString(36).slice(2);
  (req.session as any).authState = state;

  const params = new URLSearchParams({
    client_id: CLIENT_ID,
    redirect_uri: REDIRECT_URI,
    response_type: "code",
    scope: "identify guilds",
    state,
  });

  const authorizeUrl = `https://discord.com/oauth2/authorize?${params.toString()}`;
  console.log("OAuth authorize redirect to:", authorizeUrl);
  res.redirect(authorizeUrl);
});

router.get("/callback", async (req: Request, res: Response) => {
  const code = req.query.code as string;
  const state = req.query.state as string;

  if (!code || !state) {
    console.error("OAuth callback missing code/state. query:", req.query);
    return res.status(400).json(OAuthErrors.missingParams);
  }

  const sessionState = (req.session as any).authState;
  if (state !== sessionState) {
    console.error(
      "OAuth callback state mismatch. session:",
      sessionState,
      "query:",
      state,
    );
    return res.status(400).json(OAuthErrors.stateMismatch);
  }

  if (!CLIENT_ID || !CLIENT_SECRET || !REDIRECT_URI) {
    console.error("OAuth callback reached without configuration");
    return res.status(500).json(OAuthErrors.notConfigured);
  }

  try {
    const tokenRes = await fetch(`https://discord.com/api/v10/oauth2/token`, {
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
      const text = await tokenRes.text().catch(() => "");
      console.error(
        "Discord token exchange failed:",
        tokenRes.status,
        text.slice(0, 200),
      );
      return res.status(502).json(OAuthErrors.tokenFailed);
    }

    const tokens = (await tokenRes.json()) as { access_token: string };

    const [userRes, guildsRes] = await Promise.all([
      fetch(`https://discord.com/api/v10/users/@me`, {
        headers: { Authorization: `Bearer ${tokens.access_token}` },
      }),
      fetch(`https://discord.com/api/v10/users/@me/guilds`, {
        headers: { Authorization: `Bearer ${tokens.access_token}` },
      }),
    ]);

    if (!userRes.ok || !guildsRes.ok) {
      console.error(
        "Discord user/guild fetch failed:",
        userRes.status,
        guildsRes.status,
      );
      return res.status(502).json(OAuthErrors.fetchFailed);
    }

    const user = (await userRes.json()) as {
      id: string;
      username: string;
      global_name?: string;
      avatar?: string;
    };

    const guilds = (await guildsRes.json()) as {
      id: string;
      permissions: string;
    }[];
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

    console.log(
      "OAuth callback success:",
      user.id,
      "managed guilds:",
      managedGuilds.length,
    );
    return res.redirect(
      process.env.DASHBOARD_URL ?? "http://localhost:5173/dashboard",
    );
  } catch (error) {
    console.error("OAuth callback error:", error);
    return res.status(500).json(OAuthErrors.unknown);
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
