import { useEffect, useState } from "react";
import { api, ApiError } from "../lib/api";
import { Save, Shield, Zap, Wallet, Ticket, RefreshCw } from "lucide-react";

type Section = "automod" | "leveling" | "economy" | "tickets";
type Guild = { id: string; name?: string | null };

const SECTIONS: { key: Section; label: string; icon: typeof Shield }[] = [
  { key: "automod", label: "Automod", icon: Shield },
  { key: "leveling", label: "Leveling", icon: Zap },
  { key: "economy", label: "Economy", icon: Wallet },
  { key: "tickets", label: "Tickets", icon: Ticket },
];

export function GuildSettings() {
  const [guilds, setGuilds] = useState<Guild[]>([]);
  const [guildId, setGuildId] = useState("");
  const [section, setSection] = useState<Section>("automod");
  const [settings, setSettings] = useState<Record<string, unknown>>({});
  const [loading, setLoading] = useState(true);
  const [loadingSettings, setLoadingSettings] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

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
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!guildId) {
      setSettings({});
      return;
    }
    let cancelled = false;
    setLoadingSettings(true);
    setSaveError(null);
    setSaved(false);
    setSettings({});
    api
      .get(`/settings/${guildId}/${section}`)
      .then((data) => {
        if (!cancelled) setSettings((data ?? {}) as Record<string, unknown>);
      })
      .catch((cause) => {
        if (!cancelled) {
          setSaveError(cause instanceof ApiError ? cause.message : "Could not load these settings.");
        }
      })
      .finally(() => {
        if (!cancelled) setLoadingSettings(false);
      });
    return () => {
      cancelled = true;
    };
  }, [guildId, section]);

  async function save() {
    if (!guildId || saving || loadingSettings) return;
    setSaving(true);
    setSaveError(null);
    setSaved(false);
    try {
      const result = await api.put(`/settings/${guildId}/${section}`, settings);
      setSettings((result ?? settings) as Record<string, unknown>);
      setSaved(true);
      window.setTimeout(() => setSaved(false), 2500);
    } catch (cause) {
      setSaveError(cause instanceof ApiError ? cause.message : "Could not save these settings.");
    } finally {
      setSaving(false);
    }
  }

  function set(key: string, value: unknown) {
    setSettings((current) => ({ ...current, [key]: value }));
    setSaved(false);
  }

  function TextField({ label, k, multiline = false }: { label: string; k: string; multiline?: boolean }) {
    const value = String(settings[k] ?? "");
    return (
      <label className="block">
        <span className="text-sm font-medium text-text-secondary">{label}</span>
        {multiline ? (
          <textarea
            value={value}
            onChange={(event) => set(k, event.target.value)}
            rows={3}
            className="mt-1.5 w-full resize-y rounded-lg border border-border bg-surface-raised px-3 py-2 text-sm outline-none transition-colors focus:border-brand"
          />
        ) : (
          <input
            value={value}
            onChange={(event) => set(k, event.target.value)}
            className="mt-1.5 w-full rounded-lg border border-border bg-surface-raised px-3 py-2 text-sm outline-none transition-colors focus:border-brand"
          />
        )}
      </label>
    );
  }

  function NumberField({ label, k }: { label: string; k: string }) {
    return (
      <label className="block">
        <span className="text-sm font-medium text-text-secondary">{label}</span>
        <input
          type="number"
          min={0}
          value={settings[k] === undefined ? "" : String(settings[k])}
          onChange={(event) =>
            set(k, event.target.value === "" ? "" : Number(event.target.value))
          }
          className="mt-1.5 w-full rounded-lg border border-border bg-surface-raised px-3 py-2 text-sm outline-none transition-colors focus:border-brand"
        />
      </label>
    );
  }

  function ToggleField({ label, k }: { label: string; k: string }) {
    const enabled = settings[k] === true;
    return (
      <label className="flex items-center justify-between gap-4 rounded-lg border border-border/70 bg-surface-raised/50 px-3 py-3">
        <span className="text-sm font-medium text-text-secondary">{label}</span>
        <button
          type="button"
          onClick={() => set(k, !enabled)}
          className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${
            enabled ? "bg-brand" : "bg-border-strong"
          }`}
          aria-label={label}
          aria-pressed={enabled}
        >
          <span
            className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-all ${
              enabled ? "left-[22px]" : "left-0.5"
            }`}
          />
        </button>
      </label>
    );
  }

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-brand border-t-transparent" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto mt-10 max-w-lg rounded-2xl border border-danger/30 bg-danger/5 p-8 text-center">
        <RefreshCw className="mx-auto h-7 w-7 text-danger" />
        <h1 className="mt-4 text-xl font-semibold">Settings are unavailable</h1>
        <p className="mt-2 text-sm text-text-secondary">{error}</p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="mt-5 inline-flex items-center gap-2 rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white"
        >
          <RefreshCw className="h-4 w-4" /> Try again
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-brand">Server configuration</p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight">Settings</h1>
          <p className="mt-1 text-sm text-text-secondary">
            Configure Aeris modules for your server
          </p>
        </div>
        <div className="flex items-center gap-3">
          {saved && <span className="text-sm font-medium text-success">Saved</span>}
          <button
            type="button"
            onClick={save}
            disabled={saving || loadingSettings || !guildId}
            className="inline-flex items-center gap-2 rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-strong disabled:opacity-50"
          >
            <Save className="h-4 w-4" />
            {saving ? "Saving…" : "Save changes"}
          </button>
        </div>
      </div>

      {guilds.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-dashed border-border-strong p-8 text-center text-sm text-text-secondary">
          No managed servers were found.
        </div>
      ) : (
        <>
          <div className="mt-6 max-w-xl">
            <label className="block text-sm font-medium text-text-secondary">
              Server
              <select
                value={guildId}
                onChange={(event) => setGuildId(event.target.value)}
                className="mt-1.5 w-full rounded-lg border border-border bg-surface-raised px-3 py-2.5 text-sm font-medium outline-none focus:border-brand"
              >
                {guilds.map((guild) => (
                  <option key={guild.id} value={guild.id}>
                    {guild.name ?? guild.id}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="mt-5 flex flex-wrap gap-2" role="tablist" aria-label="Settings sections">
            {SECTIONS.map((item) => (
              <button
                key={item.key}
                type="button"
                role="tab"
                aria-selected={section === item.key}
                onClick={() => setSection(item.key)}
                className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
                  section === item.key
                    ? "border-brand/40 bg-brand/10 text-brand"
                    : "border-border bg-surface-2 text-text-secondary hover:border-border-strong hover:text-text-primary"
                }`}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </button>
            ))}
          </div>

          <div className="mt-5 max-w-2xl rounded-2xl border border-border bg-surface-2 p-5 sm:p-6">
            {loadingSettings ? (
              <div className="flex min-h-48 items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand border-t-transparent" />
              </div>
            ) : (
              <div className="space-y-3">
                {section === "automod" && (
                  <>
                    <ToggleField label="Spam detection" k="spamEnabled" />
                    <ToggleField label="Raid protection" k="raidEnabled" />
                    <ToggleField label="Block Discord invites" k="blockInvites" />
                    <div className="grid gap-3 sm:grid-cols-2">
                      <NumberField label="Max links per message" k="maxLinks" />
                      <NumberField label="Max emotes per message" k="maxEmotes" />
                    </div>
                  </>
                )}
                {section === "leveling" && (
                  <>
                    <ToggleField label="Leveling enabled" k="enabled" />
                    <TextField label="XP message" k="xpMessage" multiline />
                    <TextField label="Level-up message" k="levelUpMessage" multiline />
                    <TextField label="Auto role ID" k="autoRole" />
                  </>
                )}
                {section === "economy" && (
                  <>
                    <ToggleField label="Economy enabled" k="enabled" />
                    <div className="grid gap-3 sm:grid-cols-2">
                      <NumberField label="Daily reward amount" k="dailyAmount" />
                      <NumberField label="Minimum cash" k="minCash" />
                    </div>
                  </>
                )}
                {section === "tickets" && (
                  <>
                    <TextField label="Panel channel ID" k="channelId" />
                    <TextField label="Ticket category ID" k="categoryId" />
                    <ToggleField label="Enable transcripts" k="transcriptEnabled" />
                  </>
                )}
              </div>
            )}
            {saveError && (
              <p className="mt-4 rounded-lg border border-danger/30 bg-danger/5 px-3 py-2 text-sm text-danger">
                {saveError}
              </p>
            )}
          </div>
        </>
      )}
    </div>
  );
}