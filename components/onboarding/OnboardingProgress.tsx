const steps = [
  ["Business Type", "/register/business-type"],
  ["Business Details", "/register/business"],
  ["Branch", "/register/branch"],
  ["Verification", "/register/verification"],
] as const;

export function OnboardingProgress({ currentStep }: { currentStep: number }) {
  return (
    <nav aria-label="Onboarding progress" className="mb-8">
      <ol className="grid grid-cols-4 gap-2">
        {steps.map(([label], index) => {
          const step = index + 1;
          const complete = step < currentStep;
          const current = step === currentStep;
          return (
            <li className="text-center" key={label}>
              <span
                aria-current={current ? "step" : undefined}
                className={`mx-auto flex size-8 items-center justify-center rounded-full text-xs font-semibold ${
                  complete || current
                    ? "bg-primary text-primary-foreground"
                    : "border border-white/20 text-muted"
                }`}
              >
                {complete ? "✓" : step}
              </span>
              <span className={`mt-2 block text-[10px] sm:text-xs ${current ? "text-white" : "text-muted"}`}>
                {label}
              </span>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
