import { useEffect, useState } from "react";
import { api } from "../lib/api";
import { Bot, ArrowRight, AlertTriangle, RefreshCw } from "lucide-react";

interface AuthError {
  error?: string;
  message?: string;
}

export function AuthPage() {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<Record<string, unknown> | null>(null);
  const [oauthError, setOauthError] = useState<AuthError | null>(null);
  const [oauthConfigError] = useState<boolean>(false);

  useEffect(() => {
    api
      .get("/auth/me")
      .then((data) => {
        setUser(data as Record<string, unknown>);
        setLoading(false);
      })
      .catch(() => {
        setOauthError(null);
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    if (!loading && user?.id) {
      window.location.href = "/dashboard";
    }
  }, [loading, user]);

  function handleRetry() {
    setOauthError(null);
    window.location.href = "/auth/discord";
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-brand border-t-transparent" />
      </div>
    );
  }

  if (oauthConfigError) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface px-4">
        <div className="w-full max-w-lg rounded-2xl border border-danger/40 bg-danger/5 p-8 text-center">
          <AlertTriangle className="mx-auto h-10 w-10 text-danger mb-4" />
          <h1 className="text-xl font-semibold">OAuth is not configured</h1>
          <p className="mt-2 text-sm text-text-secondary max-w-md mx-auto">
            The backend is missing Discord OAuth credentials. Only the API team can
            enable sign-in until <code className="rounded bg-surface-muted px-1.5 py-0.5 text-xs font-mono">BOT_OAUTH_CLIENT_ID</code>,
            <code className="rounded bg-surface-muted px-1.5 py-0.5 text-xs font-mono">BOT_OAUTH_CLIENT_SECRET</code>
            and <code className="rounded bg-surface-muted px-1.5 py-0.5 text-xs font-mono">BOT_OAUTH_REDIRECT_URI</code>
            are set.
          </p>
        </div>
      </div>
    );
  }

  if (oauthError) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface px-4">
        <div className="w-full max-w-md rounded-2xl border border-border bg-surface-2 p-8 shadow-sm">
          <div className="flex flex-col items-center text-center mb-6">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-brand to-brand-dark flex items-center justify-center text-white text-2xl font-bold shadow-lg">
              A
            </div>
            <h1 className="mt-4 text-xl font-semibold">Something went wrong</h1>
            <p className="mt-1 text-sm text-text-secondary">
              We could not complete your Discord sign-in.
            </p>
          </div>

          <div className="rounded-xl border border-border bg-surface-muted p-4 text-left">
            <p className="text-sm text-danger font-medium">{oauthError.error}</p>
            <p className="mt-1 text-sm text-text-secondary">{oauthError.message}</p>
          </div>

          <button
            onClick={handleRetry}
            className="mt-4 group flex w-full items-center justify-center gap-2 rounded-xl bg-brand text-white px-5 py-3 text-base font-semibold shadow-lg shadow-brand/20 hover:shadow-xl hover:shadow-brand/30 transition-all hover:-translate-y-0.5"
          >
            <RefreshCw className="h-5 w-5" />
            Try again
          </button>

          <p className="mt-4 text-xs text-center text-text-secondary">
            If this keeps happening, try again after a short wait.
          </p>
        </div>
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
