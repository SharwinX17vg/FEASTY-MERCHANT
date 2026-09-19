"use client";

import Link from "next/link";
import { FormEvent, useMemo, useState } from "react";

import { Card, Input, PrimaryButton, SecondaryButton } from "@/components/ui";

type FormErrors = {
  name?: string;
  email?: string;
  phone?: string;
  password?: string;
  confirmPassword?: string;
  terms?: string;
};

function Icon({
  name,
  className = "size-5",
}: {
  name: "arrow" | "check" | "eye" | "eyeOff" | "google" | "sparkle";
  className?: string;
}) {
  const paths = {
    arrow: "M5 12h14m-6-6 6 6-6 6",
    check: "m5 12 4 4L19 6",
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

export default function SignupPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<FormErrors>({});
  const [termsAccepted, setTermsAccepted] = useState(false);

  const passwordStrength = useMemo(() => {
    let score = 0;
    if (password.length >= 8) score += 1;
    if (/[A-Z]/.test(password)) score += 1;
    if (/[0-9]/.test(password)) score += 1;
    if (/[^A-Za-z0-9]/.test(password)) score += 1;
    return score;
  }, [password]);

  const strengthLabel =
    passwordStrength === 0
      ? "Enter a password"
      : passwordStrength < 2
        ? "Weak password"
        : passwordStrength < 4
          ? "Good password"
          : "Strong password";

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email") ?? "").trim();
    const phone = String(formData.get("phone") ?? "").trim();
    const confirmPassword = String(formData.get("confirmPassword") ?? "");
    const nextErrors: FormErrors = {};

    if (!String(formData.get("name") ?? "").trim()) {
      nextErrors.name = "Full name is required.";
    }
    if (!email) {
      nextErrors.email = "Business email is required.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      nextErrors.email = "Enter a valid email address.";
    }
    if (!phone) nextErrors.phone = "Phone number is required.";
    if (!password) {
      nextErrors.password = "Password is required.";
    } else if (passwordStrength < 2) {
      nextErrors.password = "Use at least 8 characters with a number or uppercase letter.";
    }
    if (!confirmPassword) {
      nextErrors.confirmPassword = "Please confirm your password.";
    } else if (password !== confirmPassword) {
      nextErrors.confirmPassword = "Passwords do not match.";
    }
    if (!termsAccepted) nextErrors.terms = "Please accept the Terms & Privacy Policy.";
    setErrors(nextErrors);
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-background">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_12%_15%,rgba(255,122,0,0.2),transparent_34%),radial-gradient(circle_at_90%_85%,rgba(255,122,0,0.1),transparent_32%)]" />
      <div className="relative mx-auto grid min-h-screen max-w-7xl lg:grid-cols-2">
        <section className="relative flex flex-col justify-between px-6 py-8 sm:px-10 lg:px-16 lg:py-12">
          <Link className="flex w-fit items-center gap-2 text-lg font-bold tracking-tight text-white" href="/">
            <span className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <Icon name="sparkle" className="size-5" />
            </span>
            FEASTY<span className="text-primary">MERCHANT</span>
          </Link>

          <div className="hidden max-w-xl lg:block">
            <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/10 px-4 py-2 text-xs font-medium text-accent">
              <span className="size-1.5 rounded-full bg-primary" />
              Built for businesses with ambition
            </div>
            <h1 className="text-5xl font-semibold tracking-[-0.04em] text-white xl:text-6xl">
              Your next chapter starts here.
            </h1>
            <p className="mt-6 max-w-md text-base leading-7 text-muted">
              Create a trusted presence, keep your business information current,
              and meet more of the customers who are looking for you.
            </p>
            <div className="mt-10 space-y-4">
              {[
                "Get discovered on FEASTYMAP",
                "Share menus, offers, and events",
                "Build trust with a verified profile",
              ].map((item) => (
                <div className="flex items-center gap-3 text-sm text-white" key={item}>
                  <span className="flex size-7 items-center justify-center rounded-lg bg-primary/15 text-primary">
                    <Icon name="check" className="size-4" />
                  </span>
                  {item}
                </div>
              ))}
            </div>
          </div>
          <p className="hidden text-xs text-muted lg:block">© 2026 FEASTY MERCHANT</p>
        </section>

        <section className="flex items-center justify-center px-6 py-10 sm:px-10 lg:px-16">
          <Card className="w-full max-w-md p-6 shadow-2xl shadow-black/20 sm:p-9">
            <div className="mb-7">
              <p className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-accent">
                Join FEASTY MERCHANT
              </p>
              <h2 className="text-3xl font-semibold tracking-tight text-white">
                Create your account
              </h2>
              <p className="mt-3 text-sm leading-6 text-muted">
                Set up your business presence and start reaching new customers.
              </p>
            </div>

            <form className="space-y-4" onSubmit={handleSubmit} noValidate>
              <Input
                autoComplete="name"
                error={errors.name}
                label="Full Name"
                name="name"
                placeholder="Your full name"
                type="text"
              />
              <Input
                autoComplete="email"
                error={errors.email}
                label="Business Email"
                name="email"
                placeholder="you@yourbusiness.com"
                type="email"
              />
              <Input
                autoComplete="tel"
                error={errors.phone}
                label="Phone Number"
                name="phone"
                placeholder="+1 555 000 0000"
                type="tel"
              />

              <div className="relative">
                <Input
                  autoComplete="new-password"
                  className="pr-12"
                  error={errors.password}
                  label="Password"
                  name="password"
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Create a strong password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                />
                <button
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="absolute right-3 top-[2.15rem] rounded-lg p-1.5 text-muted transition hover:bg-white/10 hover:text-white focus-visible:outline-2 focus-visible:outline-primary"
                  onClick={() => setShowPassword((visible) => !visible)}
                  type="button"
                >
                  <Icon name={showPassword ? "eyeOff" : "eye"} className="size-5" />
                </button>
                <div className="mt-2 flex items-center gap-2">
                  <div className="flex flex-1 gap-1">
                    {[1, 2, 3, 4].map((level) => (
                      <span
                        className={`h-1 flex-1 rounded-full transition-colors ${
                          level <= passwordStrength
                            ? passwordStrength >= 4
                              ? "bg-emerald-400"
                              : passwordStrength >= 2
                                ? "bg-primary"
                                : "bg-red-400"
                            : "bg-white/10"
                        }`}
                        key={level}
                      />
                    ))}
                  </div>
                  <span className="text-[11px] text-muted">{strengthLabel}</span>
                </div>
              </div>

              <div className="relative">
                <Input
                  autoComplete="new-password"
                  className="pr-12"
                  error={errors.confirmPassword}
                  label="Confirm Password"
                  name="confirmPassword"
                  placeholder="Repeat your password"
                  type={showConfirmPassword ? "text" : "password"}
                />
                <button
                  aria-label={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
                  className="absolute right-3 top-[2.15rem] rounded-lg p-1.5 text-muted transition hover:bg-white/10 hover:text-white focus-visible:outline-2 focus-visible:outline-primary"
                  onClick={() => setShowConfirmPassword((visible) => !visible)}
                  type="button"
                >
                  <Icon name={showConfirmPassword ? "eyeOff" : "eye"} className="size-5" />
                </button>
              </div>

              <label className="flex items-start gap-3 pt-1 text-sm text-muted">
                <input
                  checked={termsAccepted}
                  className="mt-0.5 size-4 accent-[var(--primary)]"
                  onChange={(event) => setTermsAccepted(event.target.checked)}
                  type="checkbox"
                />
                <span>
                  I agree to the{" "}
                  <Link className="text-primary transition hover:text-accent" href="#">
                    FEASTY MERCHANT Terms & Privacy Policy
                  </Link>
                  {errors.terms ? <span className="mt-1 block text-xs text-red-300">{errors.terms}</span> : null}
                </span>
              </label>

              <PrimaryButton className="w-full" type="submit">
                Create Merchant Account
                <Icon name="arrow" className="ml-2 size-4" />
              </PrimaryButton>
              <div className="flex items-center gap-3 py-1">
                <span className="h-px flex-1 bg-white/10" />
                <span className="text-xs uppercase tracking-wider text-muted">or</span>
                <span className="h-px flex-1 bg-white/10" />
              </div>
              <SecondaryButton className="w-full" type="button">
                <Icon name="google" className="mr-2 size-4 text-[#4285F4]" />
                Continue with Google
              </SecondaryButton>
            </form>

            <p className="mt-7 text-center text-sm text-muted">
              Already have an account?{" "}
              <Link className="font-semibold text-primary transition hover:text-accent" href="/login">
                Login
              </Link>
            </p>
          </Card>
        </section>
      </div>
    </main>
  );
}
