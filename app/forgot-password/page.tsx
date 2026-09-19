"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";

import { Card, Input, PrimaryButton } from "@/components/ui";

export default function ForgotPasswordPage() {
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError("");
    const email = String(new FormData(event.currentTarget).get("email") ?? "").trim();
    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const result = (await response.json()) as { message?: string };
      if (!response.ok) setError(result.message ?? "Unable to send a reset email.");
      else setMessage("If an account uses that email, a reset link will arrive shortly.");
    } catch {
      setError("Unable to reach the reset service. Try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-6 py-16">
      <Card className="w-full max-w-md p-6 sm:p-9">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-accent">
          Account recovery
        </p>
        <h1 className="mt-3 text-3xl font-semibold text-white">Reset your password</h1>
        <p className="mt-3 text-sm leading-6 text-muted">
          Enter your email and we will send a recovery link when an account is found.
        </p>
        {message ? <p className="mt-5 rounded-xl bg-primary/10 px-4 py-3 text-sm text-accent" role="status">{message}</p> : null}
        {error ? <p className="mt-5 rounded-xl bg-red-400/10 px-4 py-3 text-sm text-red-200" role="alert">{error}</p> : null}
        <form className="mt-7 space-y-5" onSubmit={handleSubmit}>
          <Input autoComplete="email" label="Email address" name="email" required type="email" />
          <PrimaryButton className="w-full" disabled={pending} type="submit">
            {pending ? "Sending…" : "Send reset link"}
          </PrimaryButton>
        </form>
        <Link className="mt-6 inline-flex text-sm font-semibold text-primary hover:text-accent" href="/login">
          Back to login
        </Link>
      </Card>
    </main>
  );
}
