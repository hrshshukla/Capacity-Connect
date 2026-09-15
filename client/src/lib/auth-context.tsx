import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { Session } from "@supabase/supabase-js";
import { getAuthMe, type AuthResponse, type UserProfile } from "./auth-api";
import { supabase } from "./supabase";
import { setAuthTokenGetter } from "./api-client-react/custom-fetch";

type AuthContextValue = {
  user: UserProfile | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<AuthResponse>;
  signup: (input: { name: string; email: string; password: string; role: "TRAINEE" | "TRAINER" }) => Promise<AuthResponse>;
  logout: () => Promise<void>;
  reload: () => Promise<UserProfile | null>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function responseFromSession(session: Session | null, user: UserProfile | null, requiresEmailVerification = false): AuthResponse {
  return {
    accessToken: session?.access_token ?? null,
    refreshToken: session?.refresh_token ?? null,
    expiresIn: session?.expires_in ?? null,
    user,
    requiresEmailVerification,
  };
}

async function profileFromSession(session: Session | null) {
  setAuthTokenGetter(() => session?.access_token ?? null);
  if (!session) return null;
  if (typeof session.user.user_metadata?.invitation_id === "string") return null;
  return getAuthMe();
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    const hydrate = async (session: Session | null) => {
      try {
        const profile = await profileFromSession(session);
        if (active) setUser(profile);
      } catch {
        if (active) setUser(null);
      } finally {
        if (active) setLoading(false);
      }
    };

    void supabase.auth.getSession().then(({ data }) => hydrate(data.session));
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setAuthTokenGetter(() => session?.access_token ?? null);
      window.setTimeout(() => {
        if (active) void hydrate(session);
      }, 0);
    });

    return () => {
      active = false;
      listener.subscription.unsubscribe();
      setAuthTokenGetter(null);
    };
  }, []);

  const reload = async () => {
    const { data } = await supabase.auth.getSession();
    setAuthTokenGetter(() => data.session?.access_token ?? null);
    if (!data.session) {
      setUser(null);
      return null;
    }
    try {
      const profile = await getAuthMe();
      setUser(profile);
      return profile;
    } catch {
      setUser(null);
      return null;
    }
  };

  const value = useMemo<AuthContextValue>(() => ({
    user,
    loading,
    async login(email, password) {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error || !data.session) throw new Error(error?.message ?? "Unable to sign in.");
      setAuthTokenGetter(() => data.session?.access_token ?? null);
      const profile = await getAuthMe();
      setUser(profile);
      return responseFromSession(data.session, profile);
    },
    async signup(input) {
      const { data, error } = await supabase.auth.signUp({
        email: input.email,
        password: input.password,
        options: { data: { full_name: input.name, role: input.role } },
      });
      if (error || !data.user) throw new Error(error?.message ?? "Unable to create the account.");
      if (!data.session) return responseFromSession(null, null, true);
      setAuthTokenGetter(() => data.session?.access_token ?? null);
      const profile = await getAuthMe();
      setUser(profile);
      return responseFromSession(data.session, profile);
    },
    async logout() {
      const { error } = await supabase.auth.signOut();
      if (error) throw new Error(error.message);
      setAuthTokenGetter(null);
      setUser(null);
    },
    reload,
  }), [loading, user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider");
  return context;
}