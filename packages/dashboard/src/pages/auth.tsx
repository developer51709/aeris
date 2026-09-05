import { useEffect, useState } from "react";
import { api } from "../lib/api";
import { Bot, ArrowRight } from "lucide-react";

export function AuthPage() {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    api.get("/auth/me").then((data) => {
      setUser(data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!loading && user?.id) {
      window.location.href = "/dashboard";
    }
  }, [loading, user]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-brand border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface px-4">
      <div className="w-full max-w-md rounded-2xl border border-border bg-surface-2 p-8 shadow-sm">
        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-brand to-brand-dark flex items-center justify-center text-white text-2xl font-bold shadow-lg">
            A
          </div>
          <h1 className="mt-4 text-2xl font-bold">Connect to Aeris</h1>
          <p className="mt-1 text-sm text-text-secondary">
            Sign in with Discord to access your dashboard
          </p>
        </div>

        <a
          href="/auth/discord"
          className="group flex w-full items-center justify-center gap-2 rounded-xl bg-brand text-white px-5 py-3 text-base font-semibold shadow-lg shadow-brand/20 hover:shadow-xl hover:shadow-brand/30 transition-all hover:-translate-y-0.5"
        >
          <Bot className="h-5 w-5" />
          Connect with Discord
          <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
        </a>

        <p className="mt-4 text-xs text-center text-text-secondary">
          By connecting, you allow Aeris to read basic user and guild information.
        </p>
      </div>
    </div>
  );
}
