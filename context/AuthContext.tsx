"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useMemo,
  useCallback,
} from "react";
import { User, Session } from "@supabase/supabase-js";
import { createBrowserClient } from "@/lib/supabase/client";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  isLoggedIn: boolean;
  customerName: string | null;
  customerEmail: string | null;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    try {
      const supabase = createBrowserClient();
      const {
        data: { session: currentSession },
      } = await supabase.auth.getSession();
      setSession(currentSession);
      setUser(currentSession?.user || null);
    } catch (err) {
      console.error("Error refreshing Supabase Auth session:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;

    try {
      const supabase = createBrowserClient();

      // Retrieve initial session from browser storage
      supabase.auth
        .getSession()
        .then(({ data: { session: initialSession } }) => {
          if (!isMounted) return;
          setSession(initialSession);
          setUser(initialSession?.user || null);
          setIsLoading(false);
        })
        .catch((err) => {
          console.error("Error fetching initial auth session:", err);
          if (isMounted) setIsLoading(false);
        });

      // Listen to real-time auth transitions (sign in, sign out, token refresh)
      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange((_event, newSession) => {
        if (!isMounted) return;
        setSession(newSession);
        setUser(newSession?.user || null);
        setIsLoading(false);
      });

      return () => {
        isMounted = false;
        subscription.unsubscribe();
      };
    } catch (initErr) {
      console.error("Supabase client init error in AuthProvider:", initErr);
      queueMicrotask(() => {
        if (isMounted) setIsLoading(false);
      });
    }
  }, []);

  const signOut = useCallback(async () => {
    try {
      const supabase = createBrowserClient();
      await supabase.auth.signOut();
      setUser(null);
      setSession(null);
    } catch (err) {
      console.error("Error signing out:", err);
    }
  }, []);

  const customerName = useMemo(() => {
    if (!user) return null;
    const meta = user.user_metadata;
    if (meta?.full_name && typeof meta.full_name === "string") {
      return meta.full_name.trim();
    }
    if (meta?.name && typeof meta.name === "string") {
      return meta.name.trim();
    }
    if (user.email) {
      const prefix = user.email.split("@")[0];
      return prefix.charAt(0).toUpperCase() + prefix.slice(1);
    }
    return "Patron";
  }, [user]);

  const customerEmail = useMemo(() => {
    return user?.email || null;
  }, [user]);

  const value = useMemo(
    () => ({
      user,
      session,
      isLoading,
      isLoggedIn: Boolean(user),
      customerName,
      customerEmail,
      signOut,
      refreshUser,
    }),
    [user, session, isLoading, customerName, customerEmail, signOut, refreshUser]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
