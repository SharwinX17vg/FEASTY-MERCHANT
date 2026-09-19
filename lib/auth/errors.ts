export const NETWORK_ERROR_MESSAGE =
  "Unable to connect right now. Please check your internet connection and try again.";

const SAFE_MESSAGES = new Set([
  "Email or password is incorrect.",
  "This recovery link is invalid or expired.",
  "Unable to create your account. Check your details and try again.",
  "Unable to send a reset email.",
  "Unable to reset your password.",
  "Google sign-in is unavailable.",
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
