export const ONBOARDING_STATES = {
  NOT_STARTED: "NOT_STARTED",
  BUSINESS_TYPE_SELECTED: "BUSINESS_TYPE_SELECTED",
  BUSINESS_CREATED: "BUSINESS_CREATED",
  BRANCH_CREATED: "BRANCH_CREATED",
  VERIFICATION_IN_PROGRESS: "VERIFICATION_IN_PROGRESS",
  COMPLETED: "COMPLETED",
} as const;

export type OnboardingState =
  (typeof ONBOARDING_STATES)[keyof typeof ONBOARDING_STATES];

export type OnboardingSnapshot = {
  category?: string | null;
  business?: { id: string; name?: string; category?: string } | null;
  branch?: { id: string; name?: string } | null;
  verification?: { id?: string; status: string } | null;
};

export function resolveOnboardingState(
  snapshot: OnboardingSnapshot,
): OnboardingState {
  if (snapshot.verification?.status === "approved") {
    return ONBOARDING_STATES.COMPLETED;
  }
  if (["submitted", "under_review"].includes(snapshot.verification?.status ?? "")) {
    return ONBOARDING_STATES.VERIFICATION_IN_PROGRESS;
  }
  if (snapshot.branch) return ONBOARDING_STATES.BRANCH_CREATED;
  if (snapshot.business) return ONBOARDING_STATES.BUSINESS_CREATED;
  if (snapshot.category) return ONBOARDING_STATES.BUSINESS_TYPE_SELECTED;
  return ONBOARDING_STATES.NOT_STARTED;
}

export function getOnboardingRoute(state: OnboardingState) {
  switch (state) {
    case ONBOARDING_STATES.NOT_STARTED:
      return "/register/business-type";
    case ONBOARDING_STATES.BUSINESS_TYPE_SELECTED:
      return "/register/business";
    case ONBOARDING_STATES.BUSINESS_CREATED:
      return "/register/branch";
    case ONBOARDING_STATES.BRANCH_CREATED:
      return "/register/verification";
    case ONBOARDING_STATES.VERIFICATION_IN_PROGRESS:
    case ONBOARDING_STATES.COMPLETED:
      return "/dashboard";
  }
}

export function isOnboardingState(value: unknown): value is OnboardingState {
  return Object.values(ONBOARDING_STATES).includes(value as OnboardingState);
}
