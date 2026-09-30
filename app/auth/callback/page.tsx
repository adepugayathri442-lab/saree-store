"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Sparkles, AlertCircle, ArrowRight, ShieldCheck } from "lucide-react";
import { createBrowserClient } from "@/lib/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { getFriendlyAuthErrorMessage, isProfileComplete } from "@/lib/supabase/auth";
import { SHOP_CONFIG } from "@/config/shop";

function CallbackHandler() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { refreshUser } = useAuth();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function handleExchange() {
      const code = searchParams.get("code");
      const error = searchParams.get("error");
      const errorDescription = searchParams.get("error_description");
      const next = searchParams.get("next") || "/account";

      // If OAuth provider returned an error (e.g. user cancelled)
      if (error) {
        if (isMounted) {
          setErrorMessage(
            getFriendlyAuthErrorMessage(errorDescription || error || "Google sign-in was cancelled.")
          );
        }
        return;
      }

      try {
        const supabase = createBrowserClient();

        // 1. If an authorization code is present in query parameters (PKCE flow)
        if (code) {
          const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
          if (exchangeError) {
            console.error("Supabase code exchange error:", exchangeError);
            if (isMounted) {
              setErrorMessage(getFriendlyAuthErrorMessage(exchangeError));
            }
            return;
          }

          if (data.session) {
            await refreshUser();
            if (isMounted) {
              if (!isProfileComplete(data.user)) {
                router.replace(`/complete-profile?redirect=${encodeURIComponent(next)}`);
              } else {
                router.replace(next);
              }
            }
            return;
          }
        }

        // 2. Fallback: check if session is already active (e.g. implicit flow or already processed)
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (session?.user) {
          await refreshUser();
          if (isMounted) {
            if (!isProfileComplete(session.user)) {
              router.replace(`/complete-profile?redirect=${encodeURIComponent(next)}`);
            } else {
              router.replace(next);
            }
          }
          return;
        }

        // 3. Listen briefly to auth state changes in case session exchange is currently in-flight
        const {
          data: { subscription },
        } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
          if (newSession?.user) {
            subscription.unsubscribe();
            await refreshUser();
            if (isMounted) {
              if (!isProfileComplete(newSession.user)) {
                router.replace(`/complete-profile?redirect=${encodeURIComponent(next)}`);
              } else {
                router.replace(next);
              }
            }
          }
        });

        // 4. Timeout fallback after 6 seconds
        const timeoutId = setTimeout(() => {
          subscription.unsubscribe();
          if (isMounted) {
            setErrorMessage(
              "Authentication timed out. Please return to the login page and try signing in again."
            );
          }
        }, 6000);

        return () => {
          clearTimeout(timeoutId);
          subscription.unsubscribe();
        };
      } catch (err) {
        console.error("Unexpected callback exception:", err);
        if (isMounted) {
          setErrorMessage(getFriendlyAuthErrorMessage(err));
        }
      }
    }

    handleExchange();

    return () => {
      isMounted = false;
    };
  }, [searchParams, router, refreshUser]);

  if (errorMessage) {
    return (
      <div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-[#FAF7F2] border border-[#E8E0D2] rounded-3xl p-6 sm:p-8 text-center space-y-5 shadow-xl">
          <div className="w-14 h-14 rounded-2xl bg-red-50 border border-red-200 text-red-600 flex items-center justify-center mx-auto">
            <AlertCircle className="w-7 h-7" />
          </div>

          <div>
            <h2 className="font-serif-luxury text-xl sm:text-2xl font-bold text-[#1E1715]">
              Sign-In Incomplete
            </h2>
            <p className="text-xs sm:text-sm text-[#5A4E46] leading-relaxed mt-2">
              {errorMessage}
            </p>
          </div>

          <div className="pt-2 flex flex-col gap-2.5">
            <Link
              href="/login"
              className="w-full py-3 px-4 rounded-xl bg-[#6E121E] hover:bg-[#821524] text-white text-xs font-semibold uppercase tracking-wider transition shadow-sm flex items-center justify-center gap-2"
            >
              <span>Return to Login</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <Link
              href="/"
              className="text-xs font-medium text-[#8C7A6B] hover:text-[#6E121E] transition py-1"
            >
              Continue to Boutique as Guest
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-[#FAF7F2] border border-[#E8E0D2] rounded-3xl p-8 sm:p-10 text-center space-y-5 shadow-xl relative overflow-hidden">
        {/* Top Ornamental Bar */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#6E121E] via-[#C5A059] to-[#6E121E]" />

        <div className="w-14 h-14 rounded-2xl bg-[#FAF0DC] border border-[#C5A059]/50 flex items-center justify-center mx-auto text-[#6E121E] shadow-xs">
          <Sparkles className="w-7 h-7 text-[#C5A059] animate-spin" />
        </div>

        <div>
          <span className="text-[11px] uppercase tracking-widest font-semibold text-[#C5A059] block mb-1">
            {SHOP_CONFIG.brandName} • Armoor
          </span>
          <h2 className="font-serif-luxury text-2xl font-bold text-[#1E1715]">
            Confirming Your Patron Session
          </h2>
          <p className="text-xs sm:text-sm text-[#8C7A6B] mt-1.5 font-light">
            Connecting your boutique account... You will be redirected momentarily.
          </p>
        </div>

        <div className="pt-2 flex items-center justify-center gap-2 text-xs text-[#1E3F34]">
          <ShieldCheck className="w-4 h-4 text-[#1E3F34]" />
          <span>Secure Encrypted Authentication</span>
        </div>
      </div>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center">
          <div className="w-10 h-10 border-3 border-[#6E121E] border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <CallbackHandler />
    </Suspense>
  );
}
