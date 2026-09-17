import { useEffect, useState } from "react";
import { Bot, Users, Wallet, Music, Ticket, Shield, Zap, RefreshCw } from "lucide-react";
import { api, ApiError } from "../lib/api";
import { cn } from "../lib/utils";

interface Guild {
  id: string;
  name?: string | null;
  icon?: string | null;
  memberCount?: number;
}

interface Stats {
  memberCount?: number;
  levelingUsers?: number;
  economyUsers?: number;
  musicConfigured?: number;
  ticketsConfigured?: number;
  automodConfigured?: number;
}

function number(value: number | undefined, loading = false) {
  return loading ? "—" : (value ?? 0).toLocaleString();
}

export function Overview() {
  const [guilds, setGuilds] = useState<Guild[]>([]);
  const [active, setActive] = useState<Guild | null>(null);
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(false);
  const [stats, setStats] = useState<Stats | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [statsError, setStatsError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    api
      .get("/guilds")
      .then((data) => {
        if (cancelled) return;
        const nextGuilds = Array.isArray(data) ? (data as Guild[]) : [];
        setGuilds(nextGuilds);
        setActive((current) => {
          if (current && nextGuilds.some((guild) => guild.id === current.id)) return current;
          return nextGuilds[0] ?? null;
        });
      })
      .catch((cause) => {
        if (cancelled) return;
        setError(
          cause instanceof ApiError
            ? cause.message
            : "Could not load your servers. Please try again.",
        );
        setGuilds([]);
        setActive(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [reloadKey]);

  useEffect(() => {
    if (!active) {
      setStats(null);
      return;
    }
    let cancelled = false;
    setStats(null);
    setStatsError(null);
    setStatsLoading(true);
    api
      .get(`/guilds/${active.id}/stats`)
      .then((data) => {
        if (!cancelled) setStats(data as Stats);
      })
      .catch(() => {
        if (!cancelled) setStatsError("Stats are temporarily unavailable.");
      })
      .finally(() => {
        if (!cancelled) setStatsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [active]);

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center" aria-label="Loading dashboard">
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
          <h1 className="mt-4 text-xl font-semibold">Couldn’t load your dashboard</h1>
          <p className="mt-2 text-sm text-text-secondary">{error}</p>
          <button
            type="button"
            onClick={() => setReloadKey((key) => key + 1)}
            className="mt-5 inline-flex items-center gap-2 rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-strong"
          >
            <RefreshCw className="h-4 w-4" /> Try again
          </button>
        </div>
      </div>
    );
  }

  const statsCards = [
    { icon: Zap, label: "Leveling", value: stats?.levelingUsers, color: "bg-brand/10 text-brand" },
    { icon: Wallet, label: "Economy", value: stats?.economyUsers, color: "bg-green-500/10 text-green-600 dark:text-green-400" },
    { icon: Music, label: "Music", value: stats?.musicConfigured, color: "bg-purple-500/10 text-purple-600 dark:text-purple-400" },
    { icon: Ticket, label: "Tickets", value: stats?.ticketsConfigured, color: "bg-amber-500/10 text-amber-600 dark:text-amber-400" },
    { icon: Shield, label: "Automod", value: stats?.automodConfigured, color: "bg-red-500/10 text-red-600 dark:text-red-400" },
    { icon: Users, label: "Members", value: stats?.memberCount, color: "bg-blue-500/10 text-blue-600 dark:text-blue-400" },
  ];

  return (
    <div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-brand">Aeris control center</p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="mt-1 text-sm text-text-secondary">
            Manage your servers and Aeris settings
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm text-text-secondary">
          <Bot className="h-4 w-4" />
          {guilds.length} server{guilds.length !== 1 ? "s" : ""}
        </div>
      </div>

      {guilds.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-dashed border-border-strong bg-surface-2 p-10 text-center">
          <Bot className="mx-auto h-9 w-9 text-text-secondary" />
          <h2 className="mt-4 text-lg font-semibold">No managed servers yet</h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-text-secondary">
            Connect Aeris to a Discord server you manage, then refresh this page.
          </p>
          <button
            type="button"
            onClick={() => setReloadKey((key) => key + 1)}
            className="mt-5 inline-flex items-center gap-2 rounded-lg border border-border-strong bg-surface-raised px-4 py-2 text-sm font-semibold hover:border-brand hover:text-brand"
          >
            <RefreshCw className="h-4 w-4" /> Refresh
          </button>
        </div>
      ) : (
        <>
          <section className="mt-8 rounded-2xl border border-border bg-surface-2 p-5 shadow-soft">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand/10 text-brand">
                  <Bot className="h-6 w-6" />
                </div>
                <div className="min-w-0">
                  <h2 className="truncate font-semibold">{active?.name ?? "Unnamed server"}</h2>
                  <p className="text-sm text-text-secondary">
                    {statsError ?? "Aeris is active in this server"}
                  </p>
                </div>
              </div>
              <label className="flex items-center gap-2 text-sm text-text-secondary">
                <span className="sr-only">Choose a server</span>
                <select
                  value={active?.id ?? ""}
                  onChange={(event) =>
                    setActive(guilds.find((guild) => guild.id === event.target.value) ?? null)
                  }
                  className="min-w-0 max-w-full rounded-lg border border-border bg-surface-raised px-3 py-2 text-sm font-medium text-text-primary outline-none focus:border-brand"
                >
                  {guilds.map((guild) => (
                    <option key={guild.id} value={guild.id}>
                      {guild.name ?? "Unnamed server"}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </section>

          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {statsCards.map((item) => (
              <div
                key={item.label}
                className={cn(
                  "rounded-xl border border-border bg-surface-2 p-4 transition-all hover:border-border-strong hover:shadow-sm",
                )}
              >
                <div className={cn("inline-flex rounded-lg p-2", item.color)}>
                  <item.icon className="h-5 w-5" />
                </div>
                <div className="mt-3">
                  <span className="text-2xl font-bold">
                    {number(item.value, statsLoading)}
                  </span>
                  <p className="mt-0.5 text-sm text-text-secondary">{item.label}</p>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}