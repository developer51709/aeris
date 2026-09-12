import { Routes, Route, Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { Layout } from "./components/layout";
import { LandingPage } from "./pages/landing";
import { DashboardPage } from "./pages/dashboard";
import { DocsPage } from "./pages/docs";
import { AuthPage } from "./pages/auth";
import { ApiError, authApi } from "./lib/api";

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<{ id: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    authApi
      .get("/me")
      .then((data) => {
        if (typeof data?.id === "string") {
          setSession(data as { id: string });
        }
        setLoading(false);
      })
      .catch((error) => {
        if (error instanceof ApiError && error.status === 401) {
          setLoading(false);
          return;
        }
        setAuthError("We couldn’t reach the authentication service. Please try again.");
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    if (!session && typeof window !== "undefined") {
      window.localStorage?.removeItem("aeris-theme");
    }
  }, [session]);

  if (loading)
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-10 w-10 border-4 border-brand border-t-transparent" />
        </div>
      </Layout>
    );

  if (authError)
    return (
      <Layout>
        <div className="flex min-h-[60vh] items-center justify-center px-4">
          <div className="w-full max-w-lg rounded-2xl border border-danger/40 bg-danger/5 p-8 text-center">
            <p className="text-sm text-danger">{authError}</p>
            <a
              href="/auth"
              className="mt-4 inline-flex items-center justify-center rounded-xl bg-brand text-white px-5 py-2 text-sm font-semibold hover:-translate-y-0.5 transition-all"
            >
              Try to sign in
            </a>
          </div>
        </div>
      </Layout>
    );

  if (!session) return <Navigate to="/auth" replace />;
  return <Layout>{children}</Layout>;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/auth" element={<AuthPage />} />
      <Route
        path="/dashboard/*"
        element={
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        }
      />
      <Route path="/docs/*" element={<DocsPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
