"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

import { Card, Input, PrimaryButton } from "@/components/ui";

export default function BranchPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError("");
    const data = new FormData(event.currentTarget);
    const input = Object.fromEntries(data.entries());
    try {
      const response = await fetch("/api/onboarding/branch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      const result = (await response.json()) as { message?: string };
      if (!response.ok) setError(result.message ?? "Unable to save branch details.");
      else router.push("/register/verification");
    } catch {
      setError("Unable to reach the onboarding service.");
    } finally {
      setPending(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-6 py-16">
      <Card className="w-full max-w-2xl p-6 sm:p-9">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-accent">Step 3 of 3</p>
        <h1 className="mt-3 text-3xl font-semibold text-white">Add your first location</h1>
        {error ? <p className="mt-5 rounded-xl bg-red-400/10 px-4 py-3 text-sm text-red-200" role="alert">{error}</p> : null}
        <form className="mt-7 grid gap-5 sm:grid-cols-2" onSubmit={handleSubmit}>
          <Input className="sm:col-span-2" label="Location name" name="name" required />
          <Input className="sm:col-span-2" label="Address" name="addressLine1" required />
          <Input label="Address line 2" name="addressLine2" />
          <Input label="City" name="city" required />
          <Input label="State / region" name="state" />
          <Input label="Postal code" name="postalCode" />
          <Input defaultValue="IN" label="Country code" maxLength={2} name="countryCode" required />
          <Input autoComplete="tel" label="Location phone" name="phone" type="tel" />
          <PrimaryButton className="sm:col-span-2" disabled={pending} type="submit">
            {pending ? "Saving…" : "Continue to verification"}
          </PrimaryButton>
        </form>
      </Card>
    </main>
  );
}
