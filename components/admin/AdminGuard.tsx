"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { User } from "@supabase/supabase-js";
import { createBrowserClient } from "@/lib/supabase/client";
import { SHOP_CONFIG } from "@/config/shop";

interface AdminGuardProps {
  children: (props: { user: User; onLogout: () => Promise<void> }) => React.ReactNode;
}

export default function AdminGuard({ children }: AdminGuardProps) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const supabase = createBrowserClient();

    // Verify current user authentication session with Supabase Auth
    supabase.auth.getUser().then(({ data, error }) => {
      if (!isMounted) return;

      if (error || !data.user) {
        router.replace("/admin/login");
      } else {
        setUser(data.user);
        setLoading(false);
      }
    });

    // Listen to auth state transitions (sign in, sign out, token refresh)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (!isMounted) return;

      if (event === "SIGNED_OUT" || !session) {
        setUser(null);
        router.replace("/admin/login");
      } else if (session?.user) {
        setUser(session.user);
        setLoading(false);
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [router]);

  const handleLogout = async () => {
    try {
      const supabase = createBrowserClient();
      await supabase.auth.signOut();
    } catch (err) {
      console.error("Sign out error:", err);
    } finally {
      router.replace("/admin/login");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center p-6 text-center">
        <div className="max-w-md w-full bg-[#FAF7F2] p-8 sm:p-10 rounded-2xl border border-[#E8E0D2] shadow-sm">
          <div className="w-10 h-10 border-3 border-[#C5A059] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <h2 className="font-serif-luxury text-xl font-bold text-[#6E121E]">
            {SHOP_CONFIG.brandName} Admin Portal
          </h2>
          <p className="text-xs text-[#8C7A6B] mt-1.5 font-light">
            Verifying secure administrative session with Supabase...
          </p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return <>{children({ user, onLogout: handleLogout })}</>;
}
