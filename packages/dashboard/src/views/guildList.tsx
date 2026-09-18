import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Bot, RefreshCw, Users, Settings, BarChart3, Wallet } from "lucide-react";
import { api, ApiError } from "../lib/api";
import { DASHBOARD_EXTRA, useI18n } from "../i18n";

interface Guild {
  id: string;
  name?: string | null;
  icon?: string | null;
  memberCount?: number;
}

export function GuildList() {
  const [guilds, setGuilds] = useState<Guild[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { locale } = useI18n();
  const copy = DASHBOARD_EXTRA[locale];

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    api
      .get("/guilds")
      .then((data) => {
        if (cancelled) return;
        setGuilds(Array.isArray(data) ? (data as Guild[]) : []);
      })
      .catch((cause) => {
        if (cancelled) return;
        setError(
          cause instanceof ApiError
            ? cause.message
            : "Could not load your servers. Please try again.",
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
          <h1 className="mt-4 text-xl font-semibold">Couldn't load servers</h1>
          <p className="mt-2 text-sm text-text-secondary">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-brand">{copy.serverManagement}</p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight">{copy.yourServers}</h1>
          <p className="mt-1 text-sm text-text-secondary">{copy.selectServer}</p>
        </div>
        <div className="flex items-center gap-2 text-sm text-text-secondary">
          <Bot className="h-4 w-4" />
          {guilds.length} server{guilds.length !== 1 ? "s" : ""}
        </div>
      </div>

      {guilds.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-dashed border-border-strong bg-surface-2 p-10 text-center">
          <Bot className="mx-auto h-9 w-9 text-text-secondary" />
          <h2 className="mt-4 text-lg font-semibold">{copy.noServers}</h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-text-secondary">
            Connect Aeris to a Discord server you manage, then refresh this page.
          </p>
        </div>
      ) : (
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {guilds.map((guild) => (
            <div
              key={guild.id}
              className="group rounded-2xl border border-border bg-surface-2 p-5 transition-all hover:border-brand/50 hover:shadow-lg hover:shadow-brand/5"
            >
              <div className="flex items-start gap-3">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-brand/10 text-brand">
                  <Bot className="h-6 w-6" />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="truncate font-semibold group-hover:text-brand">
                    {guild.name ?? guild.id}
                  </h3>
                  <p className="mt-0.5 flex items-center gap-1 text-xs text-text-secondary">
                    <Users className="h-3 w-3" />
                    {guild.memberCount?.toLocaleString() ?? "—"} members
                  </p>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                <Link
                  to={`/dashboard/guilds/${guild.id}/settings`}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface-raised px-3 py-1.5 text-xs font-medium text-text-secondary transition-colors hover:border-brand/50 hover:text-brand"
                >
                  <Settings className="h-3 w-3" />
                  Settings
                </Link>
                <Link
                  to={`/dashboard/guilds/${guild.id}/leaderboard`}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface-raised px-3 py-1.5 text-xs font-medium text-text-secondary transition-colors hover:border-brand/50 hover:text-brand"
                >
                  <BarChart3 className="h-3 w-3" />
                  Leaderboard
                </Link>
                <Link
                  to={`/dashboard/guilds/${guild.id}/economy`}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface-raised px-3 py-1.5 text-xs font-medium text-text-secondary transition-colors hover:border-brand/50 hover:text-brand"
                >
                  <Wallet className="h-3 w-3" />
                  Economy
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
