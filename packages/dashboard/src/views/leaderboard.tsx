import { useEffect, useState } from "react";
import { api, ApiError } from "../lib/api";
import { RefreshCw, Trophy } from "lucide-react";

interface Guild {
  id: string;
  name?: string | null;
}

interface Entry {
  rank: number;
  userId: string;
  level: number;
  totalXp: number;
}

export function Leaderboard() {
  const [guilds, setGuilds] = useState<Guild[]>([]);
  const [guildId, setGuildId] = useState("");
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .get("/guilds")
      .then((data) => {
        const nextGuilds = Array.isArray(data) ? (data as Guild[]) : [];
        setGuilds(nextGuilds);
        setGuildId(nextGuilds[0]?.id ?? "");
      })
      .catch((cause) => {
        setError(cause instanceof ApiError ? cause.message : "Could not load your servers.");
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    if (!guildId) {
      setEntries([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    api
      .get(`/guilds/${guildId}/leaderboard`)
      .then((data) => setEntries(Array.isArray(data) ? (data as Entry[]) : []))
      .catch((cause) => {
        setError(cause instanceof ApiError ? cause.message : "Could not load the leaderboard.");
        setEntries([]);
      })
      .finally(() => setLoading(false));
  }, [guildId]);

  return (
    <div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-brand">Community progress</p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight">Leaderboard</h1>
          <p className="mt-1 text-sm text-text-secondary">Top members by XP earned</p>
        </div>
        {guilds.length > 0 && (
          <select
            value={guildId}
            onChange={(event) => setGuildId(event.target.value)}
            aria-label="Choose a server"
            className="rounded-lg border border-border bg-surface-raised px-3 py-2 text-sm font-medium outline-none focus:border-brand"
          >
            {guilds.map((guild) => (
              <option key={guild.id} value={guild.id}>
                {guild.name ?? guild.id}
              </option>
            ))}
          </select>
        )}
      </div>

      <div className="mt-6 max-w-3xl overflow-hidden rounded-2xl border border-border bg-surface-2">
        {loading ? (
          <div className="flex min-h-56 items-center justify-center">
            <div className="h-9 w-9 animate-spin rounded-full border-4 border-brand border-t-transparent" />
          </div>
        ) : error ? (
          <div className="p-10 text-center">
            <RefreshCw className="mx-auto h-7 w-7 text-danger" />
            <p className="mt-3 text-sm text-danger">{error}</p>
          </div>
        ) : entries.length === 0 ? (
          <div className="p-10 text-center text-sm text-text-secondary">
            <Trophy className="mx-auto mb-3 h-7 w-7" />
            No XP earned yet.
          </div>
        ) : (
          <div className="divide-y divide-border">
            {entries.map((entry) => (
              <div key={entry.userId} className="flex items-center gap-3 px-4 py-4 sm:gap-4 sm:px-5">
                <span className="w-8 shrink-0 text-center font-bold text-brand">
                  {entry.rank === 1 ? "🥇" : entry.rank === 2 ? "🥈" : entry.rank === 3 ? "🥉" : entry.rank}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">User {entry.userId.slice(0, 8)}…</p>
                  <p className="text-xs text-text-secondary">Level {entry.level}</p>
                </div>
                <span className="shrink-0 text-right text-sm font-medium text-text-secondary">
                  {entry.totalXp.toLocaleString()} XP
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}