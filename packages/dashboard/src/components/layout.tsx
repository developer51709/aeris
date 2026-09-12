import { NavLink } from "react-router-dom";
import { useEffect, useState } from "react";
import {
  BookOpen,
  LayoutDashboard,
  ListOrdered,
  LogOut,
  Menu,
  Moon,
  Settings,
  Sun,
  Wallet,
} from "lucide-react";
import { cn } from "../lib/utils";
import { authApi } from "../lib/api";

type Theme = "light" | "dark";

export function Layout({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme | null>(null);
  const [mobile, setMobile] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
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

  const links: { to: string; icon: typeof Settings; label: string }[] = [
    { to: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
    { to: "/dashboard/leaderboard", icon: ListOrdered, label: "Leaderboard" },
    { to: "/dashboard/economy", icon: Wallet, label: "Economy" },
    { to: "/dashboard/settings", icon: Settings, label: "Settings" },
    { to: "/docs", icon: BookOpen, label: "Docs" },
  ];

  async function signOut() {
    setLoggingOut(true);
    try {
      await authApi.post("/logout");
    } finally {
      window.location.assign("/auth");
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
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand to-brand-strong flex items-center justify-center text-white text-sm font-bold shadow-sm">
              A
            </div>
            <span>Aeris</span>
          </NavLink>

          <nav className="hidden md:flex items-center gap-1">
            {links.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.to === "/dashboard"}
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
              {loggingOut ? "Signing out…" : "Sign out"}
            </button>
            <button
              className="md:hidden w-9 h-9 rounded-full border border-border bg-surface-2 flex items-center justify-center text-text-secondary hover:text-text-primary hover:border-border-strong transition-colors"
              onClick={() => setMobile((m) => !m)}
              aria-label="Toggle menu"
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
                end={link.to === "/dashboard"}
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
          </nav>
        )}
      </header>

      <main className="flex-1">
        <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">{children}</div>
      </main>

      <footer className="border-t border-border py-4 px-4 md:px-6 text-xs text-text-secondary text-center">
        Aeris · Discord Bot · Made with care
      </footer>
    </div>
  );
}
