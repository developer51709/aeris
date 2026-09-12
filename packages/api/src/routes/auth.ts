import { Router, Request, Response } from "express";
import { prisma } from "@aeris/shared";
import crypto from "node:crypto";

const router = Router();

const SESSION_COOKIE = "aeris.login";
const SESSION_MAX_AGE = 30 * 24 * 60 * 60 * 1000; // 30 days

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
  return redirectOAuthError(res, OAuthErrors.notConfigured);
}

function dashboardBaseUrl() {
  const configured = (process.env.DASHBOARD_URL ?? "").replace(/\/+$/, "");
  return configured.endsWith("/dashboard")
    ? configured.slice(0, -"/dashboard".length)
    : configured;
}

function dashboardRedirect(path: string, params?: Record<string, string>) {
  const query = params ? `?${new URLSearchParams(params).toString()}` : "";
  return `${dashboardBaseUrl()}${path}${query}` || `${path}${query}`;
}

function redirectOAuthError(res: Response, error: { error: string; message: string }) {
  return res.redirect(
    dashboardRedirect("/auth", {
      oauthError: error.error,
      message: error.message,
    }),
  );
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

  const state = crypto.randomBytes(24).toString("hex");
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
  const providerError = req.query.error as string;

  if (providerError) {
    return redirectOAuthError(res, {
      error: "Discord sign-in cancelled",
      message: "Discord did not authorize the connection. You can try again whenever you’re ready.",
    });
  }

  if (!code || !state) {
    console.error("OAuth callback missing code/state. query:", req.query);
    return redirectOAuthError(res, OAuthErrors.missingParams);
  }

  const sessionState = (req.session as any).authState;
  if (state !== sessionState) {
    console.error(
      "OAuth callback state mismatch. session:",
      sessionState,
      "query:",
      state,
    );
    return redirectOAuthError(res, OAuthErrors.stateMismatch);
  }
  delete (req.session as any).authState;

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
      return redirectOAuthError(res, OAuthErrors.tokenFailed);
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
      return redirectOAuthError(res, OAuthErrors.fetchFailed);
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

    // Persist session to database for long-lived login
    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + SESSION_MAX_AGE);
    try {
      await prisma.loginSession.upsert({
        where: { userId: user.id },
        create: {
          userId: user.id,
          token,
          username: user.global_name ?? user.username,
          avatar: user.avatar,
          guildIds: JSON.stringify(managedGuilds),
          expiresAt,
        },
        update: {
          token,
          username: user.global_name ?? user.username,
          avatar: user.avatar,
          guildIds: JSON.stringify(managedGuilds),
          expiresAt,
        },
      });
      res.cookie(SESSION_COOKIE, token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: SESSION_MAX_AGE,
        path: "/",
      });
    } catch (e) {
      console.error("Failed to persist login session:", e);
    }

    console.log(
      "OAuth callback success:",
      user.id,
      "managed guilds:",
      managedGuilds.length,
    );
    return res.redirect(dashboardRedirect("/dashboard"));
  } catch (error) {
    console.error("OAuth callback error:", error);
    return redirectOAuthError(res, OAuthErrors.unknown);
  }
});

router.get("/me", async (req: Request, res: Response) => {
  // Try cookie-session first
  const user = (req.session as any)?.user;
  if (user && typeof user.id === "string") {
    return res.json(user);
  }

  // Fallback: restore from persistent login token
  const token = req.cookies?.[SESSION_COOKIE];
  if (token) {
    try {
      const session = await prisma.loginSession.findUnique({ where: { token } });
      if (session && session.expiresAt > new Date()) {
        const restored = {
          id: session.userId,
          username: session.username,
          avatar: session.avatar,
          guildIds: JSON.parse(session.guildIds || "[]"),
        };
        // Rehydrate cookie-session
        (req.session as any).user = restored;
        return res.json(restored);
      }
      // Expired — clean up
      if (session) {
        await prisma.loginSession.delete({ where: { token } }).catch(() => {});
      }
    } catch (e) {
      console.error("Persistent session restore failed:", e);
    }
  }

  return res.status(401).json({ error: "Not authenticated" });
});

router.post("/logout", async (req: Request, res: Response) => {
  // Clear persistent session
  const token = req.cookies?.[SESSION_COOKIE];
  if (token) {
    try {
      await prisma.loginSession.delete({ where: { token } }).catch(() => {});
    } catch (e) { /* ignore */ }
  }
  res.clearCookie(SESSION_COOKIE, { path: "/" });
  req.session = null as any;
  return res.json({ ok: true });
});

export { router as authRoutes };
