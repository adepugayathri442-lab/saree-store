"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Lock,
  Mail,
  AlertCircle,
  ArrowRight,
  ShieldCheck,
  Eye,
  EyeOff,
  Store,
  CheckCircle2,
} from "lucide-react";
import { createBrowserClient } from "@/lib/supabase/client";
import { SHOP_CONFIG } from "@/config/shop";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isCheckingSession, setIsCheckingSession] = useState(true);

  // If already logged in, redirect straight to /admin
  useEffect(() => {
    const supabase = createBrowserClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        router.replace("/admin");
      } else {
        setIsCheckingSession(false);
      }
    });
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);

    // Client-side validations
    const cleanEmail = email.trim();
    if (!cleanEmail) {
      setAuthError("Please enter your admin email address.");
      return;
    }

    if (!cleanEmail.includes("@") || !cleanEmail.includes(".")) {
      setAuthError("Please enter a valid email address.");
      return;
    }

    if (!password) {
      setAuthError("Please enter your password.");
      return;
    }

    setIsSubmitting(true);

    try {
      const supabase = createBrowserClient();
      const { data, error } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password,
      });

      if (error) {
        // Provide clear, actionable feedback for common Supabase Auth errors
        if (error.message.toLowerCase().includes("invalid login credentials")) {
          setAuthError(
            "Invalid email or password. Please verify your credentials or ensure the user is registered in your Supabase Auth dashboard."
          );
        } else if (error.message.toLowerCase().includes("email not confirmed")) {
          setAuthError(
            "Email address not confirmed. Please check your inbox or confirm the user in your Supabase dashboard."
          );
        } else {
          setAuthError(error.message);
        }
        setIsSubmitting(false);
        return;
      }

      if (data.user) {
        setIsSuccess(true);
        // Small delay for smooth visual feedback before redirect
        setTimeout(() => {
          router.replace("/admin");
        }, 500);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "An unexpected error occurred.";
      setAuthError(message);
      setIsSubmitting(false);
    }
  };

  if (isCheckingSession) {
    return (
      <div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center p-6 text-center">
        <div className="w-8 h-8 border-3 border-[#C5A059] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#FAF7F2] via-[#FDFBF7] to-[#FAF7F2] flex flex-col justify-between py-8 px-4 sm:px-6 lg:px-8 text-[#2C2420]">
      {/* Top Header / Return Link */}
      <div className="max-w-md w-full mx-auto flex items-center justify-between">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs text-[#8C7A6B] hover:text-[#6E121E] transition-colors group"
        >
          <Store className="w-3.5 h-3.5 text-[#C5A059]" />
          <span>Return to Storefront</span>
        </Link>

        <span className="text-[11px] text-[#8C7A6B] font-mono">
          {SHOP_CONFIG.cityState.split(",")[0]}
        </span>
      </div>

      {/* Main Login Card */}
      <div className="max-w-md w-full mx-auto my-auto">
        <div className="bg-[#FAF7F2] rounded-3xl border border-[#C5A059]/40 shadow-xl overflow-hidden">
          {/* Card Decorative Header */}
          <div className="bg-gradient-to-r from-[#590D18] via-[#6E121E] to-[#590D18] p-8 text-center text-white relative">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 border border-[#C5A059]/40 text-[#E5D2A4] text-[11px] font-semibold tracking-wider uppercase mb-3">
              <ShieldCheck className="w-3.5 h-3.5 text-[#C5A059]" />
              <span>Admin Authentication</span>
            </div>

            <h1 className="font-serif-luxury text-3xl sm:text-4xl font-bold tracking-wider text-white">
              {SHOP_CONFIG.brandName}
            </h1>
            <p className="text-[11px] tracking-[0.25em] uppercase text-[#E5D2A4] mt-1 font-light">
              {SHOP_CONFIG.tagline}
            </p>
          </div>

          {/* Form Area */}
          <div className="p-6 sm:p-8">
            <div className="mb-6 text-center">
              <h2 className="font-serif-luxury text-xl font-bold text-[#1E1715]">
                Sign In to Admin Portal
              </h2>
              <p className="text-xs text-[#8C7A6B] mt-1 font-light">
                Enter your Supabase administrator email and password
              </p>
            </div>

            {/* Error Banner */}
            {authError && (
              <div className="mb-5 p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-800 flex items-start gap-2.5 animate-in fade-in duration-200">
                <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                <p className="leading-relaxed font-medium">{authError}</p>
              </div>
            )}

            {/* Success Banner */}
            {isSuccess && (
              <div className="mb-5 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2.5 animate-in fade-in duration-200">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <p className="font-medium">Authentication successful! Redirecting to admin...</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Email Address */}
              <div>
                <label
                  htmlFor="admin-email"
                  className="block text-xs font-semibold text-[#2C2420] mb-1.5"
                >
                  Admin Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8C7A6B]" />
                  <input
                    id="admin-email"
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (authError) setAuthError(null);
                    }}
                    placeholder="admin@saisrujana.com"
                    disabled={isSubmitting || isSuccess}
                    className="w-full pl-10 pr-3.5 py-3 rounded-xl bg-white border border-[#E8E0D2] focus:border-[#6E121E] focus:ring-1 focus:ring-[#6E121E] text-sm text-[#2C2420] placeholder-[#8C7A6B] transition shadow-2xs disabled:opacity-50"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label
                  htmlFor="admin-password"
                  className="block text-xs font-semibold text-[#2C2420] mb-1.5"
                >
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8C7A6B]" />
                  <input
                    id="admin-password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (authError) setAuthError(null);
                    }}
                    placeholder="Enter your password"
                    disabled={isSubmitting || isSuccess}
                    className="w-full pl-10 pr-10 py-3 rounded-xl bg-white border border-[#E8E0D2] focus:border-[#6E121E] focus:ring-1 focus:ring-[#6E121E] text-sm text-[#2C2420] placeholder-[#8C7A6B] transition shadow-2xs disabled:opacity-50"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex={-1}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#8C7A6B] hover:text-[#2C2420] transition p-0.5 cursor-pointer"
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Submit CTA */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting || isSuccess}
                  className="w-full py-3.5 px-6 rounded-xl bg-[#6E121E] hover:bg-[#821524] text-white text-xs sm:text-sm font-semibold tracking-wider uppercase btn-premium-primary flex items-center justify-center gap-2 shadow-md transition disabled:opacity-50 cursor-pointer"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Authenticating...</span>
                    </>
                  ) : isSuccess ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-[#A7F3D0]" />
                      <span>Verified ✓</span>
                    </>
                  ) : (
                    <>
                      <span>Sign In to Admin Portal</span>
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </button>
              </div>
            </form>

            {/* Security note */}
            <div className="mt-6 pt-5 border-t border-[#E8E0D2] text-center">
              <p className="text-[11px] text-[#8C7A6B] font-light leading-relaxed">
                Protected by Supabase Auth with Row Level Security.
                <br />
                Authorized boutique staff only.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Branding */}
      <div className="max-w-md w-full mx-auto text-center mt-6">
        <p className="text-[11px] text-[#8C7A6B]">
          &copy; {new Date().getFullYear()} {SHOP_CONFIG.brandName} • Armoor, Nizamabad, Telangana
        </p>
      </div>
    </div>
  );
}
