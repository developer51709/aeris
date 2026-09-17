import { useEffect, useState } from "react";
import { api } from "../lib/api";
import { Save, MessageCircle } from "lucide-react";

export function WelcomeSettings() {
  const [guildId, setGuildId] = useState("");
  const [guilds, setGuilds] = useState<{ id: string; name: string }[]>([]);
  const [settings, setSettings] = useState<Record<string, unknown>>({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    api
      .get("/guilds")
      .then((data) => {
        const g = data as { id: string; name: string }[];
        setGuilds(g);
        if (g.length > 0) setGuildId(g[0].id);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!guildId) return;
    api
      .get(`/settings/${guildId}/welcome`)
      .then((data) => setSettings((data ?? {}) as Record<string, unknown>))
      .catch(() => setSettings({}));
  }, [guildId]);

  async function save() {
    if (!guildId) return;
    setSaving(true);
    try {
      await api.put(`/settings/${guildId}/welcome`, settings);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally {
      setSaving(false);
    }
  }

  function set(key: string, value: unknown) {
    setSettings((s) => ({ ...s, [key]: value }));
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Welcome Messages</h1>
          <p className="text-sm text-text-secondary">
            Configure welcome and goodbye messages for new members
          </p>
        </div>
        <div className="flex items-center gap-3">
          {guilds.length > 1 && (
            <select
              value={guildId}
              onChange={(e) => setGuildId(e.target.value)}
              className="rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm outline-none focus:border-brand"
            >
              {guilds.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name}
                </option>
              ))}
            </select>
          )}
          {saved && <span className="text-xs text-success">✓ Saved</span>}
          <button
            onClick={save}
            disabled={saving || !guildId}
            className="inline-flex items-center gap-2 rounded-xl bg-brand text-white px-5 py-2.5 text-sm font-semibold shadow-lg shadow-brand/20 hover:shadow-xl hover:shadow-brand/30 transition-all hover:-translate-y-0.5 disabled:opacity-50"
          >
            <Save className="h-4 w-4" />
            {saving ? "Saving…" : "Save"}
          </button>
        </div>
      </div>

      {!guildId && (
        <div className="mt-12 rounded-xl border border-dashed border-border bg-surface-2 p-8 text-center">
          <MessageCircle className="mx-auto h-8 w-8 text-text-secondary" />
          <p className="mt-3 text-sm text-text-secondary">
            Connect Aeris to a Discord server to configure welcome messages.
          </p>
        </div>
      )}

      {guildId && (
        <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Welcome message */}
          <div className="rounded-2xl border border-border bg-surface-2 p-6 space-y-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <span className="text-xl">👋</span> Welcome Message
            </h2>
            <label className="block">
              <span className="text-sm text-text-secondary">Channel ID</span>
              <input
                value={String(settings.channelId ?? "")}
                onChange={(e) => set("channelId", e.target.value)}
                placeholder="e.g. 1234567890123456789"
                className="mt-1 w-full rounded-xl border border-border bg-surface px-4 py-2.5 text-sm outline-none focus:border-brand transition-colors"
              />
            </label>
            <label className="block">
              <span className="text-sm text-text-secondary">
                Welcome message{" "}
                <span className="text-text-muted">
                  (use {"{user}"}, {"{server}"}, {"{mention}"})
                </span>
              </span>
              <textarea
                value={String(settings.message ?? "")}
                onChange={(e) => set("message", e.target.value)}
                rows={3}
                className="mt-1 w-full rounded-xl border border-border bg-surface px-4 py-2.5 text-sm outline-none focus:border-brand transition-colors resize-none"
              />
            </label>
            <label className="block">
              <span className="text-sm text-text-secondary">Auto-assign role ID</span>
              <input
                value={String(settings.autoRoleId ?? "")}
                onChange={(e) => set("autoRoleId", e.target.value)}
                placeholder="Optional role ID"
                className="mt-1 w-full rounded-xl border border-border bg-surface px-4 py-2.5 text-sm outline-none focus:border-brand transition-colors"
              />
            </label>
          </div>

          {/* Goodbye message */}
          <div className="rounded-2xl border border-border bg-surface-2 p-6 space-y-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <span className="text-xl">👋</span> Goodbye Message
            </h2>
            <label className="block">
              <span className="text-sm text-text-secondary">Goodbye channel ID</span>
              <input
                value={String(settings.goodbyeChannelId ?? "")}
                onChange={(e) => set("goodbyeChannelId", e.target.value)}
                placeholder="e.g. 1234567890123456789"
                className="mt-1 w-full rounded-xl border border-border bg-surface px-4 py-2.5 text-sm outline-none focus:border-brand transition-colors"
              />
            </label>
            <label className="block">
              <span className="text-sm text-text-secondary">
                Goodbye message{" "}
                <span className="text-text-muted">(use {"{user}"}, {"{server}"})</span>
              </span>
              <textarea
                value={String(settings.goodbyeMessage ?? "")}
                onChange={(e) => set("goodbyeMessage", e.target.value)}
                rows={3}
                className="mt-1 w-full rounded-xl border border-border bg-surface px-4 py-2.5 text-sm outline-none focus:border-brand transition-colors resize-none"
              />
            </label>
          </div>

          {/* DM Welcome */}
          <div className="rounded-2xl border border-border bg-surface-2 p-6 space-y-4 lg:col-span-2">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <span className="text-xl">💌</span> DM Welcome
            </h2>
            <label className="flex items-center justify-between">
              <span className="text-sm text-text-secondary">
                Send a DM when members join
              </span>
              <button
                onClick={() => set("dmEnabled", !settings.dmEnabled)}
                className={
                  "relative h-6 w-11 rounded-full transition-colors " +
                  (settings.dmEnabled ? "bg-brand" : "bg-border-strong")
                }
              >
                <span
                  className={
                    "absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all " +
                    (settings.dmEnabled ? "left-[22px]" : "left-0.5")
                  }
                />
              </button>
            </label>
            {Boolean(settings.dmEnabled) && (
              <label className="block">
                <span className="text-sm text-text-secondary">
                  DM message{" "}
                  <span className="text-text-muted">(use {"{user}"}, {"{server}"})</span>
                </span>
                <textarea
                  value={String(settings.dmMessage ?? "")}
                  onChange={(e) => set("dmMessage", e.target.value)}
                  rows={3}
                  className="mt-1 w-full rounded-xl border border-border bg-surface px-4 py-2.5 text-sm outline-none focus:border-brand transition-colors resize-none"
                />
              </label>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
