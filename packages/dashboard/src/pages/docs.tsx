import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Search, BookOpen, Shield, Zap, Bot, Music, Ticket, ArrowLeft, FileText } from "lucide-react";

interface DocEntry {
  id: string;
  title: string;
  category: string;
  content: string;
}

const DOCS: DocEntry[] = [
  {
    id: "getting-started",
    title: "Getting Started with Aeris",
    category: "Basics",
    content:
      "1. Invite Aeris using the button on the dashboard.\n2. Run /bot info to confirm the bot is online.\n3. Use /automod enable, /welcome channel and /leveling profile to configure features.\n4. Each module can also be configured from the dashboard settings page.",
  },
  {
    id: "inviting",
    title: "Inviting the Bot",
    category: "Basics",
    content:
      "Use the Launch Aeris button, sign in with Discord, and select a server you manage. Aeris requires Manage Server permission to be added. Recommended permissions: Administrator (for full feature set) or manually grant Manage Roles, Manage Channels, Kick, Ban, and Manage Messages.",
  },
  {
    id: "automod-setup",
    title: "Setting Up Automod",
    category: "Automod",
    content:
      "Run /automod enable with the toggles you want. Add words with /automod wordfilter and domains with /automod linkfilter. Spam detection rate-limits repeated messages; raid protection throttles mass joins.",
  },
  {
    id: "permission-errors",
    title: "Fixing Permission Errors",
    category: "Troubleshooting",
    content:
      "If Aeris says 'Missing Permissions': 1) Check the bot's role is above the roles it manages. 2) Verify channel-level permission overwrites aren't blocking it. 3) For ban/kick, Aeris's role must be higher than the target member. 4) Re-invite with Administrator if problems persist.",
  },
  {
    id: "leveling",
    title: "Leveling System",
    category: "Leveling",
    content:
      "Members earn XP for activity. Use /leveling profile to see your card, /leveling leaderboard for the top 10. Customize the level-up message with the dashboard; placeholders {user} and {level} are supported.",
  },
  {
    id: "economy",
    title: "Economy & Shop",
    category: "Economy",
    content:
      "/economy balance, /economy daily for a 24h reward, /economy work for random earnings, /economy pay to transfer, /blackjack to gamble, and /shop to buy items. Admins manage shop items from the dashboard.",
  },
  {
    id: "music",
    title: "Music Playback",
    category: "Music",
    content:
      "Join a voice channel and use /music play <query>. Queue with /music queue, skip with /music skip, stop everything with /music stop. If playback fails, verify the bot has Connect and Speak permissions.",
  },
  {
    id: "tickets",
    title: "Ticket System",
    category: "Tickets",
    content:
      "Run /ticket setup in a support channel to create a panel. Members click the button to open a private channel; staff close tickets with /ticket close. Transcripts can be enabled in the dashboard.",
  },
  {
    id: "welcome",
    title: "Welcome Messages & DMs",
    category: "Welcome",
    content:
      "/welcome channel #general sets the destination. /welcome message customizes the text ({user}, {server}, {mention}). /welcome dm true sends a greeting DM. Auto-role assignment can be set from the dashboard.",
  },
  {
    id: "voicemaster",
    title: "Voicemaster",
    category: "Voice",
    content:
      "Join a voice channel and use /voice lock, /voice unlock, /voice limit <n>, or /voice name <text> to control your own temporary channel.",
  },
];

const CATEGORIES = [
  { name: "All", icon: BookOpen },
  { name: "Basics", icon: FileText },
  { name: "Automod", icon: Shield },
  { name: "Leveling", icon: Zap },
  { name: "Economy", icon: Bot },
  { name: "Music", icon: Music },
  { name: "Tickets", icon: Ticket },
  { name: "Troubleshooting", icon: Shield },
];

export function DocsPage() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");
  const [selected, setSelected] = useState<DocEntry | null>(null);
  const navigate = useNavigate();

  const filtered = DOCS.filter((doc) => {
    const matchesQuery =
      query === "" ||
      doc.title.toLowerCase().includes(query.toLowerCase()) ||
      doc.content.toLowerCase().includes(query.toLowerCase());
    const matchesCategory = category === "All" || doc.category === category;
    return matchesQuery && matchesCategory;
  });

  if (selected) {
    return (
      <div className="min-h-screen px-4 md:px-6 max-w-3xl mx-auto py-10">
        <button
          onClick={() => setSelected(null)}
          className="inline-flex items-center gap-2 text-sm text-text-secondary hover:text-brand transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> All articles
        </button>
        <h1 className="mt-4 text-3xl font-bold">{selected.title}</h1>
        <p className="mt-1 text-xs uppercase tracking-wide text-brand">{selected.category}</p>
        <div className="mt-6 rounded-xl border border-border bg-surface-2 p-6 whitespace-pre-wrap text-sm leading-relaxed">
          {selected.content}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen px-4 md:px-6 max-w-6xl mx-auto py-10">
      <button
        onClick={() => navigate("/")}
        className="inline-flex items-center gap-2 text-sm text-text-secondary hover:text-brand transition-colors"
      >
        <ArrowLeft className="h-4 w-4" /> Back home
      </button>

      <h1 className="mt-4 text-3xl font-bold tracking-tight">Documentation</h1>
      <p className="mt-1 text-text-secondary">Everything you need to set up and troubleshoot Aeris.</p>

      <div className="mt-6 relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-secondary" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search docs — try 'permission errors' or 'blackjack'…"
          className="w-full rounded-xl border border-border bg-surface-2 pl-10 pr-4 py-3 text-sm outline-none focus:border-brand transition-colors"
        />
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.name}
            onClick={() => setCategory(cat.name)}
            className={
              "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium border transition-colors " +
              (category === cat.name
                ? "bg-brand/10 text-brand border-brand/40"
                : "bg-surface-2 text-text-secondary border-border hover:text-text-primary hover:border-border-strong")
            }
          >
            <cat.icon className="h-3.5 w-3.5" />
            {cat.name}
          </button>
        ))}
      </div>

      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-3">
        {filtered.map((doc) => (
          <button
            key={doc.id}
            onClick={() => setSelected(doc)}
            className="text-left rounded-xl border border-border bg-surface-2 p-5 transition-all hover:border-brand/50 hover:shadow-lg hover:shadow-brand/5"
          >
            <p className="text-xs uppercase tracking-wide text-brand">{doc.category}</p>
            <h3 className="mt-1 font-semibold">{doc.title}</h3>
            <p className="mt-2 text-sm text-text-secondary line-clamp-2">{doc.content.split("\n")[0]}</p>
          </button>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="mt-10 rounded-xl border border-dashed border-border p-8 text-center text-text-secondary">
          No articles matched “{query}”. Try a different search term.
        </div>
      )}

      <div className="mt-12 text-center">
        <Link to="/login" className="text-sm text-brand hover:underline">
          Ready to launch Aeris? Sign in →
        </Link>
      </div>
    </div>
  );
}
