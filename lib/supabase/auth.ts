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
    lower.includes("over_email_send_rate_limit")
  ) {
    return "Too many requests in a short period. For your security, please wait a moment before trying again.";
  }

  // Google OAuth cancelled or blocked
  if (
    lower.includes("cancelled") ||
    lower.includes("popup_closed_by_user") ||
    lower.includes("access_denied")
  ) {
    return "Google sign-in was cancelled. You can sign in anytime with Google or your email account.";
  }

  // Invalid login credentials (email/password)
  if (lower.includes("invalid login credentials") || lower.includes("invalid credentials")) {
    return "Invalid email or password. Please verify your details or use Continue with Google.";
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
