import { useEffect, useState } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

function formatAuthSetupError(error: unknown) {
  const raw = error instanceof Error ? error.message : String(error ?? "Unknown auth error");

  if (
    raw.includes("Missing Supabase environment variable") ||
    raw.includes("process is not defined")
  ) {
    return "Your local app is running, but the backend public environment variables are missing or unavailable. Add the VITE_SUPABASE_* values to .env, stop the dev server, and run npm run dev again.";
  }

  return raw;
}

export function useAuth() {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    let unsubscribe: (() => void) | undefined;

    const handleError = (authError: unknown) => {
      console.error(authError);
      if (!active) return;
      setSession(null);
      setUser(null);
      setError(formatAuthSetupError(authError));
      setLoading(false);
    };

    try {
      // Set up listener first
      const { data: sub } = supabase.auth.onAuthStateChange((_event, newSession) => {
        setSession(newSession);
        setUser(newSession?.user ?? null);
        setError(null);
      });
      unsubscribe = () => sub.subscription.unsubscribe();

      // Then load existing session
      supabase.auth.getSession().then(({ data }) => {
        if (!active) return;
        setSession(data.session);
        setUser(data.session?.user ?? null);
        setError(null);
        setLoading(false);
      }).catch(handleError);
    } catch (authError) {
      handleError(authError);
    }

    return () => {
      active = false;
      unsubscribe?.();
    };
  }, []);

  return { session, user, loading, error };
}

export function useTheme() {
  const [theme, setTheme] = useState<"light" | "dark">(() => {
    if (typeof window === "undefined") return "light";
    try {
      const stored = localStorage.getItem("sticky-theme");
      if (stored === "dark" || stored === "light") return stored;
      return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    } catch {
      return "light";
    }
  });

  useEffect(() => {
    try {
      const root = document.documentElement;
      root.classList.toggle("dark", theme === "dark");
      localStorage.setItem("sticky-theme", theme);
    } catch {
      // Ignore storage access errors in restricted local/browser environments.
    }
  }, [theme]);

  return { theme, toggle: () => setTheme((t) => (t === "dark" ? "light" : "dark")) };
}
