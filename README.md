# Aeris — Discord Bot & Dashboard

> A full-stack Discord bot with a modern dashboard. Moderation, automod, leveling, economy, tickets, welcome cards, music (Lavalink), AI chat, Minecraft / Roblox lookups, TMDB movies, Tenor GIFs — plus a multilingual React dashboard (en / es / de / fr / hi / ru).

<p>
  <img src="https://img.shields.io/badge/Node-20%2B-339933?style=flat-square&logo=node.js&logoColor=white" alt="Node 20+" />
  <img src="https://img.shields.io/badge/pnpm-9.15.4-F69220?style=flat-square&logo=pnpm&logoColor=white" alt="pnpm 9.15.4" />
  <img src="https://img.shields.io/badge/discord.js-14-5865F2?style=flat-square&logo=discord&logoColor=white" alt="discord.js 14" />
  <img src="https://img.shields.io/badge/Prisma-5-2D5986?style=flat-square&logo=prisma&logoColor=white" alt="Prisma" />
  <img src="https://img.shields.io/badge/license-MIT-blue?style=flat-square" alt="MIT" />
</p>

---

## Table of Contents

- [Features](#features)
- [Architecture](#architecture)
- [Prerequisites](#prerequisites)
- [Quick Start — Self-Host in 3 Minutes](#quick-start--self-host-in-3-minutes)
- [Detailed Setup](#detailed-setup)
- [Environment Reference](#environment-reference)
- [Discord Application Setup](#discord-application-setup)
- [Database & Prisma](#database--prisma)
- [Development vs Production](#development-vs-production)
- [Dashboard & Hosting Notes](#dashboard--hosting-notes)
- [Commands](#commands)
- [Optional Integrations](#optional-integrations)
- [Languages](#languages)
- [Troubleshooting](#troubleshooting)
- [Project Structure](#project-structure)
- [Scripts](#scripts)
- [Security](#security)
- [Credits](#credits)

---

## Features

**Bot**
- Slash, prefix, and context-menu commands (registry auto-discovers `packages/bot/src/commands/*.ts`)
- Moderation: ban / kick / timeout / massrole (batched `guild.members.fetch()` with hierarchy checks), slowmode, purge
- Automod: word & link filters, spam / raid protection, invite blocks
- Leveling with XP cards (`@napi-rs/canvas` + Cloudinary), leaderboard & auto-role
- Economy: cash / bank / daily / shop / inventory
- Tickets & transcripts, welcome / goodbye messages with auto-role
- Music via Lavalink failover pool (`LAVALINK_NODES`) + `@discordjs/voice`
- AI chat with OpenAI-compatible failover (`AI_PROVIDERS` pool)
- Lookups: Minecraft, Roblox (proxied via API), TMDB movie search, Tenor GIFs, image generation

**Dashboard** (`packages/dashboard` — Vite + React 19 + Tailwind 4 + React Router + TanStack Query)
- Discord OAuth (`identify` + `guilds`), persistent `aeris.login` cookie + `LoginSession` table
- Server picker (only guilds where you have `Manage Server` or own the guild)
- Per-guild settings: automod, leveling, economy, welcome, tickets, language
- Real-time status, leaderboard, economy views, integrations page
- Multilingual: `en` `es` `de` `fr` `hi` `ru` — saved per-guild in `Guild.locale` (also persists in `localStorage` + `document.documentElement.lang`)

**API** (`packages/api` — Express + Prisma + `cookie-session`)
- Restores durable `aeris.login` cookie via middleware **before** routes so parallel `GET /auth/me` + `GET /api/guilds` never races to `401` / “Managing 0 servers”
- Serves the built dashboard in production (`packages/dashboard/dist`)

---

## Architecture

```
aeris/
├── server.ts               # Supervisor — spawns API + bot together (tsx in dev, dist in prod)
├── load-env.ts             # Root env loader — precedence: injected env > non-empty .env.local > .env
├── packages/
│   ├── shared/             # Prisma schema + @prisma/client singleton
│   │   └── prisma/schema.prisma  # Guild.locale, LoginSession, Leveling/Economy/Tickets etc.
│   ├── bot/                # discord.js client, GatewayIntents: Guilds, GuildMessages, MessageContent, GuildVoiceStates, GuildMembers
│   │   └── src/commands/   # admin, automod, moderationx, music, ai, lookup, media, image, fun (≤25 subcommands), …
│   ├── api/                # Express (CORS + cookie-session + prisma), /auth, /api, /search, /api/lookups
│   └── dashboard/          # Vite React app, proxy /api + /auth + /search → API in dev
└── env.example             # Documented env template
```

- **Dev:** `pnpm dev` runs `bot` + `api` via `tsx` + `dashboard` via Vite concurrently.
- **Prod:** `pnpm build` builds `shared` → `bot` + `api` (`tsc`) + `dashboard` (`tsc -b && vite build`) + root `dist/server.js` (`tsconfig.server.json`); `pnpm start:prod` runs `node dist/server.js` which supervisors both `dist/index.js` and `packages/bot/dist/index.js` and kills the peer if either exits.

---

## Prerequisites

| Requirement | Version / Notes |
|---|---|
| **Node.js** | `>= 20` (22 recommended). Check with `node -v` |
| **pnpm** | `9.15.4` (`npm i -g pnpm@9.15.4` or `corepack enable`) |
| **PostgreSQL** | `14+` — local, Docker, Neon, Supabase, etc. |
| **Discord Application** | Bot token + OAuth2 `application.commands` credentials |
| **Git** | Any recent version |

Optional services (all gracefully disabled when unset): Lavalink node(s), OpenAI-compatible AI, TMDB, Tenor, Cloudinary, Meilisearch.

---

## Quick Start — Self-Host in 3 Minutes

```bash
# 1. Clone
git clone https://github.com/developer51709/aeris.git
cd aeris

# 2. Install
pnpm install

# 3. Configure env — copy template and fill at least the 4 required keys
cp env.example .env
# then edit .env (see Environment Reference below)

# 4. Database
pnpm db:generate   # generate Prisma client
pnpm db:push       # push schema to Postgres (or: pnpm --filter @aeris/shared exec prisma migrate dev)

# 5. Build & run
pnpm build
pnpm start:prod    # → API on http://0.0.0.0:3001, dashboard served by API, bot logs in
# Dev instead: pnpm dev  → dashboard http://localhost:5173, API http://localhost:3001
```

Open the dashboard at `http://localhost:5173` (dev) or `http://localhost:3001` (prod). Log in with Discord, pick a server where you have **Manage Server**, and configure it.

Update slash commands: they register automatically on `ClientReady`. Invite the bot first, then restart once so `registerCommands()` can read `client.application.id`.

---

## Detailed Setup

### 1. Clone & Install

```bash
git clone https://github.com/developer51709/aeris.git
cd aeris
corepack enable # if pnpm not found
pnpm install
```

> The repo uses `pnpm-workspace.yaml` with `packages/*`. Using `npm`/`yarn`/`bun install` will not resolve `workspace:*` correctly.

### 2. Create a Discord Application

1. Go to **https://discord.com/developers/applications → New Application**.
2. **Bot** tab → **Reset Token** → copy — this is `DISCORD_TOKEN` (also accepted as `DISCORD_BOT_TOKEN`).
3. **Bot** tab → enable **Privileged Gateway Intents**: `Presence Intent` (optional), `Server Members Intent` (required for `massrole`/`welcome`/`GuildMembers`), `Message Content Intent` (required for prefix + automod message handling).
4. **OAuth2 → General** → copy **Client ID** → `BOT_OAUTH_CLIENT_ID` (also `DISCORD_CLIENT_ID` fallback) and **Client Secret** → `BOT_OAUTH_CLIENT_SECRET`.
5. **OAuth2 → General → Redirects** → add:
   - Dev: `http://localhost:5173/auth/callback`
   - Prod: `https://your-domain.com/auth/callback` (must match `BOT_OAUTH_REDIRECT_URI` exactly)
6. Invite URL: **OAuth2 → URL Generator** → Scopes: `bot` + `applications.commands` + `identify` + `guilds` → Bot Permissions: `Manage Roles`, `Ban Members`, `Kick Members`, `Moderate Members`, `Manage Messages`, `Manage Channels`, `Send Messages`, `Embed Links`, `Attach Files`, `Connect`, `Speak` (for music) → copy generated URL and open it to add the bot to your server. Put the bot’s role **above** any role it needs to assign.

### 3. Environment Variables

Copy the template:

```bash
cp env.example .env
```

| Variable | Required | Description | Example |
|---|---|---|---|
| `DATABASE_URL` | **Yes** | Postgres connection string | `postgresql://aeris:aeris@localhost:5432/aeris` |
| `DISCORD_TOKEN` | **Yes** | Bot token from Developer Portal → Bot | `MTQy...` |
| `BOT_OAUTH_CLIENT_ID` | **Yes** | Application → General → Application ID | `123456789012345678` |
| `BOT_OAUTH_CLIENT_SECRET` | **Yes** | OAuth2 → Client Secret | `abc...` |
| `BOT_OAUTH_REDIRECT_URI` | **Yes** | Must exactly match portal redirect | `http://localhost:5173/auth/callback` |
| `SESSION_SECRET` | **Yes** | Random 32+ char string for `cookie-session` | `openssl rand -hex 32` |
| `DASHBOARD_URL` | **Yes** | Public dashboard origin (CORS `origin`, OAuth redirect base) | `http://localhost:5173` (dev) / `https://your-domain.com` (prod) |
| `API_PORT` | No | Port API listens on (`0.0.0.0`) | `3001` |
| `NODE_ENV` | No | `development` / `production` | `production` |
| `BOT_OWNER_ID` | No | Comma-separated owner IDs for `/admin broadcast` (owner-only) | `123,456` |
| `GUILD_ID` | No | If set, slash commands register to this guild instantly (useful in dev) | `987...` |

**Aliases:** `DISCORD_BOT_TOKEN` is accepted as `DISCORD_TOKEN`; `DISCORD_CLIENT_ID` is accepted as `BOT_OAUTH_CLIENT_ID` in the command registry fallback.

**Env precedence** (implemented in `load-env.ts`, `packages/api/src/env.ts`, `packages/bot/src/env.ts`, `packages/dashboard/vite.config.ts`):
1. Already-injected process env (hosting provider) wins — never overwritten.
2. Non-empty `.env.local` wins over `.env`.
3. Blank values are ignored (so a blank `BOT_OAUTH_REDIRECT_URI=` in `.env.local` no longer masks a valid value in `.env` — a prior production outage).

> Never commit `.env` / `.env.local`. They are gitignored. Keep secrets private and never share them with anyone.

### 4. Database

```bash
# Generate client (needed after every schema change or fresh clone)
pnpm db:generate

# Fastest for self-host: push schema directly
pnpm db:push

# Or use migrations (recommended if you will evolve the schema)
pnpm --filter @aeris/shared exec prisma migrate dev --name init
pnpm --filter @aeris/shared exec prisma migrate deploy  # on the server
```

Schema lives at `packages/shared/prisma/schema.prisma` (Postgres, `Guild.locale` default `en`, `LoginSession` for durable logins).

Need a local Postgres quickly?

```bash
docker run --name aeris-db -e POSTGRES_USER=aeris -e POSTGRES_PASSWORD=aeris \
  -e POSTGRES_DB=aeris -p 5432:5432 -d postgres:16-alpine
# then DATABASE_URL=postgresql://aeris:aeris@localhost:5432/aeris
```

### 5. Run

```bash
# Development — hot reload for bot + api + dashboard
pnpm dev
# → bot via tsx watch, api via tsx watch, dashboard Vite on http://0.0.0.0:${PORT:-5173}
#    dashboard proxies /api, /auth, /search → http://127.0.0.1:3001

# Production — single supervisor process (used by hosting)
pnpm build
NODE_ENV=production pnpm start:prod
# or: NODE_ENV=production node dist/server.js
# → single origin on API_PORT (dashboard is served as static from packages/dashboard/dist)

# One-off command deploy (normally automatic on bot ready)
pnpm --filter @aeris/bot exec tsx src/deploy.ts
```

---

## Environment Reference — Full Template

`env.example` is the source of truth — copy it:

```env
NODE_ENV=development
DATABASE_URL=postgresql://aeris:aeris@localhost:5432/aeris
BOT_OAUTH_CLIENT_ID=
BOT_OAUTH_CLIENT_SECRET=
BOT_OAUTH_REDIRECT_URI=http://localhost:5173/auth/callback
# Required for owner-only administrative broadcasts. Use one or more Discord user IDs separated by commas.
BOT_OWNER_ID=
DASHBOARD_URL=http://localhost:5173
API_PORT=3001
SESSION_SECRET=replace-with-a-long-random-string
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
CLOUDINARY_ASSET_FOLDER=aeris
# Optional OpenAI-compatible AI provider (keep the key in the environment, never in source)
AI_API_KEY=
AI_API_URL=https://api.openai.com/v1
AI_MODEL=gpt-4o-mini
# Optional AI failover pool. Use a JSON array of {name,url,key,model} objects.
AI_PROVIDERS=[]
TMDB_API_KEY=
TENOR_API_KEY=
# Optional Lavalink failover pool. Use a JSON array of {name,url,password} objects.
LAVALINK_NODES=[]
LAVALINK_NODE_URLS=
LAVALINK_PASSWORD=youshallnotpass
```

**Extra env vars recognized by the bot** (not in `env.example` but supported in code):

| Variable | Purpose |
|---|---|
| `DISCORD_TOKEN` / `DISCORD_BOT_TOKEN` | Bot login token (preferred `DISCORD_TOKEN`) |
| `DISCORD_CLIENT_ID` | Fallback application ID for command registration |
| `GUILD_ID` | Register slash commands to one guild instantly |
| `AI_API_KEY` / `AI_API_URL` / `AI_MODEL` | Single OpenAI-compatible provider |
| `AI_PROVIDERS` | JSON array `[{name,url,key,model}]` — failover pool |
| `LAVALINK_NODES` | JSON array `[{name,url,password}]` — music failover |
| `LAVALINK_NODE_URLS` / `LAVALINK_NODE_1_URL` / `LAVALINK_PASSWORD` | Legacy Lavalink envs |
| `TMDB_API_KEY` | Movie / TV lookups |
| `TENOR_API_KEY` | GIF search |
| `CLOUDINARY_*` | Level card / image uploads |
| `VITE_PORT` / `PORT` | Dashboard Vite dev port |
| `API_PROXY_URL` | Dashboard Vite proxy target (default `http://127.0.0.1:3001`) |

Leave any optional key empty to disable that integration — the bot starts fine.

---

## Discord Application Setup — In Detail

- **Invite scopes:** `bot` + `applications.commands` + `identify` + `guilds`
- **Intents to enable:** `Guilds`, `Guild Messages`, `Message Content`, `Guild Voice States`, `Guild Members`. Code requests exactly `GatewayIntentBits.Guilds | GuildMessages | MessageContent | GuildVoiceStates | GuildMembers`.
- **Redirect URI:** path must be `/auth/callback` on the same origin as `DASHBOARD_URL`. For production, also add the domain to **OAuth2 → General → Redirects**. Mismatched URI → Discord returns `invalid_grant` during token exchange (the API redirects back to `/login?oauthError=…`).
- **`BOT_OWNER_ID`:** set your Discord user ID (Developer Mode → right-click → Copy ID). Separate multiple with commas. Required for `/admin broadcast`; without it that subcommand rejects with an owner-only error.

---

## Database & Prisma

- **Provider:** `postgresql` (SQLite not supported — schema uses Postgres)
- **Client singleton:** `packages/shared/src/index.ts` exports `prisma`
- **Models:** `Guild` (with `locale`), `User`, `GuildMember`, `AutomodSettings`, `LevelingSettings`/`LevelingData`, `EconomySettings`/`EconomyUser`/`EconomyInventory`/`EconomyShopItem`, `TicketConfig`/`Ticket`, `WelcomeConfig`, `MusicQueue`, `ModerationLog`, `LoginSession`
- After changing `schema.prisma`: `pnpm db:generate && pnpm db:push` (or `prisma migrate dev`)

---

## Development vs Production

|  | Development (`pnpm dev`) | Production (`pnpm build && pnpm start:prod`) |
|---|---|---|
| **Processes** | 3 concurrent via `concurrently`: `pnpm --filter @aeris/bot dev`, `pnpm --filter @aeris/api dev`, `pnpm --filter @aeris/dashboard dev` on `0.0.0.0:${PORT:-5173}` | 1 supervisor (`dist/server.js`) on `0.0.0.0:${API_PORT:-3001}` |
| **Bot** | `tsx watch src/index.ts` | `node packages/bot/dist/index.js` |
| **API** | `tsx watch src/index.ts` | `node dist/index.js` (serves `packages/dashboard/dist`) |
| **Env** | Reads `.env` → `.env.local` per-package via `dotenv.parse` | Same loader; production env from host inject wins |
| **Cookies** | `secure: false`, `sameSite: lax` | `secure: true` when `NODE_ENV=production` |

Freebuff / container hosts **must** bind to `0.0.0.0` and use the injected `PORT` — the config already does (`server: { host: "0.0.0.0", port: Number(process.env.VITE_PORT ?? process.env.PORT ?? 5173) }` and `app.listen(PORT, "0.0.0.0")`).

---

## Dashboard & Hosting Notes

- **Vite proxy (dev only):** `/api`, `/auth`, `/search` → `API_PROXY_URL` (default `http://127.0.0.1:3001`). Set `VITE_API_URL` / `VITE_AUTH_URL` via `import.meta.env` if you split the deploy.
- **Build output:** `packages/dashboard/dist` (static). In production the API serves it + falls back to `index.html` for SPA routes; `/auth`, `/api`, `/search`, `/health` are excluded from the fallback.
- **CORS:** `origin: DASHBOARD_URL`, `credentials: true`.
- **Sessions:** `cookie-session` (`aeris.session`, 7 days) + durable `aeris.login` (30 days, `LoginSession` row, restored by middleware before routes — fixes the “Managing 0 servers” race).
- **Node-only deploy:** builder expects `pnpm install` then `vite build` / `tsc` producing `dist/` and exiting. No `uv`/`pip`/`python`/`apt`/`cargo` in install/build; never invoke scripts as `./script.sh` (execute bit is stripped) — use `sh ./scripts/foo.sh`.

---

## Commands

Commands are defined in `packages/bot/src/commands/*.ts` and registered on `ClientReady` via `registerCommands(client)` (REST `PUT` to `Routes.applicationCommands` globally or `Routes.applicationGuildCommands` when `GUILD_ID` is set). Discord caches globally up to ~1 hour — use `GUILD_ID` in dev for instant updates.

Top-level commands include: `admin` (status/stats/shards/announce/broadcast), `automod`, `moderation` / `moderationx` (including `massrole`), `leveling`, `economy`/`shop`, `ticket`, `welcome`, `music`, `ai`, `lookup` (Minecraft/Roblox), `movies` (TMDB), `media`/`image` (Tenor/Cloudinary canvas), `fun`, `social`, `server`, `utility`, `voicemaster`, `blackjack`, `help`/`ping`/`health`, plus context-menu commands.

> Discord limit: **≤25 subcommands per slash command**. `fun` is capped at 25 (extra games live in `blackjack` etc.).

---

## Optional Integrations

All are optional — the bot boots without them and skips related features.

| Integration | Env | Notes |
|---|---|---|
| **AI chat** | `AI_API_KEY`, `AI_API_URL`, `AI_MODEL` or `AI_PROVIDERS=[{name,url,key,model}]` | OpenAI-compatible; pool tries next provider on failure |
| **Music** | `LAVALINK_NODES=[{name,url,password}]` (or `LAVALINK_NODE_URLS` comma list) | `@discordjs/voice` + Lavalink; no node → music commands reply with setup hint |
| **Movies** | `TMDB_API_KEY` | TMDB v3 search |
| **GIFs** | `TENOR_API_KEY` | Tenor v2 |
| **Images** | `CLOUDINARY_*`, `@napi-rs/canvas` | Level cards and image commands |

Generate keys: OpenAI (or any compatible), [TMDB](https://www.themoviedb.org/settings/api), [Tenor](https://tenor.com/developer/dashboard), [Cloudinary](https://cloudinary.com/console), self-hosted Lavalink.

---

## Languages

Dashboard + bot responses support `en` `es` `de` `fr` `hi` `ru`.

- Dashboard: auto-detects `navigator.languages`, persisted in `localStorage` (`aeris-locale`) and `document.documentElement.lang`; footer popover to switch.
- Bot: per-guild locale stored in `Guild.locale`, exposed via `GET/PUT /api/settings/:guildId/language`, resolved in `packages/bot/src/locale.ts` and applied in `components.ts` `replyV2`/`editV2`.
- Docs & Integrations pages are localized via `packages/dashboard/src/i18n.tsx` (`SUPPORTED_LOCALES`, `LANDING_MESSAGES`, `DASHBOARD_EXTRA`, `DocsMessages`).

Add a locale by extending `SUPPORTED_LOCALES`, `LOCALE_LABELS`, `LANDING_MESSAGES` in `packages/dashboard/src/i18n.tsx` and adding the Prisma `Guild.locale` default if desired, then `pnpm db:generate`.

---

## Troubleshooting

**`Managing 0 servers` / dashboard shows 0 guilds**
- Make sure the OAuth account has **Manage Server** or is owner. The API filters by `MANAGE_GUILD` (`1 << 5`).
- Wait ~2 min after inviting the bot — Discord/DB sync is on `GuildCreate` / ready events.
- The API now restores `aeris.login` before routes and refreshes `guildIds` from Discord while `accessToken` is present. If you still see 0, open DevTools → Application → Cookies and confirm `aeris.login` exists; then hit `GET /api/guilds` — server logs show `oauthManagedGuildCount` / `botSyncedGuildCount`.

**OAuth loops back to `/login?oauthError=…`**
- `OAuth is not configured` → `BOT_OAUTH_CLIENT_ID` / `SECRET` / `REDIRECT_URI` missing. Check `env.example` vs your `.env` and that `.env.local` does not contain a blank `BOT_OAUTH_REDIRECT_URI=` masking the real value.
- `State mismatch` → session cookie lost (third-party cookies blocked, `DASHBOARD_URL` mismatch, or running dashboard on a different origin). Keep `DASHBOARD_URL` exactly the origin that serves the dashboard.
- `Discord rejected the OAuth exchange` → `REDIRECT_URI` in `.env` does not exactly match the portal’s **Redirects** entry (including `https`, host, and `/auth/callback`).

**Slash commands don’t appear**
- Global commands take up to an hour. Set `GUILD_ID=<your test guild>` in `.env` and restart for instant guild commands.
- Ensure the bot was invited with `applications.commands` scope.

**`massrole` says `0 changed`**
- Fixed: command now uses `guild.members.fetch()` (not `members.cache`), skips bots/owner/`role.managed`/roles above the bot’s highest role/already-has-role, batches `Promise.allSettled` in groups of 5, and reports skipped/failed counts with reasons. Ensure the bot’s role is **above** the target role.

**Database connection errors / `Can't reach database`**
- Verify `DATABASE_URL` is reachable from the host. For Docker Postgres, use `host.docker.internal` when the bot runs outside the container.
- Run `pnpm db:generate` after checkout — stale `packages/shared/node_modules/.prisma` causes type errors.

**Port already in use / `EADDRINUSE`**
- Change `API_PORT` (API) or `VITE_PORT`/`PORT` (dashboard) in `.env`.

**Dashboard is blank / `Failed to load servers` 500**
- Check API logs (`Health: Prisma connection error`). In dev ensure API is on `3001` (Vite proxies there); in prod ensure `DASHBOARD_URL` matches the origin.

---

## Project Structure

```
.
├── env.example
├── load-env.ts
├── server.ts
├── package.json                 # root scripts: dev, build, build:root, db:*, start, start:prod
├── pnpm-workspace.yaml
├── tsconfig.json / tsconfig.server.json
└── packages/
    ├── shared/
    │   ├── prisma/schema.prisma
    │   ├── src/index.ts         # prisma singleton export
    │   └── package.json
    ├── bot/
    │   ├── src/
    │   │   ├── index.ts
    │   │   ├── env.ts
    │   │   ├── locale.ts
    │   │   ├── components.ts
    │   │   ├── deploy.ts
    │   │   ├── commands/        # registry.ts, interaction-router.ts, moderationx.ts, …
    │   │   ├── events/          # ready, guild, member, message, prefix
    │   │   ├── lib/embeds.ts
    │   │   ├── image/           # cards.ts, cloudinary.ts
    │   │   └── music/lavalink.ts
    │   └── package.json
    ├── api/
    │   ├── src/
    │   │   ├── index.ts         # Express + session restore middleware + static dashboard
    │   │   ├── env.ts
    │   │   └── routes/          # auth.ts, dashboard.ts, search.ts, lookups.ts
    │   └── package.json
    └── dashboard/
        ├── vite.config.ts       # parseProjectEnv + proxy + 0.0.0.0 host
        ├── src/
        │   ├── App.tsx
        │   ├── main.tsx
        │   ├── i18n.tsx
        │   ├── lib/api.ts
        │   ├── pages/           # landing.tsx, auth.tsx, dashboard.tsx, docs.tsx
        │   ├── views/           # overview, guildList, guildSettings, integrations, economy, …
        │   └── components/layout.tsx
        └── package.json
```

---

## Scripts

| Script | Where | What |
|---|---|---|
| `pnpm dev` | root | `concurrently` bot + api (`tsx watch`) + dashboard (`Vite`) |
| `pnpm build` | root | `shared build` → `bot build` + `api build` + `dashboard build` → `build:root` (`dist/server.js`) |
| `pnpm build:root` | root | `tsc -p tsconfig.server.json` |
| `pnpm db:generate` | root | `pnpm --filter @aeris/shared db:generate` (`prisma generate`) |
| `pnpm db:push` | root | `pnpm --filter @aeris/shared db:push` (`prisma db push`) |
| `pnpm start` | root | `tsx server.ts` (dev supervisor) |
| `pnpm start:prod` | root | `NODE_ENV=production node dist/server.js` |
| `pnpm --filter @aeris/bot build` | bot | `tsc` → `packages/bot/dist` |
| `pnpm --filter @aeris/api build` | api | `tsc` → `packages/api/dist` |
| `pnpm --filter @aeris/dashboard build` | dashboard | `tsc -b && vite build` → `packages/dashboard/dist` |

Typecheck without emitting: `pnpm --filter @aeris/api exec tsc --noEmit`, `pnpm --filter @aeris/bot exec tsc --noEmit`, `pnpm --filter @aeris/dashboard exec tsc -b --noEmit`, `pnpm --filter @aeris/shared exec tsc --noEmit`.

---

## Security

- Keep `DISCORD_TOKEN` / `BOT_OAUTH_CLIENT_SECRET` / `SESSION_SECRET` / `DATABASE_URL` / provider keys in the host env — never commit `.env`.
- `SESSION_SECRET` should be a long random value; it signs `aeris.session`. Rotate it to invalidate all sessions.
- In production, cookies are `httpOnly` + `secure` + `sameSite: lax`. Always serve over `https` when `NODE_ENV=production`.
- The `GET /auth/me` → `GET /api/guilds` race was fixed by restoring `aeris.login` in global middleware — do not move session restoration into a single route.

---

## Credits

Built and maintained with care. Special thanks to:

- **sorenthedev** on Discord — creator & maintainer
  - Website: **https://sorenthedev.indevs.in**
  - GitHub: **https://github.com/developer51709**

If Aeris helps your server, consider starring the repo and sharing feedback with `sorenthedev` on Discord — it keeps the project moving.

---

## License

MIT — see `LICENSE`. You are free to self-host, fork, and modify — keep the Credits section intact when redistributing.

