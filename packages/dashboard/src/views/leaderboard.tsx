import { useEffect, useState } from "react";
import { api } from "../lib/api";
import { Trophy } from "lucide-react";

interface Entry {
  rank: number;
  userId: string;
  level: number;
  totalXp: number;
}

export function Leaderboard() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get("/guilds")
      .then(async (data) => {
        const guilds = data as { id: string }[];
        if (guilds.length === 0) {
          setLoading(false);
          return;
        }
        const board = await api.get(`/guilds/${guilds[0].id}/leaderboard`);
        setEntries(board as Entry[]);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-brand border-t-transparent" />
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold">Leaderboard</h1>
      <p className="text-sm text-text-secondary">Top members by XP earned</p>

      <div className="mt-6 rounded-xl border border-border bg-surface-2 divide-y divide-border max-w-xl">
        {entries.map((e) => (
          <div key={e.userId} className="flex items-center gap-4 px-5 py-3">
            <span className="w-8 text-center font-bold text-brand">
              {e.rank === 1 ? "🥇" : e.rank === 2 ? "🥈" : e.rank === 3 ? "🥉" : e.rank}
            </span>
            <div className="flex-1">
              <p className="font-medium text-sm">User {e.userId.slice(0, 8)}…</p>
              <p className="text-xs text-text-secondary">Level {e.level}</p>
            </div>
            <span className="text-sm text-text-secondary">{e.totalXp.toLocaleString()} XP</span>
          </div>
        ))}
        {entries.length === 0 && (
          <div className="px-5 py-10 text-center text-text-secondary text-sm">
            <Trophy className="mx-auto h-6 w-6 mb-2" />
            No XP earned yet.
          </div>
        )}
      </div>
    </div>
  );
}
