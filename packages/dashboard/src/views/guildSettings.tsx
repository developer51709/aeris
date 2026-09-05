import { useEffect, useState } from "react";
import { api } from "../lib/api";
import { Save, Shield, Zap, Wallet, Ticket } from "lucide-react";

type Section = "automod" | "leveling" | "economy" | "tickets";

const SECTIONS: { key: Section; label: string; icon: typeof Shield }[] = [
  { key: "automod", label: "Automod", icon: Shield },
  { key: "leveling", label: "Leveling", icon: Zap },
  { key: "economy", label: "Economy", icon: Wallet },
  { key: "tickets", label: "Tickets", icon: Ticket },
];

export function GuildSettings() {
  const [guildId, setGuildId] = useState("");
  const [section, setSection] = useState<Section>("automod");
  const [settings, setSettings] = useState<Record<string, unknown>>({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    api
      .get("/guilds")
      .then((data) => {
        const guilds = data as { id: string }[];
        if (guilds.length > 0) {
          setGuildId(guilds[0].id);
        }
      })
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    if (!guildId) return;
    api
      .get(`/settings/${guildId}/${section}`)
      .then((data) => setSettings((data ?? {}) as Record<string, unknown>))
      .catch(() => setSettings({}));
  }, [guildId, section]);

  async function save() {
    if (!guildId) return;
    setSaving(true);
    try {
      await api.put(`/settings/${guildId}/${section}`, settings);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally {
      setSaving(false);
    }
  }

  function set(key: string, value: unknown) {
    setSettings((s) => ({ ...s, [key]: value }));
  }

  function TextField({ label, k }: { label: string; k: string }) {
    return (
      <label className="block">
        <span className="text-sm text-text-secondary">{label}</span>
        <input
          value={String(settings[k] ?? "")}
          onChange={(e) => set(k, e.target.value)}
          className="mt-1 w-full rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm outline-none focus:border-brand"
        />
      </label>
    );
  }

  function NumberField({ label, k }: { label: string; k: string }) {
    return (
      <label className="block">
        <span className="text-sm text-text-secondary">{label}</span>
        <input
          type="number"
          value={Number(settings[k] ?? 0)}
          onChange={(e) => set(k, Number(e.target.value))}
          className="mt-1 w-full rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm outline-none focus:border-brand"
        />
      </label>
    );
  }

  function ToggleField({ label, k }: { label: string; k: string }) {
    return (
      <label className="flex items-center justify-between">
        <span className="text-sm text-text-secondary">{label}</span>
        <button
          onClick={() => set(k, !settings[k])}
          className={
            "relative h-6 w-11 rounded-full transition-colors " +
            (settings[k] ? "bg-brand" : "bg-border-strong")
          }
          aria-label={label}
        >
          <span
            className={
              "absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all " +
              (settings[k] ? "left-[22px]" : "left-0.5")
            }
          />
        </button>
      </label>
    );
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold">Settings</h1>
          <p className="text-sm text-text-secondary">Configure Aeris modules for your server</p>
        </div>
        <div className="flex items-center gap-2">
          {saved && <span className="text-xs text-success">✓ Saved</span>}
          <button
            onClick={save}
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-lg bg-brand text-white px-4 py-2 text-sm font-medium hover:bg-brand-dark transition-colors disabled:opacity-50"
          >
            <Save className="h-4 w-4" />
            {saving ? "Saving…" : "Save"}
          </button>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        {SECTIONS.map((s) => (
          <button
            key={s.key}
            onClick={() => setSection(s.key)}
            className={
              "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium border transition-colors " +
              (section === s.key
                ? "bg-brand/10 text-brand border-brand/40"
                : "bg-surface-2 text-text-secondary border-border hover:text-text-primary")
            }
          >
            <s.icon className="h-4 w-4" />
            {s.label}
          </button>
        ))}
      </div>

      <div className="mt-6 rounded-xl border border-border bg-surface-2 p-6 space-y-4 max-w-xl">
        {section === "automod" && (
          <>
            <ToggleField label="Spam detection" k="spamEnabled" />
            <ToggleField label="Raid protection" k="raidEnabled" />
            <ToggleField label="Block Discord invites" k="blockInvites" />
            <NumberField label="Max links per message" k="maxLinks" />
            <NumberField label="Max emotes per message" k="maxEmotes" />
          </>
        )}
        {section === "leveling" && (
          <>
            <ToggleField label="Leveling enabled" k="enabled" />
            <TextField label="XP message" k="xpMessage" />
            <TextField label="Level-up message" k="levelUpMessage" />
            <TextField label="Auto role ID" k="autoRole" />
          </>
        )}
        {section === "economy" && (
          <>
            <ToggleField label="Economy enabled" k="enabled" />
            <NumberField label="Daily reward amount" k="dailyAmount" />
            <NumberField label="Minimum cash" k="minCash" />
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
    </div>
  );
}
