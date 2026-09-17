import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Bot, Shield, Zap, Wallet, Music, Ticket, ArrowRight, RefreshCw, User } from "lucide-react";
import { api, authApi, ApiError } from "../lib/api";
import { cn } from "../lib/utils";

interface UserProfile {
  id: string;
  username: string;
  avatar?: string | null;
  guildIds: string[];
}

interface Guild {
  id: string;
  name?: string | null;
  icon?: string | null;
  memberCount?: number;
}

interface BotStatus {
  online: boolean;
  guildCount: number;
  memberCount: number;
  aiProviderCount?: number;
  lavalinkNodeCount?: number;
  checkedAt: string;
}

function getAvatarUrl(userId: string, avatar: string | null | undefined) {
  if (avatar) {
    return `https://cdn.discordapp.com/avatars/${userId}/${avatar}.png?size=128`;
  }
  return `https://cdn.discordapp.com/embed/avatars/${BigInt(userId) % 5n}.png`;
}

export function UserProfile() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [guilds, setGuilds] = useState<Guild[]>([]);
  const [status, setStatus] = useState<BotStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    Promise.all([
      authApi.get("/me").catch(() => null),
      api.get("/guilds").catch(() => []),
      api.get("/status").catch(() => null),
    ])
      .then(([userData, guildData, statusData]) => {
        if (cancelled) return;
        if (userData && typeof userData === "object" && "id" in userData) {
          setUser(userData as UserProfile);
        }
        setGuilds(Array.isArray(guildData) ? (guildData as Guild[]) : []);
        if (statusData && typeof statusData === "object" && "online" in statusData) {
          setStatus(statusData as BotStatus);
        }
      })
      .catch((cause) => {
        if (cancelled) return;
        setError(
          cause instanceof ApiError
            ? cause.message
            : "Could not load your profile. Please try again.",
        );
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-brand border-t-transparent" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto flex min-h-[50vh] max-w-lg items-center justify-center">
        <div className="w-full rounded-2xl border border-danger/30 bg-danger/5 p-8 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-danger/10 text-danger">
            <RefreshCw className="h-6 w-6" />
          </div>
          <h1 className="mt-4 text-xl font-semibold">Couldn't load your profile</h1>
          <p className="mt-2 text-sm text-text-secondary">{error}</p>
        </div>
      </div>
    );
  }

  const quickLinks = [
    { icon: Shield, label: "Automod", desc: "Filters & protection", color: "bg-red-500/10 text-red-500" },
    { icon: Zap, label: "Leveling", desc: "XP & leaderboards", color: "bg-brand/10 text-brand" },
    { icon: Wallet, label: "Economy", desc: "Currency & shop", color: "bg-amber-500/10 text-amber-500" },
    { icon: Music, label: "Music", desc: "Playback & queue", color: "bg-purple-500/10 text-purple-500" },
    { icon: Ticket, label: "Tickets", desc: "Support panels", color: "bg-emerald-500/10 text-emerald-500" },
  ];

  return (
    <div>
      {/* User header */}
      <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <div className="relative">
            <img
              src={user ? getAvatarUrl(user.id, user.avatar) : ""}
              alt=""
              className="h-16 w-16 rounded-2xl border-2 border-border object-cover"
            />
            <div className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full border-2 border-surface bg-success text-white">
              <Bot className="h-3 w-3" />
            </div>
          </div>
          <div>
            <p className="text-sm font-medium text-brand">Welcome back</p>
            <h1 className="text-2xl font-bold tracking-tight">{user?.username ?? "User"}</h1>
            <p className="mt-0.5 text-sm text-text-secondary">
              Managing {guilds.length} server{guilds.length !== 1 ? "s" : ""}
            </p>
          </div>
        </div>
        <Link
          to="/dashboard/guilds"
          className="inline-flex items-center gap-2 rounded-xl bg-brand px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-brand/20 transition-all hover:-translate-y-0.5 hover:shadow-xl hover:shadow-brand/30"
        >
          Manage Servers
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      {/* Bot status */}
      <div className="mt-8 rounded-2xl border border-border bg-surface-2 p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-text-secondary">Aeris status</p>
            <div className="mt-2 flex items-center gap-2">
              <span className={`h-2.5 w-2.5 rounded-full ${status?.online ? "bg-success" : "bg-danger"}`} />
              <span className="font-semibold">{status?.online ? "Operational" : "Needs attention"}</span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-3">
            <div className="rounded-xl bg-surface-raised px-4 py-3"><p className="text-xl font-bold">{status?.guildCount ?? guilds.length}</p><p className="text-text-secondary">Servers</p></div>
            <div className="rounded-xl bg-surface-raised px-4 py-3"><p className="text-xl font-bold">{(status?.memberCount ?? 0).toLocaleString()}</p><p className="text-text-secondary">Members</p></div>
            <div className="hidden rounded-xl bg-surface-raised px-4 py-3 sm:block"><p className="text-xl font-bold">{status?.aiProviderCount ?? 0}</p><p className="text-text-secondary">AI providers</p></div>
            <div className="hidden rounded-xl bg-surface-raised px-4 py-3 lg:block"><p className="text-xl font-bold">{status?.lavalinkNodeCount ?? 0}</p><p className="text-text-secondary">Music nodes</p></div>
          </div>
        </div>
      </div>

      {/* Quick stats */}
      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {quickLinks.map((item) => (
          <div
            key={item.label}
            className="rounded-xl border border-border bg-surface-2 p-4 transition-all hover:border-border-strong hover:shadow-sm"
          >
            <div className={cn("inline-flex rounded-lg p-2", item.color)}>
              <item.icon className="h-5 w-5" />
            </div>
            <p className="mt-3 text-sm font-semibold">{item.label}</p>
            <p className="mt-0.5 text-xs text-text-secondary">{item.desc}</p>
          </div>
        ))}
      </div>

      {/* Recent guilds */}
      {guilds.length > 0 && (
        <div className="mt-8">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Your Servers</h2>
            <Link
              to="/dashboard/guilds"
              className="text-sm font-medium text-brand hover:underline"
            >
              View all →
            </Link>
          </div>
          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {guilds.slice(0, 6).map((guild) => (
              <Link
                key={guild.id}
                to={`/dashboard/guilds/${guild.id}/settings`}
                className="group flex items-center gap-3 rounded-xl border border-border bg-surface-2 p-4 transition-all hover:border-brand/50 hover:shadow-lg hover:shadow-brand/5"
              >
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand/10 text-brand">
                  <Bot className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold group-hover:text-brand">
                    {guild.name ?? "Unnamed server"}
                  </p>
                  <p className="text-xs text-text-secondary">
                    {guild.memberCount?.toLocaleString() ?? "—"} members
                  </p>
                </div>
                <ArrowRight className="h-4 w-4 shrink-0 text-text-secondary transition-transform group-hover:translate-x-0.5 group-hover:text-brand" />
              </Link>
            ))}
          </div>
        </div>
      )}

      {guilds.length === 0 && (
        <div className="mt-8 rounded-2xl border border-dashed border-border-strong bg-surface-2 p-10 text-center">
          <User className="mx-auto h-9 w-9 text-text-secondary" />
          <h2 className="mt-4 text-lg font-semibold">No servers yet</h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-text-secondary">
            Connect Aeris to a Discord server you manage, then come back here.
          </p>
        </div>
      )}
    </div>
  );
}
