import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { api, ApiError } from "../lib/api";
import { Save, Shield, Zap, Wallet, Ticket, RefreshCw, ArrowLeft, Settings, Languages } from "lucide-react";
import { LOCALE_LABELS, SUPPORTED_LOCALES, useI18n } from "../i18n";

type Section = "language" | "automod" | "leveling" | "economy" | "tickets";
type Guild = { id: string; name?: string | null };

const SECTIONS: { key: Section; label: string; icon: typeof Shield }[] = [
  { key: "language", label: "Language", icon: Languages },
  { key: "automod", label: "Automod", icon: Shield },
  { key: "leveling", label: "Leveling", icon: Zap },
  { key: "economy", label: "Economy", icon: Wallet },
  { key: "tickets", label: "Tickets", icon: Ticket },
];

export function GuildSettings() {
  const { guildId } = useParams<{ guildId: string }>();
  const [guild, setGuild] = useState<Guild | null>(null);
  const [section, setSection] = useState<Section>("automod");
  const [settings, setSettings] = useState<Record<string, unknown>>({});
  const [loadingGuild, setLoadingGuild] = useState(true);
  const [loadingSettings, setLoadingSettings] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const { t } = useI18n();

  // Fetch guild info
  useEffect(() => {
    if (!guildId) return;
    let cancelled = false;
    setLoadingGuild(true);
    api
      .get(`/guilds/${guildId}`)
      .then((data) => {
        if (!cancelled) setGuild(data as Guild);
      })
      .catch((cause) => {
        if (!cancelled) {
          setError(cause instanceof ApiError ? cause.message : "Could not load server.");
        }
      })
      .finally(() => {
        if (!cancelled) setLoadingGuild(false);
      });
    return () => { cancelled = true; };
  }, [guildId]);

  // Fetch settings when section changes
  useEffect(() => {
    if (!guildId) return;
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
    return () => { cancelled = true; };
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

  if (loadingGuild) {
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
        <Link
          to="/dashboard/guilds"
          className="mt-5 inline-flex items-center gap-2 rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white"
        >
          <ArrowLeft className="h-4 w-4" /> Back to servers
        </Link>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Link
            to="/dashboard/guilds"
            className="inline-flex items-center gap-1.5 text-sm text-text-secondary hover:text-brand transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> {t.backToServers}
          </Link>
          <div className="mt-2 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand/10 text-brand">
              <Settings className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">{guild?.name ?? guildId}</h1>
              <p className="text-sm text-text-secondary">{t.serverConfiguration}</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {saved && <span className="text-sm font-medium text-success">{t.saved}</span>}
          <button
            type="button"
            onClick={save}
            disabled={saving || loadingSettings || !guildId}
            className="inline-flex items-center gap-2 rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-strong disabled:opacity-50"
          >
            <Save className="h-4 w-4" />
            {saving ? t.saving : t.saveChanges}
          </button>
        </div>
      </div>

      {/* Section tabs */}
      <div className="mt-6 flex flex-wrap gap-2" role="tablist" aria-label="Settings sections">
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

      {/* Settings content */}
      <div className="mt-5 max-w-2xl rounded-2xl border border-border bg-surface-2 p-5 sm:p-6">
        {loadingSettings ? (
          <div className="flex min-h-48 items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand border-t-transparent" />
          </div>
        ) : (
          <div className="space-y-3">
            {section === "language" && (
              <div className="space-y-4">
                <div>
                  <h2 className="text-lg font-semibold">{t.botLanguage}</h2>
                  <p className="mt-1 text-sm text-text-secondary">{t.botLanguageDescription}</p>
                </div>
                <label className="block">
                  <span className="text-sm font-medium text-text-secondary">{t.selectLanguage}</span>
                  <select
                    value={String(settings.locale ?? "en")}
                    onChange={(event) => set("locale", event.target.value)}
                    className="mt-1.5 w-full rounded-lg border border-border bg-surface-raised px-3 py-2 text-sm outline-none focus:border-brand"
                  >
                    {SUPPORTED_LOCALES.map((locale) => <option key={locale} value={locale}>{LOCALE_LABELS[locale]}</option>)}
                  </select>
                </label>
                <p className="rounded-lg border border-brand/20 bg-brand/5 px-3 py-2 text-sm text-text-secondary">{t.languageDescription}</p>
              </div>
            )}
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
    </div>
  );
}
