import { SupabaseConfigurationError } from "../supabase/config-core.ts";

export const AUTH_CONFIGURATION_ERROR_MESSAGE =
  "Authentication setup is incomplete. Configure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY in the Merchant app's .env.local file, then rebuild and restart the app.";

type SupabaseAuthErrorDetails = { code?: string; status?: number };

export function getSupabaseAuthErrorDetails(error: unknown): SupabaseAuthErrorDetails {
  if (!error || typeof error !== "object") return {};

  const candidate = error as Record<string, unknown>;
  return {
    code: typeof candidate.code === "string" ? candidate.code : undefined,
    status:
      typeof candidate.status === "number" &&
      Number.isInteger(candidate.status) &&
      candidate.status >= 400 &&
      candidate.status <= 599
        ? candidate.status
        : undefined,
  };
}

export function getSignupProviderErrorMessage(code?: string) {
  switch (code) {
    case "email_exists":
    case "user_already_exists":
      return "We couldn't create an account with those details. Try signing in or resetting the password if you already registered.";
    case "phone_exists":
      return "This phone number is already linked to an account. Try another number or sign in.";
    case "weak_password":
      return "Choose a stronger password that meets the requirements shown in the form.";
    case "email_address_invalid":
      return "Supabase rejected this email address. Check it or try another address.";
    case "email_address_not_authorized":
      return "Supabase's default email service only sends to authorized project members. Configure custom SMTP to send confirmation emails to other addresses.";
    case "email_provider_disabled":
    case "signup_disabled":
      return "Email signups are disabled for this Supabase project. Enable email signups in Supabase Auth settings.";
    case "over_email_send_rate_limit":
      return "Too many confirmation emails were requested. Wait before trying again.";
    case "over_request_rate_limit":
      return "Too many signup attempts were made. Wait a few minutes and try again.";
    default:
      return "Unable to create your account. Check your details and try again.";
  }
}

export function getGoogleProviderErrorMessage(code?: string, providerMessage?: string) {
  const normalizedMessage = providerMessage?.toLowerCase() ?? "";
  if (
    code === "provider_disabled" ||
    code === "oauth_provider_not_supported" ||
    normalizedMessage.includes("unsupported provider") ||
    normalizedMessage.includes("provider is not enabled")
  ) {
    return "Google sign-in isn't enabled in Supabase yet. Enable the Google provider and add its OAuth client ID and secret.";
  }
  if (code === "validation_failed") {
    return "Supabase rejected the Google sign-in redirect. Add this app's URL to the Supabase Auth redirect allow list.";
  }
  return "Google sign-in is unavailable. Check the Google provider configuration in Supabase Auth.";
}

export function getAuthRouteFailure(error: unknown, fallbackMessage: string) {
  if (error instanceof SupabaseConfigurationError) {
    console.error("Supabase authentication configuration is incomplete.", {
      missingVariables: error.missingVariables,
    });
    return { message: AUTH_CONFIGURATION_ERROR_MESSAGE, status: 503 } as const;
  }

  return { message: fallbackMessage, status: 503 } as const;
}
