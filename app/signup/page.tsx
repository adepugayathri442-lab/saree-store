"use client";

import { Suspense, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Mail,
  Lock,
  User,
  Eye,
  EyeOff,
  AlertCircle,
  ArrowRight,
  Sparkles,
  ShoppingBag,
  ArrowLeft,
  CheckCircle2,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { createBrowserClient } from "@/lib/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { SHOP_CONFIG } from "@/config/shop";

function SignupForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectPath = searchParams.get("redirect") || "/account";

  const { isLoggedIn, isLoading: isAuthLoading } = useAuth();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [signupSuccess, setSignupSuccess] = useState<string | null>(null);

  // If already logged in, redirect
  useEffect(() => {
    if (!isAuthLoading && isLoggedIn) {
      router.replace(redirectPath);
    }
  }, [isLoggedIn, isAuthLoading, router, redirectPath]);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setSignupSuccess(null);

    const cleanName = fullName.trim();
    const cleanEmail = email.trim();

    if (!cleanName || cleanName.length < 2) {
      setAuthError("Please enter your full name (minimum 2 characters).");
      return;
    }

    if (!cleanEmail || !cleanEmail.includes("@") || !cleanEmail.includes(".")) {
      setAuthError("Please enter a valid email address.");
      return;
    }

    if (!password || password.length < 6) {
      setAuthError("Password must be at least 6 characters long.");
      return;
    }

    if (password !== confirmPassword) {
      setAuthError("Passwords do not match. Please re-enter matching passwords.");
      return;
    }

    setIsSubmitting(true);

    try {
      const supabase = createBrowserClient();
      const origin = typeof window !== "undefined" ? window.location.origin : "";

      const { data, error } = await supabase.auth.signUp({
        email: cleanEmail,
        password,
        options: {
          data: {
            full_name: cleanName,
            name: cleanName,
          },
          emailRedirectTo: `${origin}${redirectPath}`,
        },
      });

      if (error) {
        if (error.message.toLowerCase().includes("user already registered")) {
          setAuthError(
            "An account with this email address already exists. Please sign in instead."
          );
        } else {
          setAuthError(error.message);
        }
        setIsSubmitting(false);
        return;
      }

      if (data.session) {
        // Auto-confirmed session: direct to account
        router.replace(redirectPath);
      } else if (data.user) {
        // Confirmation email sent
        setSignupSuccess(
          `Your account has been created! Please check your email (${cleanEmail}) to confirm your registration, then sign in.`
        );
        setIsSubmitting(false);
      }
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "An unexpected error occurred during signup.";
      setAuthError(msg);
      setIsSubmitting(false);
    }
  };

  const handleGoogleSignUp = async () => {
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
            "Google sign-in is not enabled in this Supabase project. Please register with your email and password."
          );
        } else {
          setAuthError(error.message);
        }
        setIsSubmitting(false);
      }
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "An unexpected error occurred with Google sign up.";
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
                New Patron
              </span>
            </div>

            {/* Header */}
            <div className="text-center mb-8">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FAF0DC] border border-[#C5A059]/40 text-[#6E121E] text-[11px] font-semibold tracking-wider mb-2">
                <Sparkles className="w-3 h-3 text-[#C5A059]" />
                <span>Join {SHOP_CONFIG.brandName}</span>
              </div>
              <h1 className="font-serif-luxury text-2xl sm:text-3xl font-bold text-[#1E1715] tracking-tight">
                Create Account
              </h1>
              <p className="text-xs sm:text-sm text-[#5A4E46] font-light mt-1.5">
                Save your favorite drapes, curate your wishlist, and enjoy personalized saree styling.
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

            {/* Success Message */}
            {signupSuccess ? (
              <div className="p-5 rounded-2xl bg-[#E8F3EE] border border-[#1E3F34]/30 text-center space-y-3">
                <CheckCircle2 className="w-8 h-8 text-[#1E3F34] mx-auto" />
                <h3 className="font-serif-luxury text-base font-bold text-[#1E3F34]">
                  Registration Successful
                </h3>
                <p className="text-xs text-[#2C2420] leading-relaxed">{signupSuccess}</p>
                <div className="pt-2">
                  <Link
                    href={`/login${redirectPath !== "/account" ? `?redirect=${encodeURIComponent(redirectPath)}` : ""}`}
                    className="inline-flex items-center gap-1.5 py-2 px-5 rounded-xl bg-[#1E3F34] text-white text-xs font-semibold uppercase tracking-wider hover:bg-[#285345] transition"
                  >
                    <span>Proceed to Sign In</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ) : (
              /* Signup Form */
              <form onSubmit={handleSignup} className="space-y-4">
                {/* Full Name Field */}
                <div>
                  <label
                    htmlFor="signup-name"
                    className="block text-xs font-semibold uppercase tracking-wider text-[#5A4E46] mb-1.5"
                  >
                    Full Name
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#8C7A6B]">
                      <User className="w-4 h-4" />
                    </div>
                    <input
                      id="signup-name"
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="e.g. Gayathri Rao"
                      autoComplete="name"
                      className="w-full pl-10 pr-4 py-2.5 bg-white border border-[#E8E0D2] focus:border-[#6E121E] focus:ring-1 focus:ring-[#6E121E] rounded-xl text-xs sm:text-sm text-[#2C2420] placeholder-[#8C7A6B] transition shadow-xs"
                    />
                  </div>
                </div>

                {/* Email Field */}
                <div>
                  <label
                    htmlFor="signup-email"
                    className="block text-xs font-semibold uppercase tracking-wider text-[#5A4E46] mb-1.5"
                  >
                    Email Address
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#8C7A6B]">
                      <Mail className="w-4 h-4" />
                    </div>
                    <input
                      id="signup-email"
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
                  <label
                    htmlFor="signup-password"
                    className="block text-xs font-semibold uppercase tracking-wider text-[#5A4E46] mb-1.5"
                  >
                    Password (Min. 6 Characters)
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#8C7A6B]">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      id="signup-password"
                      type={showPassword ? "text" : "password"}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Create a secure password"
                      autoComplete="new-password"
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

                {/* Confirm Password Field */}
                <div>
                  <label
                    htmlFor="signup-confirm-password"
                    className="block text-xs font-semibold uppercase tracking-wider text-[#5A4E46] mb-1.5"
                  >
                    Confirm Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#8C7A6B]">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      id="signup-confirm-password"
                      type={showPassword ? "text" : "password"}
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Re-enter your password"
                      autoComplete="new-password"
                      className="w-full pl-10 pr-4 py-2.5 bg-white border border-[#E8E0D2] focus:border-[#6E121E] focus:ring-1 focus:ring-[#6E121E] rounded-xl text-xs sm:text-sm text-[#2C2420] placeholder-[#8C7A6B] transition shadow-xs"
                    />
                  </div>
                </div>

                {/* Create Account Submit Button */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3 px-4 rounded-xl bg-[#6E121E] hover:bg-[#821524] text-white text-xs sm:text-sm font-semibold uppercase tracking-wider transition shadow-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                >
                  {isSubmitting ? (
                    <span>Creating Account...</span>
                  ) : (
                    <>
                      <span>Complete Registration</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            )}

            {/* Divider */}
            {!signupSuccess && (
              <>
                <div className="relative my-6">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-[#E8E0D2]" />
                  </div>
                  <div className="relative flex justify-center text-xs">
                    <span className="bg-[#FAF7F2] px-3 text-[#8C7A6B]">Or register with</span>
                  </div>
                </div>

                {/* Google OAuth Button */}
                <button
                  type="button"
                  onClick={handleGoogleSignUp}
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
                  <span>Register with Google</span>
                </button>
              </>
            )}

            {/* Login Link */}
            <div className="mt-8 text-center pt-5 border-t border-[#E8E0D2] text-xs text-[#5A4E46]">
              <span>Already have an account? </span>
              <Link
                href={`/login${redirectPath !== "/account" ? `?redirect=${encodeURIComponent(redirectPath)}` : ""}`}
                className="font-bold text-[#6E121E] hover:underline"
              >
                Sign In
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

export default function CustomerSignupPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[#FDFBF7]">
          <div className="w-8 h-8 border-2 border-[#6E121E] border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <SignupForm />
    </Suspense>
  );
}
