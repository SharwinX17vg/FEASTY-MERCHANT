"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";

import { Card, Input, PrimaryButton } from "@/components/ui";
import { OnboardingProgress } from "@/components/onboarding/OnboardingProgress";

export default function BusinessDetailsPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const [category, setCategory] = useState("");

  useEffect(() => {
    fetch("/api/onboarding/state")
      .then(async (response) => {
        if (!response.ok) return;
        const result = (await response.json()) as { category?: string; state?: string };
        setCategory(result.category ?? "");
        if (result.state === "NOT_STARTED") router.push("/register/business-type");
        if (result.state === "BUSINESS_CREATED") router.push("/register/branch");
        if (result.state === "BRANCH_CREATED" || result.state === "VERIFICATION_IN_PROGRESS") router.push("/register/verification");
        if (result.state === "COMPLETED") router.push("/dashboard");
      })
      .catch(() => setError("Unable to load saved onboarding progress."));
  }, [router]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError("");
    const data = new FormData(event.currentTarget);
    try {
      const response = await fetch("/api/onboarding/business", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: data.get("name"),
          email: data.get("email"),
          phone: data.get("phone"),
          category,
        }),
      });
      const result = (await response.json()) as { message?: string };
      if (!response.ok) setError(result.message ?? "Unable to save business details.");
      else router.push("/register/branch");
    } catch {
      setError("Unable to reach the onboarding service.");
    } finally {
      setPending(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-6 py-16">
      <Card className="w-full max-w-xl p-6 sm:p-9">
        <OnboardingProgress currentStep={2} />
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-accent">Step 2 of 4</p>
        <h1 className="mt-3 text-3xl font-semibold text-white">Add your business details</h1>
        <p className="mt-3 text-sm leading-6 text-muted">You can return and finish this setup later.</p>
        {error ? <p className="mt-5 rounded-xl bg-red-400/10 px-4 py-3 text-sm text-red-200" role="alert">{error}</p> : null}
        <form className="mt-7 space-y-5" onSubmit={handleSubmit}>
          <Input label="Business name" name="name" required />
          <Input autoComplete="email" label="Business email" name="email" type="email" />
          <Input autoComplete="tel" label="Business phone" name="phone" type="tel" />
          <PrimaryButton className="w-full" disabled={pending || !category} type="submit">
            {pending ? "Saving…" : "Continue"}
          </PrimaryButton>
        </form>
      </Card>
    </main>
  );
}
