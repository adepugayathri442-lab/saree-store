"use client";

import { Suspense, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
  ArrowRight,
  Sparkles,
  ShoppingBag,
  ArrowLeft,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { createBrowserClient } from "@/lib/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { SHOP_CONFIG } from "@/config/shop";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectPath = searchParams.get("redirect") || "/account";

  const { isLoggedIn, isLoading: isAuthLoading } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // If already logged in, redirect to destination
  useEffect(() => {
    if (!isAuthLoading && isLoggedIn) {
      router.replace(redirectPath);
    }
  }, [isLoggedIn, isAuthLoading, router, redirectPath]);

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);

    const cleanEmail = email.trim();
    if (!cleanEmail) {
      setAuthError("Please enter your email address.");
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
        if (error.message.toLowerCase().includes("invalid login credentials")) {
          setAuthError(
            "Invalid email or password. Please verify your credentials or create a new account."
          );
        } else if (error.message.toLowerCase().includes("email not confirmed")) {
          setAuthError(
            "Your email has not been confirmed yet. Please check your inbox for the confirmation email."
          );
        } else {
          setAuthError(error.message);
        }
        setIsSubmitting(false);
        return;
      }

      if (data.user) {
        router.replace(redirectPath);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "An unexpected error occurred during login.";
      setAuthError(msg);
      setIsSubmitting(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setAuthError(null);
    setIsSubmitting(true);

    try {
      const supabase = createBrowserClient();
      const origin = typeof window !== "undefined" ? window.location.origin : "";
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${origin}${redirectPath}`,
        },
      });

      if (error) {
        if (
          error.message.toLowerCase().includes("provider is not enabled") ||
          error.message.toLowerCase().includes("unsupported provider")
        ) {
          setAuthError(
            "Google sign-in is not enabled in this Supabase project. Please use your email and password to log in."
          );
        } else {
          setAuthError(error.message);
        }
        setIsSubmitting(false);
      }
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "An unexpected error occurred with Google sign in.";
      setAuthError(msg);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#FDFBF7] text-[#2C2420]">
      <Navbar />

      <main className="flex-1 flex items-center justify-center px-4 sm:px-6 py-12 lg:py-16">
        <div className="w-full max-w-md">
          {/* Card Container */}
          <div className="bg-[#FAF7F2] rounded-3xl border border-[#E8E0D2] shadow-xl p-6 sm:p-10 relative overflow-hidden">
            {/* Top Ornamental Bar */}
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#6E121E] via-[#C5A059] to-[#6E121E]" />

            {/* Back to Catalogue / Guest Notice */}
            <div className="flex items-center justify-between mb-6">
              <Link
                href="/sarees"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#8C7A6B] hover:text-[#6E121E] transition"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Continue as Guest</span>
              </Link>
              <span className="text-[10px] uppercase tracking-wider font-semibold text-[#C5A059] bg-[#FAF0DC] px-2.5 py-0.5 rounded-full">
                Boutique Patron
              </span>
            </div>

            {/* Header */}
            <div className="text-center mb-8">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FAF0DC] border border-[#C5A059]/40 text-[#6E121E] text-[11px] font-semibold tracking-wider mb-2">
                <Sparkles className="w-3 h-3 text-[#C5A059]" />
                <span>{SHOP_CONFIG.brandName} • Armoor</span>
              </div>
              <h1 className="font-serif-luxury text-2xl sm:text-3xl font-bold text-[#1E1715] tracking-tight">
                Welcome Back
              </h1>
              <p className="text-xs sm:text-sm text-[#5A4E46] font-light mt-1.5">
                Sign in to manage your saved sarees, wishlists, and account preferences.
              </p>
            </div>

            {/* Error Message */}
            {authError && (
              <div
                role="alert"
                className="mb-6 p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs flex items-start gap-2.5 animate-in fade-in"
              >
                <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                <span className="leading-relaxed">{authError}</span>
              </div>
            )}

            {/* Login Form */}
            <form onSubmit={handleEmailSignIn} className="space-y-4">
              {/* Email Field */}
              <div>
                <label
                  htmlFor="customer-email"
                  className="block text-xs font-semibold uppercase tracking-wider text-[#5A4E46] mb-1.5"
                >
                  Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#8C7A6B]">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    id="customer-email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    autoComplete="email"
                    className="w-full pl-10 pr-4 py-2.5 bg-white border border-[#E8E0D2] focus:border-[#6E121E] focus:ring-1 focus:ring-[#6E121E] rounded-xl text-xs sm:text-sm text-[#2C2420] placeholder-[#8C7A6B] transition shadow-xs"
                  />
                </div>
              </div>

              {/* Password Field */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label
                    htmlFor="customer-password"
                    className="block text-xs font-semibold uppercase tracking-wider text-[#5A4E46]"
                  >
                    Password
                  </label>
                  <Link
                    href="/forgot-password"
                    className="text-[11px] text-[#6E121E] hover:underline font-medium"
                  >
                    Forgot Password?
                  </Link>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#8C7A6B]">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    id="customer-password"
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    autoComplete="current-password"
                    className="w-full pl-10 pr-10 py-2.5 bg-white border border-[#E8E0D2] focus:border-[#6E121E] focus:ring-1 focus:ring-[#6E121E] rounded-xl text-xs sm:text-sm text-[#2C2420] placeholder-[#8C7A6B] transition shadow-xs"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-[#8C7A6B] hover:text-[#2C2420] cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Sign In Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 px-4 rounded-xl bg-[#6E121E] hover:bg-[#821524] text-white text-xs sm:text-sm font-semibold uppercase tracking-wider transition shadow-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
              >
                {isSubmitting ? (
                  <span>Signing In...</span>
                ) : (
                  <>
                    <span>Sign In to Account</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            {/* Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-[#E8E0D2]" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-[#FAF7F2] px-3 text-[#8C7A6B]">Or continue with</span>
              </div>
            </div>

            {/* Google OAuth Button */}
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={isSubmitting}
              className="w-full py-2.5 px-4 rounded-xl border border-[#E8E0D2] bg-white hover:bg-[#FAF7F2] text-[#2C2420] text-xs sm:text-sm font-medium transition flex items-center justify-center gap-3 cursor-pointer shadow-2xs disabled:opacity-60"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>Continue with Google</span>
            </button>

            {/* Sign Up Link */}
            <div className="mt-8 text-center pt-5 border-t border-[#E8E0D2] text-xs text-[#5A4E46]">
              <span>Don&apos;t have an account? </span>
              <Link
                href={`/signup${redirectPath !== "/account" ? `?redirect=${encodeURIComponent(redirectPath)}` : ""}`}
                className="font-bold text-[#6E121E] hover:underline"
              >
                Create Account
              </Link>
            </div>
          </div>

          {/* Guest Browsing Quick Link */}
          <div className="mt-6 text-center">
            <Link
              href="/sarees"
              className="inline-flex items-center gap-1.5 text-xs text-[#8C7A6B] hover:text-[#6E121E] transition"
            >
              <ShoppingBag className="w-3.5 h-3.5 text-[#C5A059]" />
              <span>Continue browsing saree catalogue as guest</span>
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

export default function CustomerLoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[#FDFBF7]">
          <div className="w-8 h-8 border-2 border-[#6E121E] border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
