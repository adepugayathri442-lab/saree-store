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
  Phone,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  ShieldCheck,
  User as UserIcon,
  RefreshCw,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { createBrowserClient } from "@/lib/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { SHOP_CONFIG } from "@/config/shop";
import {
  getAuthRedirectUrl,
  formatIndianPhoneNumber,
  getFriendlyAuthErrorMessage,
  isProfileComplete,
} from "@/lib/supabase/auth";

type PhoneStep = "input" | "otp" | "profile";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectPath = searchParams.get("redirect") || "/account";
  const urlError = searchParams.get("error");
  const urlErrorDesc = searchParams.get("error_description");

  const { isLoggedIn, isLoading: isAuthLoading, refreshUser } = useAuth();

  // General error state
  const [authError, setAuthError] = useState<string | null>(() => {
    if (urlErrorDesc) return getFriendlyAuthErrorMessage(urlErrorDesc);
    if (urlError) return getFriendlyAuthErrorMessage(urlError);
    return null;
  });
  const [authSuccess, setAuthSuccess] = useState<string | null>(null);

  // Google OAuth state
  const [isGoogleSubmitting, setIsGoogleSubmitting] = useState(false);

  // Phone OTP state
  const [phoneStep, setPhoneStep] = useState<PhoneStep>("input");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [formattedPhone, setFormattedPhone] = useState("");
  const [displayPhone, setDisplayPhone] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [resendCountdown, setResendCountdown] = useState(0);

  // Profile completion state (if missing name after phone OTP)
  const [fullName, setFullName] = useState("");
  const [emailAddress, setEmailAddress] = useState("");
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // Traditional Email/Password state (foldable for patrons who prefer password)
  const [showEmailLogin, setShowEmailLogin] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isEmailSubmitting, setIsEmailSubmitting] = useState(false);

  // Countdown timer for OTP resend
  useEffect(() => {
    if (resendCountdown <= 0) return;
    const timer = setInterval(() => {
      setResendCountdown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCountdown]);

  // If already logged in, redirect to destination
  useEffect(() => {
    if (!isAuthLoading && isLoggedIn) {
      router.replace(redirectPath);
    }
  }, [isLoggedIn, isAuthLoading, router, redirectPath]);

  // OPTION A: Google OAuth Sign In
  const handleGoogleSignIn = async () => {
    setAuthError(null);
    setAuthSuccess(null);
    setIsGoogleSubmitting(true);

    try {
      const supabase = createBrowserClient();
      const redirectTo = getAuthRedirectUrl(redirectPath);

      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo,
          queryParams: {
            access_type: "offline",
            prompt: "consent select_account",
          },
        },
      });

      if (error) {
        setAuthError(getFriendlyAuthErrorMessage(error));
        setIsGoogleSubmitting(false);
      }
    } catch (err: unknown) {
      console.error("Google sign in exception:", err);
      setAuthError(getFriendlyAuthErrorMessage(err));
      setIsGoogleSubmitting(false);
    }
  };

  // OPTION B - Step 1: Send OTP to Phone
  const handleSendOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setAuthError(null);
    setAuthSuccess(null);

    const validation = formatIndianPhoneNumber(phoneNumber);
    if (!validation.isValid) {
      setAuthError(validation.errorMessage || "Please enter a valid 10-digit mobile number.");
      return;
    }

    setIsSendingOtp(true);

    try {
      const supabase = createBrowserClient();
      const { error } = await supabase.auth.signInWithOtp({
        phone: validation.e164,
        options: {
          channel: "sms",
        },
      });

      if (error) {
        setAuthError(getFriendlyAuthErrorMessage(error));
        setIsSendingOtp(false);
        return;
      }

      setFormattedPhone(validation.e164);
      setDisplayPhone(validation.display);
      setPhoneStep("otp");
      setResendCountdown(30);
      setAuthSuccess(`Verification code sent to ${validation.display}`);
    } catch (err) {
      console.error("Phone OTP send exception:", err);
      setAuthError(getFriendlyAuthErrorMessage(err));
    } finally {
      setIsSendingOtp(false);
    }
  };

  // OPTION B - Step 2: Verify OTP
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setAuthSuccess(null);

    const cleanOtp = otpCode.trim();
    if (!cleanOtp || cleanOtp.length < 6) {
      setAuthError("Please enter the complete 6-digit verification code.");
      return;
    }

    setIsVerifyingOtp(true);

    try {
      const supabase = createBrowserClient();
      const { data, error } = await supabase.auth.verifyOtp({
        phone: formattedPhone,
        token: cleanOtp,
        type: "sms",
      });

      if (error) {
        setAuthError(getFriendlyAuthErrorMessage(error));
        setIsVerifyingOtp(false);
        return;
      }

      if (data.session && data.user) {
        await refreshUser();

        // Check if user has complete profile information
        if (!isProfileComplete(data.user)) {
          // Transition to quick profile step
          setPhoneStep("profile");
          setIsVerifyingOtp(false);
          return;
        }

        setAuthSuccess("Successfully verified! Redirecting to your account...");
        setTimeout(() => {
          router.replace(redirectPath);
        }, 500);
      }
    } catch (err) {
      console.error("Phone OTP verify exception:", err);
      setAuthError(getFriendlyAuthErrorMessage(err));
      setIsVerifyingOtp(false);
    }
  };

  // OPTION B - Step 3: Complete Profile for Phone Users
  const handleCompleteProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);

    const cleanName = fullName.trim();
    if (!cleanName || cleanName.length < 2) {
      setAuthError("Please enter your full name (minimum 2 characters).");
      return;
    }

    const cleanEmail = emailAddress.trim();
    if (cleanEmail && (!cleanEmail.includes("@") || !cleanEmail.includes("."))) {
      setAuthError("Please enter a valid email address.");
      return;
    }

    setIsSavingProfile(true);

    try {
      const supabase = createBrowserClient();
      const updateData: {
        data: Record<string, string>;
        email?: string;
      } = {
        data: {
          full_name: cleanName,
          name: cleanName,
          phone: formattedPhone,
        },
      };

      if (cleanEmail) {
        updateData.email = cleanEmail;
      }

      const { error } = await supabase.auth.updateUser(updateData);
      if (error) {
        setAuthError(getFriendlyAuthErrorMessage(error));
        setIsSavingProfile(false);
        return;
      }

      await refreshUser();
      setAuthSuccess("Welcome to SaiSrujana! Redirecting...");
      setTimeout(() => {
        router.replace(redirectPath);
      }, 500);
    } catch (err) {
      console.error("Profile complete exception:", err);
      setAuthError(getFriendlyAuthErrorMessage(err));
      setIsSavingProfile(false);
    }
  };

  // OPTION C: Traditional Email & Password (Foldable)
  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setAuthSuccess(null);

    const cleanEmail = email.trim();
    if (!cleanEmail || !cleanEmail.includes("@")) {
      setAuthError("Please enter a valid email address.");
      return;
    }
    if (!password) {
      setAuthError("Please enter your password.");
      return;
    }

    setIsEmailSubmitting(true);

    try {
      const supabase = createBrowserClient();
      const { data, error } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password,
      });

      if (error) {
        setAuthError(getFriendlyAuthErrorMessage(error));
        setIsEmailSubmitting(false);
        return;
      }

      if (data.user) {
        await refreshUser();
        router.replace(redirectPath);
      }
    } catch (err) {
      setAuthError(getFriendlyAuthErrorMessage(err));
      setIsEmailSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#FDFBF7] text-[#2C2420]">
      <Navbar />

      <main className="flex-1 flex items-center justify-center px-4 sm:px-6 py-10 lg:py-16">
        <div className="w-full max-w-md">
          {/* Card Container */}
          <div className="bg-[#FAF7F2] rounded-3xl border border-[#E8E0D2] shadow-xl p-6 sm:p-9 relative overflow-hidden">
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
              <span className="text-[10px] uppercase tracking-wider font-semibold text-[#C5A059] bg-[#FAF0DC] px-2.5 py-0.5 rounded-full border border-[#C5A059]/30">
                Boutique Patron
              </span>
            </div>

            {/* Header */}
            <div className="text-center mb-7">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FAF0DC] border border-[#C5A059]/40 text-[#6E121E] text-[11px] font-semibold tracking-wider mb-2">
                <Sparkles className="w-3 h-3 text-[#C5A059]" />
                <span>{SHOP_CONFIG.brandName} • Armoor</span>
              </div>
              <h1 className="font-serif-luxury text-2xl sm:text-3xl font-bold text-[#1E1715] tracking-tight">
                Patron Sign In / Register
              </h1>
              <p className="text-xs sm:text-sm text-[#5A4E46] font-light mt-1.5 leading-relaxed">
                Log in to view saved wishlists, track saree deliveries, and connect with boutique styling.
              </p>
            </div>

            {/* Error Message */}
            {authError && (
              <div
                role="alert"
                className="mb-5 p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs flex items-start gap-2.5 animate-in fade-in"
              >
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                <span className="leading-relaxed">{authError}</span>
              </div>
            )}

            {/* Success Message */}
            {authSuccess && (
              <div
                role="status"
                className="mb-5 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2.5 animate-in fade-in"
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span className="leading-relaxed">{authSuccess}</span>
              </div>
            )}

            {/* CASE 1: PHONE STEP === "profile" (FIRST-TIME USER PROFILE COMPLETION) */}
            {phoneStep === "profile" ? (
              <form onSubmit={handleCompleteProfile} className="space-y-4">
                <div className="p-3 bg-[#FAF0DC]/60 rounded-xl border border-[#C5A059]/40 text-xs text-[#5C4D44] space-y-1">
                  <p className="font-bold text-[#6E121E] flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-[#C5A059]" />
                    <span>Complete your profile</span>
                  </p>
                  <p className="text-[11px] leading-relaxed">
                    Please provide your name so we can address you warmly on your orders and WhatsApp communication.
                  </p>
                </div>

                <div>
                  <label
                    htmlFor="patron-full-name"
                    className="block text-xs font-semibold uppercase tracking-wider text-[#5A4E46] mb-1.5"
                  >
                    Full Name <span className="text-[#6E121E]">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#8C7A6B]">
                      <UserIcon className="w-4 h-4" />
                    </div>
                    <input
                      id="patron-full-name"
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="e.g. Gayatri Adepu"
                      className="w-full pl-10 pr-4 py-2.5 bg-white border border-[#E8E0D2] focus:border-[#6E121E] focus:ring-1 focus:ring-[#6E121E] rounded-xl text-xs sm:text-sm text-[#2C2420] placeholder-[#8C7A6B] transition shadow-xs"
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="patron-email-optional"
                    className="block text-xs font-semibold uppercase tracking-wider text-[#5A4E46] mb-1.5"
                  >
                    Email Address (Optional)
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#8C7A6B]">
                      <Mail className="w-4 h-4" />
                    </div>
                    <input
                      id="patron-email-optional"
                      type="email"
                      value={emailAddress}
                      onChange={(e) => setEmailAddress(e.target.value)}
                      placeholder="name@example.com (for receipts)"
                      className="w-full pl-10 pr-4 py-2.5 bg-white border border-[#E8E0D2] focus:border-[#6E121E] focus:ring-1 focus:ring-[#6E121E] rounded-xl text-xs sm:text-sm text-[#2C2420] placeholder-[#8C7A6B] transition shadow-xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#5A4E46] mb-1.5">
                    Verified Phone Number
                  </label>
                  <div className="py-2.5 px-3.5 bg-stone-100 border border-[#E8E0D2] rounded-xl text-xs sm:text-sm text-[#5C4D44] font-medium flex items-center justify-between">
                    <span>{displayPhone || formattedPhone}</span>
                    <span className="text-[10px] text-emerald-700 font-bold uppercase tracking-wider">
                      ✓ Verified
                    </span>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSavingProfile}
                  className="w-full py-3 px-4 rounded-xl bg-[#6E121E] hover:bg-[#821524] text-white text-xs sm:text-sm font-semibold uppercase tracking-wider transition shadow-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                >
                  {isSavingProfile ? (
                    <span>Saving Profile...</span>
                  ) : (
                    <>
                      <span>Complete &amp; Enter Boutique</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>

                <div className="text-center pt-2">
                  <button
                    type="button"
                    onClick={() => router.replace(redirectPath)}
                    className="text-xs text-[#8C7A6B] hover:text-[#6E121E] transition underline cursor-pointer"
                  >
                    Skip for now &amp; proceed
                  </button>
                </div>
              </form>
            ) : (
              /* NORMAL LOGIN OPTIONS */
              <div className="space-y-5">
                {/* OPTION A: Google OAuth Button */}
                <div>
                  <button
                    type="button"
                    onClick={handleGoogleSignIn}
                    disabled={isGoogleSubmitting}
                    className="w-full py-3 px-4 rounded-xl border border-[#D5C7B5] bg-white hover:bg-[#FAF7F2] text-[#2C2420] text-xs sm:text-sm font-semibold transition flex items-center justify-center gap-3 cursor-pointer shadow-xs disabled:opacity-60"
                  >
                    <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
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
                    <span>
                      {isGoogleSubmitting ? "Connecting to Google..." : "Continue with Google"}
                    </span>
                  </button>
                </div>

                {/* Divider: OR */}
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-[#E8E0D2]" />
                  </div>
                  <div className="relative flex justify-center text-xs">
                    <span className="bg-[#FAF7F2] px-3 font-semibold text-[#8C7A6B] uppercase tracking-wider">
                      Or continue with
                    </span>
                  </div>
                </div>

                {/* OPTION B: Phone OTP Login Flow */}
                <div className="p-4 sm:p-5 rounded-2xl bg-white border border-[#E8E0D2] shadow-2xs space-y-4">
                  <div className="flex items-center gap-2 text-[#6E121E]">
                    <Phone className="w-4 h-4 text-[#C5A059]" />
                    <span className="font-serif-luxury font-bold text-sm sm:text-base text-[#1E1715]">
                      Continue with Phone
                    </span>
                  </div>

                  {phoneStep === "input" && (
                    <form onSubmit={handleSendOtp} className="space-y-3">
                      <div>
                        <label
                          htmlFor="phone-input"
                          className="block text-[11px] font-semibold uppercase tracking-wider text-[#5A4E46] mb-1.5"
                        >
                          Phone Number (10 digits)
                        </label>
                        <div className="flex">
                          <span className="inline-flex items-center px-3 rounded-l-xl border border-r-0 border-[#E8E0D2] bg-[#FAF0DC]/50 text-xs font-bold text-[#6E121E]">
                            +91
                          </span>
                          <input
                            id="phone-input"
                            type="tel"
                            inputMode="numeric"
                            maxLength={10}
                            value={phoneNumber}
                            onChange={(e) => {
                              const val = e.target.value.replace(/[^0-9]/g, "");
                              setPhoneNumber(val);
                            }}
                            placeholder="Enter 10-digit mobile number"
                            className="flex-1 w-full px-3 py-2.5 bg-white border border-[#E8E0D2] focus:border-[#6E121E] focus:ring-1 focus:ring-[#6E121E] rounded-r-xl text-xs sm:text-sm text-[#2C2420] placeholder-[#8C7A6B] transition"
                          />
                        </div>
                        <p className="text-[10px] text-[#8C7A6B] mt-1 font-light">
                          We will send a 6-digit one-time password (OTP) via SMS.
                        </p>
                      </div>

                      <button
                        type="submit"
                        disabled={isSendingOtp || phoneNumber.length < 10}
                        className="w-full py-2.5 px-4 rounded-xl bg-[#6E121E] hover:bg-[#821524] text-white text-xs sm:text-sm font-semibold uppercase tracking-wider transition shadow-2xs flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                      >
                        {isSendingOtp ? (
                          <span>Sending OTP...</span>
                        ) : (
                          <>
                            <span>Send OTP</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </>
                        )}
                      </button>
                    </form>
                  )}

                  {phoneStep === "otp" && (
                    <form onSubmit={handleVerifyOtp} className="space-y-3.5 animate-in fade-in">
                      <div className="flex items-center justify-between text-xs pb-1 border-b border-[#E8E0D2]">
                        <span className="text-[#5A4E46]">
                          Sent to: <strong>{displayPhone}</strong>
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            setPhoneStep("input");
                            setOtpCode("");
                            setAuthError(null);
                          }}
                          className="text-[11px] font-semibold text-[#6E121E] hover:underline cursor-pointer"
                        >
                          Edit Number
                        </button>
                      </div>

                      <div>
                        <label
                          htmlFor="otp-input"
                          className="block text-[11px] font-semibold uppercase tracking-wider text-[#5A4E46] mb-1.5"
                        >
                          Enter 6-Digit OTP
                        </label>
                        <input
                          id="otp-input"
                          type="text"
                          inputMode="numeric"
                          maxLength={6}
                          autoFocus
                          value={otpCode}
                          onChange={(e) => {
                            const val = e.target.value.replace(/[^0-9]/g, "");
                            setOtpCode(val);
                          }}
                          placeholder="• • • • • •"
                          className="w-full text-center tracking-[0.4em] py-2.5 bg-[#FAF7F2] border border-[#E8E0D2] focus:border-[#6E121E] focus:ring-1 focus:ring-[#6E121E] rounded-xl text-lg font-bold text-[#1E1715] placeholder-stone-400 transition"
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={isVerifyingOtp || otpCode.length < 6}
                        className="w-full py-2.5 px-4 rounded-xl bg-[#6E121E] hover:bg-[#821524] text-white text-xs sm:text-sm font-semibold uppercase tracking-wider transition shadow-2xs flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                      >
                        {isVerifyingOtp ? (
                          <span>Verifying OTP...</span>
                        ) : (
                          <>
                            <span>Verify OTP &amp; Sign In</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </>
                        )}
                      </button>

                      <div className="flex items-center justify-between pt-1 text-[11px] text-[#8C7A6B]">
                        <span>Didn&apos;t receive code?</span>
                        {resendCountdown > 0 ? (
                          <span className="text-[#8C7A6B]">Resend in {resendCountdown}s</span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleSendOtp()}
                            disabled={isSendingOtp}
                            className="font-semibold text-[#6E121E] hover:underline inline-flex items-center gap-1 cursor-pointer"
                          >
                            <RefreshCw className="w-3 h-3" />
                            <span>Resend OTP</span>
                          </button>
                        )}
                      </div>
                    </form>
                  )}
                </div>

                {/* OPTION C: Foldable Email & Password Login */}
                <div className="pt-2 border-t border-[#E8E0D2]">
                  <button
                    type="button"
                    onClick={() => setShowEmailLogin(!showEmailLogin)}
                    className="w-full flex items-center justify-between py-2 text-xs font-semibold text-[#5A4E46] hover:text-[#6E121E] transition cursor-pointer"
                  >
                    <span>Or sign in with Email &amp; Password</span>
                    {showEmailLogin ? (
                      <ChevronUp className="w-4 h-4 text-[#8C7A6B]" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-[#8C7A6B]" />
                    )}
                  </button>

                  {showEmailLogin && (
                    <form
                      onSubmit={handleEmailSignIn}
                      className="mt-3 space-y-3 pt-3 border-t border-[#E8E0D2]/60 animate-in fade-in"
                    >
                      <div>
                        <label
                          htmlFor="customer-email"
                          className="block text-[11px] font-semibold uppercase tracking-wider text-[#5A4E46] mb-1"
                        >
                          Email Address
                        </label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#8C7A6B]">
                            <Mail className="w-3.5 h-3.5" />
                          </div>
                          <input
                            id="customer-email"
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="name@example.com"
                            autoComplete="email"
                            className="w-full pl-9 pr-3 py-2 bg-white border border-[#E8E0D2] focus:border-[#6E121E] focus:ring-1 focus:ring-[#6E121E] rounded-xl text-xs text-[#2C2420] placeholder-[#8C7A6B] transition"
                          />
                        </div>
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label
                            htmlFor="customer-password"
                            className="block text-[11px] font-semibold uppercase tracking-wider text-[#5A4E46]"
                          >
                            Password
                          </label>
                          <Link
                            href="/forgot-password"
                            className="text-[10px] text-[#6E121E] hover:underline font-medium"
                          >
                            Forgot?
                          </Link>
                        </div>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#8C7A6B]">
                            <Lock className="w-3.5 h-3.5" />
                          </div>
                          <input
                            id="customer-password"
                            type={showPassword ? "text" : "password"}
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Enter password"
                            autoComplete="current-password"
                            className="w-full pl-9 pr-9 py-2 bg-white border border-[#E8E0D2] focus:border-[#6E121E] focus:ring-1 focus:ring-[#6E121E] rounded-xl text-xs text-[#2C2420] placeholder-[#8C7A6B] transition"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            aria-label={showPassword ? "Hide password" : "Show password"}
                            className="absolute inset-y-0 right-0 pr-3 flex items-center text-[#8C7A6B] hover:text-[#2C2420] cursor-pointer"
                          >
                            {showPassword ? (
                              <EyeOff className="w-3.5 h-3.5" />
                            ) : (
                              <Eye className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </div>

                      <button
                        type="submit"
                        disabled={isEmailSubmitting}
                        className="w-full py-2.5 px-4 rounded-xl bg-[#6E121E] hover:bg-[#821524] text-white text-xs font-semibold uppercase tracking-wider transition shadow-2xs flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                      >
                        {isEmailSubmitting ? <span>Signing In...</span> : <span>Sign In</span>}
                      </button>

                      <div className="text-center text-[11px] text-[#5A4E46]">
                        <span>Need a password account? </span>
                        <Link
                          href={`/signup${redirectPath !== "/account" ? `?redirect=${encodeURIComponent(redirectPath)}` : ""}`}
                          className="font-bold text-[#6E121E] hover:underline"
                        >
                          Register here
                        </Link>
                      </div>
                    </form>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Guest Browsing Quick Link */}
          <div className="mt-5 text-center flex flex-col items-center gap-2">
            <Link
              href="/sarees"
              className="inline-flex items-center gap-1.5 text-xs text-[#8C7A6B] hover:text-[#6E121E] transition"
            >
              <ShoppingBag className="w-3.5 h-3.5 text-[#C5A059]" />
              <span>Browse saree catalogue as guest</span>
            </Link>

            <div className="flex items-center gap-1.5 text-[11px] text-[#8C7A6B] font-light">
              <ShieldCheck className="w-3.5 h-3.5 text-[#1E3F34]" />
              <span>Direct handloom sales • 100% Genuine Sarees</span>
            </div>
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
