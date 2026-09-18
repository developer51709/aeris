import { NavLink } from "react-router-dom";
import { useEffect, useState } from "react";
import {
  BookOpen,
  Gamepad2,
  LayoutDashboard,
  LogOut,
  Menu,
  Moon,
  Languages,
  Settings,
  Sun,
} from "lucide-react";
import { cn } from "../lib/utils";
import { api, authApi } from "../lib/api";
import { LOCALE_LABELS, SUPPORTED_LOCALES, useI18n } from "../i18n";

type Theme = "light" | "dark";

export function Layout({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme | null>(null);
  const [mobile, setMobile] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [botAvatar, setBotAvatar] = useState<string | null>(null);
  const [languageOpen, setLanguageOpen] = useState(false);
  const { locale, setLocale, t } = useI18n();

  useEffect(() => {
    api.get("/bot-profile").then((data) => {
      const profile = data as { avatarUrl?: string | null };
      setBotAvatar(profile.avatarUrl ?? null);
    }).catch(() => {
      // The letter fallback keeps the shell usable if Discord is unavailable.
    });
  }, []);
  const prefersDark =
    typeof window !== "undefined"
      ? window.matchMedia("(prefers-color-scheme: dark)").matches
      : false;

  useEffect(() => {
    const stored =
      typeof window !== "undefined" ? window.localStorage?.getItem("aeris-theme") : null;

    if (stored === "light") {
      setTheme("light");
    } else if (stored === "dark") {
      setTheme("dark");
    } else {
      setTheme(prefersDark ? "dark" : "light");
    }
  }, []);

  useEffect(() => {
    if (theme === null) return;
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  function applyTheme(next: Theme) {
    setTheme(next);
    window.localStorage?.setItem("aeris-theme", next);
  }

  const links: { to: string; icon: typeof Settings; label: string; end?: boolean }[] = [
    { to: "/dashboard", icon: LayoutDashboard, label: t.overview, end: true },
    { to: "/dashboard/guilds", icon: Settings, label: t.servers },
    { to: "/dashboard/integrations", icon: Gamepad2, label: t.integrations },
    { to: "/docs", icon: BookOpen, label: t.docs },
  ];

  async function signOut() {
    setLoggingOut(true);
    try {
      await authApi.post("/logout");
    } finally {
      window.location.assign("/login");
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-50 border-b border-border bg-surface/80 backdrop-blur supports-backdrop-blur:bg-surface/60">
        <div className="flex items-center justify-between px-4 md:px-6">
          <NavLink
            to="/dashboard"
            className="flex items-center gap-3 text-lg font-semibold tracking-tight"
          >
            {botAvatar ? (
              <img
                src={botAvatar}
                alt="Aeris bot"
                className="h-8 w-8 rounded-lg object-cover shadow-sm"
                onError={() => setBotAvatar(null)}
              />
            ) : (
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand to-brand-strong flex items-center justify-center text-white text-sm font-bold shadow-sm">
                A
              </div>
            )}
            <span>Aeris</span>
          </NavLink>

          <nav className="hidden md:flex items-center gap-1">
            {links.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.end}
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                    isActive
                      ? "bg-brand/10 text-brand"
                      : "text-text-secondary hover:text-text-primary hover:bg-surface-2",
                  )
                }
              >
                <link.icon className="h-4 w-4" />
                {link.label}
              </NavLink>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <button
              className="w-9 h-9 rounded-full border border-border bg-surface-2 flex items-center justify-center text-text-secondary hover:text-text-primary hover:border-border-strong transition-colors"
              onClick={() => {
                if (theme === "dark" || (theme === null && !prefersDark)) {
                  applyTheme("light");
                } else {
                  applyTheme("dark");
                }
              }}
              aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} theme`}
            >
              {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
            <button
              type="button"
              onClick={signOut}
              disabled={loggingOut}
              className="hidden sm:inline-flex items-center gap-1.5 text-sm text-text-secondary hover:text-brand transition-colors disabled:opacity-60"
            >
              <LogOut className="h-4 w-4" />
              {loggingOut ? t.signingOut : t.signOut}
            </button>
            <button
              className="md:hidden w-9 h-9 rounded-full border border-border bg-surface-2 flex items-center justify-center text-text-secondary hover:text-text-primary hover:border-border-strong transition-colors"
              onClick={() => setMobile((m) => !m)}
              aria-label={t.toggleMenu}
            >
              <Menu className="h-5 w-5" />
            </button>
          </div>
        </div>

        {mobile && (
          <nav className="md:hidden pb-3 flex flex-col gap-1 px-4">
            {links.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.end}
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                    isActive
                      ? "bg-brand/10 text-brand"
                      : "text-text-secondary hover:text-text-primary hover:bg-surface-2",
                  )
                }
                onClick={() => setMobile(false)}
              >
                <link.icon className="h-4 w-4" />
                {link.label}
              </NavLink>
            ))}
            <button
              type="button"
              onClick={signOut}
              disabled={loggingOut}
              className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-text-secondary hover:text-brand hover:bg-surface-2 transition-colors disabled:opacity-60"
            >
              <LogOut className="h-4 w-4" />
              {loggingOut ? t.signingOut : t.signOut}
            </button>
          </nav>
        )}
      </header>

      <main className="flex-1">
        <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">{children}</div>
      </main>

      <footer className="relative border-t border-border py-4 px-4 md:px-6 text-xs text-text-secondary">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3">
          <span>{t.madeWithCare}</span>
          <div className="relative">
            <button
              type="button"
              onClick={() => setLanguageOpen((open) => !open)}
              aria-expanded={languageOpen}
              aria-label={t.chooseLanguage}
              className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface-2 px-2.5 py-1.5 text-text-secondary transition-colors hover:border-brand hover:text-brand"
            >
              <Languages className="h-3.5 w-3.5" />
              <span>{LOCALE_LABELS[locale]}</span>
            </button>
            {languageOpen && (
              <div className="absolute bottom-full right-0 z-50 mb-2 min-w-40 rounded-xl border border-border bg-surface-raised p-1.5 text-left shadow-lg">
                <p className="px-2.5 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-text-secondary">{t.language}</p>
                {SUPPORTED_LOCALES.map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => { setLocale(item); setLanguageOpen(false); }}
                    className={cn("block w-full rounded-lg px-2.5 py-2 text-left text-sm transition-colors hover:bg-brand/10 hover:text-brand", locale === item && "bg-brand/10 text-brand font-semibold")}
                  >
                    {LOCALE_LABELS[item]}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </footer>
    </div>
  );
}
