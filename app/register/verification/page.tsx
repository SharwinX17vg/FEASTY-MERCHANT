"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { OnboardingProgress } from "@/components/onboarding/OnboardingProgress";
import { Card, SecondaryButton } from "@/components/ui";
import { PrimaryButton } from "@/components/ui";

export default function VerificationPage() {
  const router = useRouter();
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  useEffect(() => {
    fetch("/api/onboarding/state")
      .then(async (response) => {
        if (!response.ok) return;
        const result = (await response.json()) as { state?: string; verification?: { status: string } };
        if (result.state === "NOT_STARTED" || result.state === "BUSINESS_TYPE_SELECTED") router.push("/register/business");
        else if (result.state === "BUSINESS_CREATED") router.push("/register/branch");
        else if (result.state === "COMPLETED") router.push("/dashboard");
        else if (result.verification) setStatus(result.verification.status);
      })
      .catch(() => setError("Unable to load saved onboarding progress."));
  }, [router]);

  async function submitVerification() {
    setPending(true);
    setError("");
    try {
      const response = await fetch("/api/onboarding/verification", { method: "POST" });
      const result = (await response.json()) as { status?: string; message?: string };
      if (!response.ok) setError(result.message ?? "Unable to submit verification.");
      else setStatus(result.status ?? "submitted");
    } catch {
      setError("Unable to reach the verification service.");
    } finally {
      setPending(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-6 py-16">
      <Card className="w-full max-w-xl p-6 text-center sm:p-9">
        <OnboardingProgress currentStep={4} />
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-accent">Verification</p>
        <h1 className="mt-3 text-3xl font-semibold text-white">
          {status ? "Verification is in progress" : "Your profile is ready for verification"}
        </h1>
        <p className="mt-4 text-sm leading-6 text-muted">
          {status
            ? "Your verification request has been submitted and will be reviewed."
            : "Submit your business for verification. Documents can be uploaded from the dashboard when that workflow is available."}
        </p>
        {error ? <p className="mt-5 text-sm text-red-300" role="alert">{error}</p> : null}
        {!status ? <PrimaryButton className="mt-8" disabled={pending} onClick={submitVerification} type="button">{pending ? "Submitting…" : "Submit for verification"}</PrimaryButton> : null}
        <Link className="mt-8 inline-flex" href="/dashboard">
          <SecondaryButton>Go to dashboard</SecondaryButton>
        </Link>
      </Card>
    </main>
  );
}
