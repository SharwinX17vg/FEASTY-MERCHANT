import { getOnboardingRoute, isOnboardingState } from "../onboarding/state.ts";

export function getSignupRedirectPath(
  result: { confirmed?: boolean; onboardingState?: string },
) {
  if (!result.confirmed) return "/check-email";
  if (result.onboardingState && isOnboardingState(result.onboardingState)) {
    return getOnboardingRoute(result.onboardingState);
  }
  return "/register/business-type";
}
