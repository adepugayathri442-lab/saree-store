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
  customerPhone: string | null;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
  updateUserProfile: (details: { fullName?: string; phone?: string; email?: string }) => Promise<User | null>;
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

  const updateUserProfile = useCallback(
    async (details: { fullName?: string; phone?: string; email?: string }): Promise<User | null> => {
      const supabase = createBrowserClient();
      const updatePayload: {
        data: Record<string, string>;
        email?: string;
      } = {
        data: {},
      };

      if (details.fullName && details.fullName.trim()) {
        updatePayload.data.full_name = details.fullName.trim();
        updatePayload.data.name = details.fullName.trim();
      }
      if (details.phone && details.phone.trim()) {
        updatePayload.data.phone = details.phone.trim();
      }
      if (details.email && details.email.trim()) {
        updatePayload.email = details.email.trim();
      }

      const { data, error } = await supabase.auth.updateUser(updatePayload);
      if (error) throw error;

      if (data.user) {
        setUser(data.user);
      }
      return data.user || null;
    },
    []
  );

  const customerName = useMemo(() => {
    if (!user) return null;
    const meta = user.user_metadata;
    if (meta?.full_name && typeof meta.full_name === "string" && meta.full_name.trim()) {
      return meta.full_name.trim();
    }
    if (meta?.name && typeof meta.name === "string" && meta.name.trim()) {
      return meta.name.trim();
    }
    if (user.email) {
      const prefix = user.email.split("@")[0];
      return prefix.charAt(0).toUpperCase() + prefix.slice(1);
    }
    if (user.phone) {
      const digits = user.phone.replace(/[^0-9]/g, "");
      return digits.length >= 10 ? `Patron (${digits.slice(-4)})` : user.phone;
    }
    return "Patron";
  }, [user]);

  const customerEmail = useMemo(() => {
    return user?.email || user?.user_metadata?.email || null;
  }, [user]);

  const customerPhone = useMemo(() => {
    return user?.phone || user?.user_metadata?.phone || null;
  }, [user]);

  const value = useMemo(
    () => ({
      user,
      session,
      isLoading,
      isLoggedIn: Boolean(user),
      customerName,
      customerEmail,
      customerPhone,
      signOut,
      refreshUser,
      updateUserProfile,
    }),
    [user, session, isLoading, customerName, customerEmail, customerPhone, signOut, refreshUser, updateUserProfile]
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
