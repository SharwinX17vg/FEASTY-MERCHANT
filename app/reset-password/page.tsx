"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";

import { Card, Input, PrimaryButton } from "@/components/ui";

export default function ResetPasswordPage() {
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError("");
    const data = new FormData(event.currentTarget);
    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          password: data.get("password"),
          confirmPassword: data.get("confirmPassword"),
        }),
      });
      const result = (await response.json()) as { message?: string };
      if (!response.ok) setError(result.message ?? "Unable to reset your password.");
      else setMessage("Your password has been updated. You can now sign in.");
    } catch {
      setError("Unable to reach the reset service. Try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-6 py-16">
      <Card className="w-full max-w-md p-6 sm:p-9">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-accent">New password</p>
        <h1 className="mt-3 text-3xl font-semibold text-white">Choose a new password</h1>
        {message ? <p className="mt-5 rounded-xl bg-primary/10 px-4 py-3 text-sm text-accent" role="status">{message}</p> : null}
        {error ? <p className="mt-5 rounded-xl bg-red-400/10 px-4 py-3 text-sm text-red-200" role="alert">{error}</p> : null}
        <form className="mt-7 space-y-5" onSubmit={handleSubmit}>
          <Input autoComplete="new-password" label="New password" name="password" required type="password" />
          <Input autoComplete="new-password" label="Confirm new password" name="confirmPassword" required type="password" />
          <PrimaryButton className="w-full" disabled={pending} type="submit">
            {pending ? "Updating…" : "Update password"}
          </PrimaryButton>
        </form>
        <Link className="mt-6 inline-flex text-sm font-semibold text-primary hover:text-accent" href="/login">
          Back to login
        </Link>
      </Card>
    </main>
  );
}
