import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { api, ApiError } from "../lib/api";
import { RefreshCw, Wallet, ArrowLeft } from "lucide-react";

interface Entry {
  rank: number;
  userId: string;
  cash: number;
  bank: number;
}

export function Economy() {
  const { guildId } = useParams<{ guildId: string }>();
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!guildId) return;
    setLoading(true);
    setError(null);
    api
      .get(`/guilds/${guildId}/economy`)
      .then((data) => setEntries(Array.isArray(data) ? (data as Entry[]) : []))
      .catch((cause) => {
        setError(cause instanceof ApiError ? cause.message : "Could not load economy data.");
        setEntries([]);
      })
      .finally(() => setLoading(false));
  }, [guildId]);

  return (
    <div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Link
            to="/dashboard/guilds"
            className="inline-flex items-center gap-1.5 text-sm text-text-secondary hover:text-brand transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Servers
          </Link>
          <h1 className="mt-2 text-3xl font-bold tracking-tight">Economy</h1>
          <p className="mt-1 text-sm text-text-secondary">Wealthiest members across cash and bank</p>
        </div>
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
            <Wallet className="mx-auto mb-3 h-7 w-7" />
            No economy data yet.
          </div>
        ) : (
          <div className="divide-y divide-border">
            {entries.map((entry) => (
              <div key={entry.userId} className="flex items-center gap-3 px-4 py-4 sm:gap-4 sm:px-5">
                <span className="w-8 shrink-0 text-center font-bold text-brand">{entry.rank}</span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">User {entry.userId.slice(0, 8)}…</p>
                  <p className="text-xs text-text-secondary">🏦 {entry.bank.toLocaleString()} in bank</p>
                </div>
                <span className="shrink-0 text-right text-sm font-medium text-text-secondary">
                  💰 {entry.cash.toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
