import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { Activity, Bot, Code, Music, Shield, Ticket, Zap, ArrowRight, CheckCircle, ChevronRight } from "lucide-react";
import { api } from "../lib/api";

export function LandingPage() {
  const [botAvatar, setBotAvatar] = useState<string | null>(null);

  useEffect(() => {
    api.get("/bot-profile").then((data) => {
      const profile = data as { avatarUrl?: string | null };
      setBotAvatar(profile.avatarUrl ?? null);
    }).catch(() => {
      // Keep the branded fallback if Discord is temporarily unavailable.
    });
  }, []);

  function BotLogo({ className }: { className: string }) {
    return botAvatar ? (
      <img
        src={botAvatar}
        alt="Aeris bot"
        className={`${className} object-cover`}
        onError={() => setBotAvatar(null)}
      />
    ) : (
      <div className={`${className} flex items-center justify-center bg-gradient-to-br from-brand to-brand-strong text-white font-bold`}>
        A
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <nav className="sticky top-0 z-50 border-b border-border bg-surface/80 backdrop-blur supports-backdrop-blur:bg-surface/60">
        <div className="flex items-center justify-between px-4 md:px-6 max-w-6xl mx-auto">
          <Link to="/" className="flex items-center gap-3 text-lg font-semibold tracking-tight">
            <BotLogo className="h-8 w-8 rounded-lg text-sm shadow-sm" />
            <span>Aeris</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link
              to="/docs"
              className="text-sm text-text-secondary hover:text-brand transition-colors"
            >
              Docs
            </Link>
            <Link
              to="/login"
              className="inline-flex items-center gap-1 rounded-lg bg-brand/10 text-brand px-3 py-1.5 text-sm font-medium hover:bg-brand/20 transition-colors border border-border-strong"
            >
              Dashboard
              <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </nav>

      <section className="flex-1 flex flex-col">
        <div className="w-full py-16 px-4 md:px-6 max-w-6xl mx-auto flex flex-col items-center text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-brand/30 bg-brand/5 px-4 py-1.5 text-xs font-medium text-brand mb-6">
            <Activity className="h-4 w-4" />
            Discord bot built for aesthetics and control
          </div>
          <h1 className="text-5xl md:text-6xl font-bold tracking-tight leading-tight max-w-3xl">
            The Discord bot with{" "}
            <span className="bg-gradient-to-r from-brand to-brand-strong bg-clip-text text-transparent">
              clean CV2 interfaces
            </span>
          </h1>
          <p className="mt-5 text-lg text-text-secondary max-w-2xl">
            Automod, leveling, economy, music, voicemaster, tickets, and
            welcome messages — all surfaced through a minimal dashboard and
            search-powered docs.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link
              to="/login"
              className="inline-flex items-center gap-2 rounded-xl bg-brand text-white px-6 py-3 text-base font-semibold shadow-lg shadow-brand/20 hover:shadow-xl hover:shadow-brand/30 transition-all hover:-translate-y-0.5"
            >
              Launch Aeris
              <ArrowRight className="h-5 w-5" />
            </Link>
            <Link
              to="/docs"
              className="inline-flex items-center gap-2 rounded-xl border border-border-strong bg-surface-2 text-text-primary px-6 py-3 text-base font-semibold hover:bg-surface transition-all"
            >
              Read the docs
            </Link>
          </div>
        </div>

        <div className="px-4 md:px-6 max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { icon: Shield, title: "Automod", text: "Word filters, link filters, spam detection, and raid protection." },
              { icon: Zap, title: "Leveling", text: "XP tracking, level-up image cards, role rewards, and leaderboards." },
              { icon: Bot, title: "Economy", text: "Daily rewards, work, shop, inventory, blackjack, and trades." },
            ].map((item) => (
              <div
                key={item.title}
                className="group rounded-xl border border-border bg-surface-2 p-5 transition-all hover:border-border-strong hover:shadow-lg hover:shadow-brand/5"
              >
                <div className="flex items-start justify-between">
                  <div className="rounded-lg bg-brand/10 p-2.5 text-brand">
                    <item.icon className="h-6 w-6" />
                  </div>
                  <div className="opacity-0 translate-y-1 transition-all group-hover:opacity-100 group-hover:translate-y-0">
                    <ChevronRight className="h-5 w-5 text-brand" />
                  </div>
                </div>
                <h3 className="mt-4 text-lg font-semibold">{item.title}</h3>
                <p className="mt-1 text-sm text-text-secondary">{item.text}</p>
              </div>
            ))}
          </div>
          <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { icon: Music, title: "Music", text: "Voice playback with queue management and now-playing." },
              { icon: Ticket, title: "Tickets", text: "Ticket creation, transcripts, staff assignment, and close/archive." },
              { icon: Code, title: "Docs Center", text: "Search-powered documentation for setup, permissions, and troubleshooting." },
            ].map((item) => (
              <div
                key={item.title}
                className="group rounded-xl border border-border bg-surface-2 p-5 transition-all hover:border-border-strong hover:shadow-lg hover:shadow-brand/5"
              >
                <div className="flex items-start justify-between">
                  <div className="rounded-lg bg-brand/10 p-2.5 text-brand">
                    <item.icon className="h-6 w-6" />
                  </div>
                  <div className="opacity-0 translate-y-1 transition-all group-hover:opacity-100 group-hover:translate-y-0">
                    <ChevronRight className="h-5 w-5 text-brand" />
                  </div>
                </div>
                <h3 className="mt-4 text-lg font-semibold">{item.title}</h3>
                <p className="mt-1 text-sm text-text-secondary">{item.text}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="py-16 px-4 md:px-6 max-w-6xl mx-auto">
          <div className="rounded-2xl border border-border bg-surface-2 p-6 md:p-10 shadow-sm">
            <div className="flex flex-col md:flex-row items-center gap-8">
              <BotLogo className="h-28 w-28 md:h-36 md:w-36 rounded-2xl text-3xl shadow-lg flex-shrink-0" />
              <div className="text-center md:text-left">
                <h2 className="text-2xl font-bold">Built for a clean aesthetic</h2>
                <p className="mt-2 text-text-secondary">
                  CV2 containers, minimal cards, and a dashboard that stays out of
                  your way while still giving you full control.
                </p>
                <ul className="mt-5 space-y-2 text-left">
                  {[
                    "Discord Components v2 containers instead of legacy embeds",
                    "Image cards for levelup, leaderboard, economy, and blackjack",
                    "Light and dark themes that respect your system preference",
                    "Search-powered documentation center",
                  ].map((item) => (
                    <li key={item} className="flex items-center gap-2 text-sm text-text-secondary">
                      <CheckCircle className="h-4 w-4 text-success shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-border py-6 px-4 md:px-6 text-center text-sm text-text-secondary">
        Aeris · A feature-rich Discord bot with an integrated dashboard
      </footer>
    </div>
  );
}
