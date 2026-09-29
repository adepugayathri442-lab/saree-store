"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Mail,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  CheckCircle2,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { createBrowserClient } from "@/lib/supabase/client";
import { getWhatsAppUrl } from "@/config/shop";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [resetSent, setResetSent] = useState(false);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);

    const cleanEmail = email.trim();
    if (!cleanEmail || !cleanEmail.includes("@") || !cleanEmail.includes(".")) {
      setAuthError("Please enter a valid email address registered with SaiSrujana.");
      return;
    }

    setIsSubmitting(true);

    try {
      const supabase = createBrowserClient();
      const origin = typeof window !== "undefined" ? window.location.origin : "";

      const { error } = await supabase.auth.resetPasswordForEmail(cleanEmail, {
        redirectTo: `${origin}/login`,
      });

      if (error) {
        setAuthError(error.message);
        setIsSubmitting(false);
        return;
      }

      setResetSent(true);
      setIsSubmitting(false);
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : "An unexpected error occurred while processing your request.";
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

            {/* Back to Login Link */}
            <div className="mb-6">
              <Link
                href="/login"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#8C7A6B] hover:text-[#6E121E] transition"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back to Sign In</span>
              </Link>
            </div>

            {/* Header */}
            <div className="text-center mb-8">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FAF0DC] border border-[#C5A059]/40 text-[#6E121E] text-[11px] font-semibold tracking-wider mb-2">
                <Sparkles className="w-3 h-3 text-[#C5A059]" />
                <span>Account Recovery</span>
              </div>
              <h1 className="font-serif-luxury text-2xl sm:text-3xl font-bold text-[#1E1715] tracking-tight">
                Reset Password
              </h1>
              <p className="text-xs sm:text-sm text-[#5A4E46] font-light mt-1.5">
                Enter your registered email address and we will send you secure password reset instructions.
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

            {/* Success State */}
            {resetSent ? (
              <div className="p-6 rounded-2xl bg-[#E8F3EE] border border-[#1E3F34]/30 text-center space-y-4">
                <div className="w-12 h-12 rounded-full bg-[#1E3F34]/10 border border-[#1E3F34]/30 flex items-center justify-center mx-auto text-[#1E3F34]">
                  <CheckCircle2 className="w-6 h-6 text-[#1E3F34]" />
                </div>
                <h3 className="font-serif-luxury text-lg font-bold text-[#1E3F34]">
                  Reset Instructions Sent
                </h3>
                <p className="text-xs text-[#2C2420] leading-relaxed">
                  We have sent password reset instructions to{" "}
                  <strong className="font-semibold text-[#1E3F34]">{email}</strong>. Please check your inbox and follow the link to reset your password.
                </p>
                <div className="pt-2">
                  <Link
                    href="/login"
                    className="inline-flex items-center gap-2 py-2.5 px-6 rounded-xl bg-[#6E121E] text-white text-xs font-semibold uppercase tracking-wider hover:bg-[#821524] transition shadow-xs"
                  >
                    <span>Return to Sign In</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ) : (
              /* Reset Request Form */
              <form onSubmit={handleResetPassword} className="space-y-4">
                <div>
                  <label
                    htmlFor="reset-email"
                    className="block text-xs font-semibold uppercase tracking-wider text-[#5A4E46] mb-1.5"
                  >
                    Registered Email Address
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#8C7A6B]">
                      <Mail className="w-4 h-4" />
                    </div>
                    <input
                      id="reset-email"
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

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3 px-4 rounded-xl bg-[#6E121E] hover:bg-[#821524] text-white text-xs sm:text-sm font-semibold uppercase tracking-wider transition shadow-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                >
                  {isSubmitting ? (
                    <span>Sending Reset Link...</span>
                  ) : (
                    <>
                      <span>Send Reset Link</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            )}

            {/* Assistance note */}
            <div className="mt-8 text-center pt-5 border-t border-[#E8E0D2] text-xs text-[#8C7A6B]">
              <span>Need personal assistance? </span>
              <a
                href={getWhatsAppUrl("Hello Gangadhar garu, I need assistance logging into my SaiSrujana account.")}
                target="_blank"
                rel="noopener noreferrer"
                className="font-bold text-[#6E121E] hover:underline"
              >
                Contact Gangadhar on WhatsApp
              </a>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
