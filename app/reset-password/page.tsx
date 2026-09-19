"use client";

import Link from "next/link";
import { FormEvent, useMemo, useState } from "react";

import { Card, Input, PrimaryButton } from "@/components/ui";
import { getNetworkErrorMessage, getSafeAuthError } from "@/lib/auth/errors";
import { getPasswordRequirements, getPasswordStrength, validatePassword } from "@/lib/validation/auth";

function Icon({ hidden }: { hidden: boolean }) {
  return (
    <svg aria-hidden="true" className="size-5" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" viewBox="0 0 24 24">
      <path d={hidden ? "M3 3l18 18M10.6 6.2A10.2 10.2 0 0 1 12 6c6 0 9.5 6 9.5 6a17.3 17.3 0 0 1-3.1 3.7M6.2 6.2C3.8 7.7 2.5 12 2.5 12s3.5 6 9.5 6c1 0 2-.2 2.8-.5" : "M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Zm9.5 2.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z"} />
    </svg>
  );
}

export default function ResetPasswordPage() {
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const requirements = useMemo(() => getPasswordRequirements(password), [password]);
  const strength = getPasswordStrength(password);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError("");
    const data = new FormData(event.currentTarget);
    const submittedPassword = String(data.get("password") ?? "");
    const submittedConfirmPassword = String(data.get("confirmPassword") ?? "");
    const passwordError = validatePassword(submittedPassword);
    if (passwordError || submittedPassword !== submittedConfirmPassword) {
      setError(passwordError ?? "Passwords do not match.");
      setPending(false);
      return;
    }
    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          password: submittedPassword,
          confirmPassword: submittedConfirmPassword,
        }),
      });
      const result = (await response.json()) as { message?: string };
      if (!response.ok) setError(getSafeAuthError(response.status, result.message, "Unable to reset your password."));
      else setMessage("Your password has been updated. You can now sign in.");
    } catch {
      setError(getNetworkErrorMessage());
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
          <div className="relative">
            <Input autoComplete="new-password" className="pr-12" label="New password" name="password" onChange={(event) => setPassword(event.target.value)} required type={showPassword ? "text" : "password"} value={password} />
            <button aria-label={showPassword ? "Hide new password" : "Show new password"} className="absolute right-3 top-[2.15rem] rounded-lg p-1.5 text-muted transition hover:bg-white/10 hover:text-white focus-visible:outline-2 focus-visible:outline-primary" onClick={() => setShowPassword((visible) => !visible)} type="button">
              <Icon hidden={!showPassword} />
            </button>
            <div aria-live="polite" className="mt-2 space-y-1 text-xs">
              <p className="font-medium text-muted">Password requirements</p>
              {requirements.map((requirement) => (
                <p className={requirement.met ? "text-emerald-300" : "text-muted"} key={requirement.id}>
                  <span aria-hidden="true" className="mr-2">{requirement.met ? "✓" : "○"}</span>{requirement.label}
                </p>
              ))}
              <p className="pt-1 font-medium text-muted">Strength: {password ? strength.label : "Enter a password"}</p>
            </div>
          </div>
          <div className="relative">
            <Input autoComplete="new-password" className="pr-12" label="Confirm new password" name="confirmPassword" onChange={(event) => setConfirmPassword(event.target.value)} required type={showConfirmPassword ? "text" : "password"} value={confirmPassword} />
            <button aria-label={showConfirmPassword ? "Hide confirmation password" : "Show confirmation password"} className="absolute right-3 top-[2.15rem] rounded-lg p-1.5 text-muted transition hover:bg-white/10 hover:text-white focus-visible:outline-2 focus-visible:outline-primary" onClick={() => setShowConfirmPassword((visible) => !visible)} type="button">
              <Icon hidden={!showConfirmPassword} />
            </button>
            {confirmPassword && password !== confirmPassword ? <p aria-live="polite" className="mt-2 text-sm text-red-300">Passwords do not match.</p> : null}
          </div>
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
