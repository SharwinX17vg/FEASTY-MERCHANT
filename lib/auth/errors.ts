export const NETWORK_ERROR_MESSAGE =
  "Unable to connect right now. Please check your internet connection and try again.";

const SAFE_MESSAGES = new Set([
  "Email or password is incorrect.",
  "If you recently signed up, confirm your email before signing in. Check your inbox and spam folder; otherwise verify your email and password.",
  "Too many sign-in attempts were made. Wait a few minutes and try again.",
  "Unable to sign in right now. Please try again later.",
  "This recovery link is invalid or expired.",
  "We couldn't create an account with those details. Try signing in or resetting the password if you already registered.",
  "This phone number is already linked to an account. Try another number or sign in.",
  "Choose a stronger password that meets the requirements shown in the form.",
  "Supabase rejected this email address. Check it or try another address.",
  "Supabase's default email service only sends to authorized project members. Configure custom SMTP to send confirmation emails to other addresses.",
  "Email signups are disabled for this Supabase project. Enable email signups in Supabase Auth settings.",
  "Too many confirmation emails were requested. Wait before trying again.",
  "Too many signup attempts were made. Wait a few minutes and try again.",
  "Signup is not configured. Please contact the site administrator.",
  "Authentication setup is incomplete. Configure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY in the Merchant app's .env.local file, then rebuild and restart the app.",
  "Unable to send a reset email.",
  "Unable to reset your password.",
  "Google sign-in isn't enabled in Supabase yet. Enable the Google provider and add its OAuth client ID and secret.",
  "Supabase rejected the Google sign-in redirect. Add this app's URL to the Supabase Auth redirect allow list.",
  "Google sign-in is unavailable. Check the Google provider configuration in Supabase Auth.",
  "The login service is unavailable. Please try again later.",
  "The signup service is unavailable. Please try again later.",
]);

export function getSafeAuthError(
  status: number,
  message: unknown,
  fallback = "Something went wrong. Please try again.",
) {
  if (status === 0) return NETWORK_ERROR_MESSAGE;
  if (typeof message === "string" && SAFE_MESSAGES.has(message)) return message;
  if (status === 401) return "Email or password is incorrect.";
  if (status >= 500) return "The authentication service is temporarily unavailable. Please try again.";
  return fallback;
}

export function getNetworkErrorMessage() {
  return NETWORK_ERROR_MESSAGE;
}
