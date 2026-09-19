"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

import {
  Card,
  Input,
  PrimaryButton,
  SecondaryButton,
} from "@/components/ui";
import { getNetworkErrorMessage, getSafeAuthError } from "@/lib/auth/errors";
import { validateLoginInput } from "@/lib/validation/auth";

type FormErrors = {
  email?: string;
  password?: string;
};

function Icon({
  name,
  className = "size-5",
}: {
  name: "arrow" | "eye" | "eyeOff" | "google" | "sparkle";
  className?: string;
}) {
  const paths = {
    arrow: "M5 12h14m-6-6 6 6-6 6",
    eye: "M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Zm9.5 2.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z",
    eyeOff:
      "m3 3 18 18M10.6 6.2A10.2 10.2 0 0 1 12 6c6 0 9.5 6 9.5 6a17.3 17.3 0 0 1-3.1 3.7M6.2 6.2C3.8 7.7 2.5 12 2.5 12s3.5 6 9.5 6c1 0 2-.2 2.8-.5M9.9 9.9a2.5 2.5 0 0 0 3.5 3.5",
    google:
      "M21.8 12.2c0-.7-.1-1.4-.2-2H12v3.8h5.5a4.7 4.7 0 0 1-2 3.1v2.6h3.2c1.9-1.8 3.1-4.4 3.1-7.5Z",
    sparkle:
      "m12 3 1.4 5.6L19 10l-5.6 1.4L12 17l-1.4-5.6L5 10l5.6-1.4L12 3Zm6 13 .5 2.5L21 19l-2.5.5L18 22l-.5-2.5L15 19l2.5-.5L18 16Z",
  };

  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.8"
      viewBox="0 0 24 24"
    >
      <path d={paths[name]} />
    </svg>
  );
}

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [formError, setFormError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);
    const validation = validateLoginInput({
      email: formData.get("email"),
      password: formData.get("password"),
    });

    setErrors(validation.errors);
    setFormError("");
    if (Object.keys(validation.errors).length > 0) return;

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: validation.email, password: validation.password }),
      });
      const result = (await response.json()) as { message?: string };
      if (!response.ok) {
        setFormError(getSafeAuthError(response.status, result.message, "Unable to sign in."));
        return;
      }
      router.push("/dashboard");
    } catch {
      setFormError(getNetworkErrorMessage());
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleGoogleSignIn() {
    setFormError("");
    setIsSubmitting(true);
    try {
      const response = await fetch("/api/auth/oauth", { method: "POST" });
      const result = (await response.json()) as { message?: string; url?: string };
      if (!response.ok || !result.url) {
        setFormError(getSafeAuthError(response.status, result.message, "Google sign-in is unavailable."));
        return;
      }
      window.location.assign(result.url);
    } catch {
      setFormError(getNetworkErrorMessage());
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-background">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_12%_15%,rgba(255,122,0,0.2),transparent_34%),radial-gradient(circle_at_90%_85%,rgba(255,122,0,0.1),transparent_32%)]" />
      <div className="relative mx-auto grid min-h-screen max-w-7xl lg:grid-cols-2">
        <section className="relative flex flex-col justify-between px-6 py-8 sm:px-10 lg:px-16 lg:py-12">
          <Link
            className="flex w-fit items-center gap-2 text-lg font-bold tracking-tight text-white"
            href="/"
          >
            <span className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <Icon name="sparkle" className="size-5" />
            </span>
            FEASTY<span className="text-primary">MERCHANT</span>
          </Link>

          <div className="hidden max-w-xl lg:block">
            <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/10 px-4 py-2 text-xs font-medium text-accent">
              <span className="size-1.5 rounded-full bg-primary" />
              Your business, beautifully connected
            </div>
            <h1 className="text-5xl font-semibold tracking-[-0.04em] text-white xl:text-6xl">
              Bring your business to where people discover.
            </h1>
            <p className="mt-6 max-w-md text-base leading-7 text-muted">
              Manage your presence, publish what is happening today, and reach
              customers across FEASTYMAP from one calm workspace.
            </p>

            <div className="relative mt-12 h-44 max-w-md overflow-hidden rounded-3xl border border-white/10 bg-white/[0.04] p-5 shadow-2xl shadow-orange-950/20 backdrop-blur-xl">
              <div className="absolute -right-12 -top-16 size-48 rounded-full bg-primary/20 blur-3xl" />
              <div className="relative flex items-start justify-between">
                <div>
                  <p className="text-xs text-muted">Merchant workspace</p>
                  <p className="mt-2 text-lg font-semibold text-white">
                    Ready to grow
                  </p>
                </div>
                <span className="flex size-10 items-center justify-center rounded-xl bg-primary/15 text-primary">
                  <Icon name="sparkle" />
                </span>
              </div>
              <div className="relative mt-8 flex gap-2">
                {[64, 92, 78, 100, 84, 112].map((height, index) => (
                  <span
                    className="w-5 rounded-t-md bg-gradient-to-t from-primary/30 to-primary"
                    key={index}
                    style={{ height }}
                  />
                ))}
              </div>
            </div>
          </div>

          <p className="hidden text-xs text-muted lg:block">
            © 2026 FEASTY MERCHANT
          </p>
        </section>

        <section className="flex items-center justify-center px-6 py-10 sm:px-10 lg:px-16">
          <Card className="w-full max-w-md p-6 shadow-2xl shadow-black/20 sm:p-9">
            <div className="mb-8">
              <p className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-accent">
                Welcome back
              </p>
              <h2 className="text-3xl font-semibold tracking-tight text-white">
                Sign in to your workspace
              </h2>
              <p className="mt-3 text-sm leading-6 text-muted">
                Keep your business presence fresh and ready to be discovered.
              </p>
            </div>

            {formError ? (
              <p className="mb-5 rounded-xl border border-red-400/30 bg-red-400/10 px-4 py-3 text-sm text-red-200" role="alert">
                {formError}
              </p>
            ) : null}
            <form className="space-y-5" onSubmit={handleSubmit} noValidate>
              <Input
                autoComplete="email"
                error={errors.email}
                label="Email address"
                name="email"
                placeholder="you@yourbusiness.com"
                type="email"
              />

              <div className="relative">
                <Input
                  autoComplete="current-password"
                  className="pr-12"
                  error={errors.password}
                  label="Password"
                  name="password"
                  placeholder="Enter your password"
                  type={showPassword ? "text" : "password"}
                />
                <button
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="absolute right-3 top-[2.15rem] rounded-lg p-1.5 text-muted transition hover:bg-white/10 hover:text-white focus-visible:outline-2 focus-visible:outline-primary"
                  onClick={() => setShowPassword((visible) => !visible)}
                  type="button"
                >
                  <Icon name={showPassword ? "eyeOff" : "eye"} className="size-5" />
                </button>
              </div>

              <div className="flex justify-end">
                <Link
                  className="text-sm font-medium text-primary transition hover:text-accent"
                  href="/forgot-password"
                >
                  Forgot Password?
                </Link>
              </div>

              <PrimaryButton className="w-full" disabled={isSubmitting} type="submit">
                {isSubmitting ? "Signing in…" : "Login"}
                <Icon name="arrow" className="ml-2 size-4" />
              </PrimaryButton>

              <div className="flex items-center gap-3 py-1">
                <span className="h-px flex-1 bg-white/10" />
                <span className="text-xs uppercase tracking-wider text-muted">or</span>
                <span className="h-px flex-1 bg-white/10" />
              </div>

              <SecondaryButton className="w-full" disabled={isSubmitting} onClick={handleGoogleSignIn} type="button">
                <Icon name="google" className="mr-2 size-4 text-[#4285F4]" />
                Continue with Google
              </SecondaryButton>
            </form>

            <p className="mt-8 text-center text-sm text-muted">
              New to FEASTY MERCHANT?{" "}
              <Link
                className="font-semibold text-primary transition hover:text-accent"
                href="/signup"
              >
                Create Business Account
              </Link>
            </p>
          </Card>
        </section>
      </div>
    </main>
  );
}
