import { User } from "@supabase/supabase-js";

/**
 * Derives the dynamic OAuth and Magic Link redirect URL.
 * Automatically respects localhost (e.g. http://localhost:3000) during development
 * and production (e.g. https://saisrujana.vercel.app) or Vercel preview URLs.
 *
 * @param destination The path to redirect the user to after authentication (default: /account)
 * @returns Fully-qualified redirect URL pointing to the /auth/callback route
 */
export function getAuthRedirectUrl(destination = "/account"): string {
  const cleanDest = destination.startsWith("/") ? destination : `/${destination}`;

  // If in browser, use the current origin dynamically
  if (typeof window !== "undefined" && window.location?.origin) {
    const origin = window.location.origin.replace(/\/+$/, "");
    return `${origin}/auth/callback?next=${encodeURIComponent(cleanDest)}`;
  }

  // Server-side fallback: check environment variable or default to production domain
  const siteUrl = (
    process.env.NEXT_PUBLIC_SITE_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "https://saisrujana.vercel.app")
  ).replace(/\/+$/, "");

  return `${siteUrl}/auth/callback?next=${encodeURIComponent(cleanDest)}`;
}

/**
 * Validates and formats a mobile number into E.164 international standard (+91XXXXXXXXXX).
 * Specifically optimized for Indian mobile numbers (10 digits).
 */
export function formatIndianPhoneNumber(rawInput: string): {
  isValid: boolean;
  e164: string;
  display: string;
  cleanDigits: string;
  errorMessage?: string;
} {
  const trimmed = rawInput.trim();
  if (!trimmed) {
    return {
      isValid: false,
      e164: "",
      display: "",
      cleanDigits: "",
      errorMessage: "Please enter your mobile phone number.",
    };
  }

  // Remove all non-numeric characters except leading '+'
  let digitsOnly = trimmed.replace(/[^0-9]/g, "");

  // If the user entered country code 91 with 12 digits, strip leading 91
  if (digitsOnly.length === 12 && digitsOnly.startsWith("91")) {
    digitsOnly = digitsOnly.slice(2);
  } else if (digitsOnly.length === 11 && digitsOnly.startsWith("0")) {
    // If the user entered leading 0, strip it
    digitsOnly = digitsOnly.slice(1);
  }

  // Validate 10-digit Indian standard
  if (digitsOnly.length !== 10) {
    return {
      isValid: false,
      e164: "",
      display: trimmed,
      cleanDigits: digitsOnly,
      errorMessage: "Please enter a valid 10-digit mobile number.",
    };
  }

  // First digit of Indian mobile number should generally be 6, 7, 8, or 9
  if (!/^[6-9]/.test(digitsOnly)) {
    return {
      isValid: false,
      e164: "",
      display: trimmed,
      cleanDigits: digitsOnly,
      errorMessage: "Indian mobile numbers must start with 6, 7, 8, or 9.",
    };
  }

  const e164 = `+91${digitsOnly}`;
  const display = `+91 ${digitsOnly.slice(0, 5)} ${digitsOnly.slice(5)}`;

  return {
    isValid: true,
    e164,
    display,
    cleanDigits: digitsOnly,
  };
}

/**
 * Transforms technical Supabase Auth errors into courteous, user-friendly messages
 * appropriate for a luxury saree boutique patron experience.
 */
export function getFriendlyAuthErrorMessage(error: unknown): string {
  if (!error) return "An unexpected error occurred. Please try again.";

  const rawMessage =
    typeof error === "string"
      ? error
      : error instanceof Error
      ? error.message
      : typeof error === "object" && error !== null && "message" in error
      ? String((error as { message: unknown }).message)
      : String(error);

  const lower = rawMessage.toLowerCase();

  // Rate limiting / abuse protection
  if (
    lower.includes("rate limit") ||
    lower.includes("too many requests") ||
    lower.includes("security purposes") ||
    lower.includes("over_email_send_rate_limit") ||
    lower.includes("over_sms_send_rate_limit")
  ) {
    return "Too many OTP requests in a short period. For your security, please wait 60 seconds before trying again.";
  }

  // Invalid or expired OTP token
  if (
    lower.includes("token has expired") ||
    lower.includes("otp expired") ||
    lower.includes("expired")
  ) {
    return "The verification code has expired. Please tap 'Resend OTP' to receive a new code.";
  }

  if (
    lower.includes("invalid token") ||
    lower.includes("token is invalid") ||
    lower.includes("incorrect") ||
    lower.includes("token not found")
  ) {
    return "The 6-digit verification code you entered is incorrect. Please check your messages and try again.";
  }

  // SMS Provider not enabled or misconfigured
  if (
    lower.includes("sms provider") ||
    lower.includes("provider is not enabled") ||
    lower.includes("phone provider") ||
    lower.includes("unsupported phone")
  ) {
    return "Phone SMS service is currently undergoing routine maintenance in our system. Please use 'Continue with Google' to sign in instantly.";
  }

  // Google OAuth cancelled or blocked
  if (
    lower.includes("cancelled") ||
    lower.includes("popup_closed_by_user") ||
    lower.includes("access_denied")
  ) {
    return "Google sign-in was cancelled. You can sign in anytime with Google or Phone.";
  }

  // Invalid login credentials (email/password)
  if (lower.includes("invalid login credentials") || lower.includes("invalid credentials")) {
    return "Invalid email or password. Please verify your details or use Phone OTP / Google.";
  }

  // User already exists
  if (lower.includes("user already registered")) {
    return "An account with this email address already exists. Please sign in instead of registering.";
  }

  // Unconfirmed email
  if (lower.includes("email not confirmed")) {
    return "Your email address has not been confirmed yet. Please check your inbox for the confirmation link.";
  }

  // Network connection errors
  if (
    lower.includes("failed to fetch") ||
    lower.includes("network error") ||
    lower.includes("load failed")
  ) {
    return "Network connectivity issue detected. Please check your internet connection and try again.";
  }

  // Generic fallback without exposing backend stack traces
  return rawMessage.length < 120
    ? rawMessage
    : "Authentication failed. Please verify your information and try again.";
}

/**
 * Checks if an authenticated user profile has the necessary information (e.g. full name).
 */
export function isProfileComplete(user: User | null): boolean {
  if (!user) return false;
  const meta = user.user_metadata;
  const fullName = meta?.full_name || meta?.name;
  return Boolean(typeof fullName === "string" && fullName.trim().length > 1);
}
