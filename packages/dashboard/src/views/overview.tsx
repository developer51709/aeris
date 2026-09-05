import { useEffect, useState } from "react";
import { Bot, Users, Wallet, Music, Ticket, Shield, Zap } from "lucide-react";
import { api } from "../lib/api";
import { cn } from "../lib/utils";

export function Overview() {
  const [guilds, setGuilds] = useState<any[]>([]);
  const [active, setActive] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    api
      .get("/guilds")
      .then((data) => {
        setGuilds(data as any[]);
        setActive(data?.[0] ?? null);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!active) return;
    api
      .get(`/guilds/${active.id}/stats`)
      .then((data) => setStats(data))
      .catch(() => {});
  }, [active]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-brand border-t-transparent" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-sm text-text-secondary">
            Manage your servers and Aeris settings
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm text-text-secondary">
          <Bot className="h-4 w-4" />
          {guilds.length} server{guilds.length !== 1 ? "s" : ""}
        </div>
      </div>

      {active && (
        <div className="mt-6 rounded-xl border border-border bg-surface-2 p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-brand/10 p-2 text-brand">
                <Bot className="h-6 w-6" />
              </div>
              <div>
                <h2 className="font-semibold">{active.name ?? active.id}</h2>
                <p className="text-sm text-text-secondary">
                  Aeris is active in this server
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-text-secondary">Member count</span>
              <span className="text-lg font-semibold">{stats?.memberCount ?? 0}</span>
            </div>
          </div>
        </div>
      )}

      <div className="mt-8 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { icon: Zap, label: "Leveling", value: stats?.levelingUsers ?? 0, color: "bg-brand/10 text-brand" },
          { icon: Wallet, label: "Economy", value: stats?.economyUsers ?? 0, color: "bg-green-500/10 text-green-400" },
          { icon: Music, label: "Music", value: 0, color: "bg-purple-500/10 text-purple-400" },
          { icon: Ticket, label: "Tickets", value: 0, color: "bg-amber-500/10 text-amber-400" },
          { icon: Shield, label: "Automod", value: 0, color: "bg-red-500/10 text-red-400" },
          { icon: Users, label: "Members", value: stats?.memberCount ?? 0, color: "bg-blue-500/10 text-blue-400" },
        ].map((item) => (
          <div
            key={item.label}
            className={cn(
              "rounded-xl border border-border bg-surface-2 p-4 transition-all hover:border-border-strong hover:shadow-sm",
            )}
          >
            <div className={cn("rounded-lg p-2", item.color)}>
              <item.icon className="h-5 w-5" />
            </div>
            <div className="mt-3">
              <span className="text-2xl font-bold">{item.value}</span>
              <p className="mt-0.5 text-sm text-text-secondary">{item.label}</p>
            </div>
          </div>
        ))}
      </div>

      {guilds.length === 0 && (
        <div className="mt-12 rounded-xl border border-dashed border-border bg-surface-2 p-8 text-center">
          <Bot className="mx-auto h-8 w-8 text-text-secondary" />
          <p className="mt-3 text-sm text-text-secondary">
            No servers found. Connect Aeris to a server and refresh.
          </p>
        </div>
      )}
    </div>
  );
}
