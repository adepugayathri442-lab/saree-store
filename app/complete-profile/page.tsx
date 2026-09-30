"use client";

import { Suspense, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  User as UserIcon,
  Mail,
  Sparkles,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  ShieldCheck,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { createBrowserClient } from "@/lib/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { formatIndianPhoneNumber, getFriendlyAuthErrorMessage } from "@/lib/supabase/auth";
import { SHOP_CONFIG } from "@/config/shop";

function CompleteProfileForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectPath = searchParams.get("redirect") || "/account";

  const { user, isLoading: isAuthLoading, refreshUser } = useAuth();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);

  // Prepopulate existing information from Supabase user object
  useEffect(() => {
    if (!isAuthLoading && !user) {
      // If not logged in, take them to login
      router.replace(`/login?redirect=${encodeURIComponent(redirectPath)}`);
      return;
    }

    if (user) {
      const meta = user.user_metadata || {};
      const existingName = meta.full_name || meta.name || "";
      const existingEmail = user.email || meta.email || "";
      const existingPhone = user.phone || meta.phone || "";

      // If user already has full name and at least one contact method, do NOT ask repeatedly
      if (existingName.trim().length > 1 && (existingEmail || existingPhone)) {
        router.replace(redirectPath);
        return;
      }

      setFullName(existingName);
      setEmail(existingEmail);
      if (existingPhone) {
        // Format to 10 digits for input
        const digits = existingPhone.replace(/[^0-9]/g, "");
        setPhoneNumber(digits.length === 12 && digits.startsWith("91") ? digits.slice(2) : digits);
      }
    }
  }, [user, isAuthLoading, router, redirectPath]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFormSuccess(null);

    const cleanName = fullName.trim();
    if (!cleanName || cleanName.length < 2) {
      setFormError("Please enter your full name (minimum 2 characters).");
      return;
    }

    const cleanEmail = email.trim();
    if (cleanEmail && (!cleanEmail.includes("@") || !cleanEmail.includes("."))) {
      setFormError("Please enter a valid email address.");
      return;
    }

    let formattedPhone = "";
    if (phoneNumber.trim()) {
      const phoneValidation = formatIndianPhoneNumber(phoneNumber);
      if (!phoneValidation.isValid) {
        setFormError(phoneValidation.errorMessage || "Please enter a valid 10-digit mobile number.");
        return;
      }
      formattedPhone = phoneValidation.e164;
    }

    setIsSubmitting(true);

    try {
      const supabase = createBrowserClient();

      const updatePayload: {
        data: Record<string, string>;
        email?: string;
      } = {
        data: {
          full_name: cleanName,
          name: cleanName,
        },
      };

      if (formattedPhone) {
        updatePayload.data.phone = formattedPhone;
      }

      if (cleanEmail && cleanEmail !== user?.email) {
        updatePayload.email = cleanEmail;
      }

      const { error: updateError } = await supabase.auth.updateUser(updatePayload);

      if (updateError) {
        setFormError(getFriendlyAuthErrorMessage(updateError));
        setIsSubmitting(false);
        return;
      }

      await refreshUser();
      setFormSuccess("Profile saved! Redirecting to your destination...");

      setTimeout(() => {
        router.replace(redirectPath);
      }, 700);
    } catch (err) {
      console.error("Profile save error:", err);
      setFormError(getFriendlyAuthErrorMessage(err));
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#FDFBF7] text-[#2C2420]">
      <Navbar />

      <main className="flex-1 flex items-center justify-center px-4 sm:px-6 py-12 lg:py-16">
        <div className="w-full max-w-md">
          <div className="bg-[#FAF7F2] rounded-3xl border border-[#E8E0D2] shadow-xl p-6 sm:p-10 relative overflow-hidden">
            {/* Top Ornamental Bar */}
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#6E121E] via-[#C5A059] to-[#6E121E]" />

            {/* Header */}
            <div className="text-center mb-8">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FAF0DC] border border-[#C5A059]/40 text-[#6E121E] text-[11px] font-semibold tracking-wider mb-2">
                <Sparkles className="w-3.5 h-3.5 text-[#C5A059]" />
                <span>{SHOP_CONFIG.brandName} • Armoor</span>
              </div>
              <h1 className="font-serif-luxury text-2xl sm:text-3xl font-bold text-[#1E1715] tracking-tight">
                Complete Your Profile
              </h1>
              <p className="text-xs sm:text-sm text-[#5A4E46] font-light mt-1.5 leading-relaxed">
                Welcome to our boutique family! Please confirm your patron details for smooth order updates and concierge communication.
              </p>
            </div>

            {/* Error Message */}
            {formError && (
              <div
                role="alert"
                className="mb-6 p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs flex items-start gap-2.5 animate-in fade-in"
              >
                <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                <span className="leading-relaxed">{formError}</span>
              </div>
            )}

            {/* Success Message */}
            {formSuccess && (
              <div
                role="status"
                className="mb-6 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2.5 animate-in fade-in"
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span>{formSuccess}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Full Name */}
              <div>
                <label
                  htmlFor="profile-full-name"
                  className="block text-xs font-semibold uppercase tracking-wider text-[#5A4E46] mb-1.5"
                >
                  Full Name <span className="text-[#6E121E]">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#8C7A6B]">
                    <UserIcon className="w-4 h-4" />
                  </div>
                  <input
                    id="profile-full-name"
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Srujana Adepu"
                    className="w-full pl-10 pr-4 py-2.5 bg-white border border-[#E8E0D2] focus:border-[#6E121E] focus:ring-1 focus:ring-[#6E121E] rounded-xl text-xs sm:text-sm text-[#2C2420] placeholder-[#8C7A6B] transition shadow-xs"
                  />
                </div>
              </div>

              {/* Email Address */}
              <div>
                <label
                  htmlFor="profile-email"
                  className="block text-xs font-semibold uppercase tracking-wider text-[#5A4E46] mb-1.5"
                >
                  Email Address {user?.email ? "(Verified)" : "(Optional)"}
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#8C7A6B]">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    id="profile-email"
                    type="email"
                    value={email}
                    disabled={Boolean(user?.email)}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="w-full pl-10 pr-4 py-2.5 bg-white disabled:bg-stone-100 border border-[#E8E0D2] focus:border-[#6E121E] focus:ring-1 focus:ring-[#6E121E] rounded-xl text-xs sm:text-sm text-[#2C2420] placeholder-[#8C7A6B] transition shadow-xs"
                  />
                </div>
              </div>

              {/* Phone Number */}
              <div>
                <label
                  htmlFor="profile-phone"
                  className="block text-xs font-semibold uppercase tracking-wider text-[#5A4E46] mb-1.5"
                >
                  Mobile Number {user?.phone ? "(Verified via OTP)" : "(For Order WhatsApp Updates)"}
                </label>
                <div className="relative flex">
                  <span className="inline-flex items-center px-3 rounded-l-xl border border-r-0 border-[#E8E0D2] bg-[#FAF0DC]/50 text-xs font-bold text-[#6E121E]">
                    +91
                  </span>
                  <div className="relative flex-1">
                    <input
                      id="profile-phone"
                      type="tel"
                      inputMode="numeric"
                      maxLength={10}
                      disabled={Boolean(user?.phone)}
                      value={phoneNumber}
                      onChange={(e) => {
                        const val = e.target.value.replace(/[^0-9]/g, "");
                        setPhoneNumber(val);
                      }}
                      placeholder="10-digit mobile number"
                      className="w-full pl-3 pr-4 py-2.5 bg-white disabled:bg-stone-100 border border-[#E8E0D2] focus:border-[#6E121E] focus:ring-1 focus:ring-[#6E121E] rounded-r-xl text-xs sm:text-sm text-[#2C2420] placeholder-[#8C7A6B] transition shadow-xs"
                    />
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full mt-2 py-3 px-4 rounded-xl bg-[#6E121E] hover:bg-[#821524] text-white text-xs sm:text-sm font-semibold uppercase tracking-wider transition shadow-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
              >
                {isSubmitting ? (
                  <span>Saving Profile...</span>
                ) : (
                  <>
                    <span>Save &amp; Continue</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            {/* Skip for now option */}
            <div className="mt-6 text-center pt-4 border-t border-[#E8E0D2]">
              <Link
                href={redirectPath}
                className="text-xs text-[#8C7A6B] hover:text-[#6E121E] transition underline font-medium"
              >
                Skip for now &amp; proceed to boutique
              </Link>
            </div>
          </div>

          <div className="mt-4 text-center text-xs text-[#8C7A6B] flex items-center justify-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-[#1E3F34]" />
            <span>SaiSrujana values your privacy. Your details are never shared.</span>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

export default function CompleteProfilePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[#FDFBF7]">
          <div className="w-8 h-8 border-2 border-[#6E121E] border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <CompleteProfileForm />
    </Suspense>
  );
}
