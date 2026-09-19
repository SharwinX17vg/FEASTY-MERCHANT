"use client";

import Link from "next/link";
import { FormEvent, useMemo, useRef, useState } from "react";
import type { CountryCode } from "libphonenumber-js";

import { Card, Input, PrimaryButton, SecondaryButton } from "@/components/ui";
import {
  detectPhoneCountry,
  formatPhone,
  getPasswordRequirements,
  getPasswordStrength,
  normalizePhone,
  reformatPhone,
  supportedCountries,
  validateSignupInput,
} from "@/lib/validation/auth";
import { getNetworkErrorMessage, getSafeAuthError } from "@/lib/auth/errors";

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
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState<FormErrors>({});
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [country, setCountry] = useState("IN");
  const [phone, setPhone] = useState("");
  const [countrySearch, setCountrySearch] = useState("");
  const [countryOpen, setCountryOpen] = useState(false);
  const [highlightedCountry, setHighlightedCountry] = useState(0);
  const [formError, setFormError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const countrySearchRef = useRef<HTMLInputElement>(null);

  const passwordRequirements = useMemo(() => getPasswordRequirements(password), [password]);
  const passwordStrength = getPasswordStrength(password);
  const confirmMismatch = Boolean(confirmPassword) && password !== confirmPassword;

  const filteredCountries = useMemo(() => {
    const query = countrySearch.trim().toLowerCase();
    if (!query) return supportedCountries;

    return supportedCountries.filter(({ country: code, callingCode, name }) =>
      `${name} ${code} ${callingCode}`.toLowerCase().includes(query),
    );
  }, [countrySearch]);
  const selectedCountry = supportedCountries.find(({ country: code }) => code === country) ?? supportedCountries[0];

  function selectCountry(nextCountry: string) {
    setPhone((currentPhone) =>
      reformatPhone(currentPhone, country as CountryCode, nextCountry as CountryCode),
    );
    setCountry(nextCountry);
    setCountrySearch("");
    setCountryOpen(false);
  }

  function handlePhoneChange(value: string) {
    const detectedCountry = value.trim().startsWith("+")
      ? detectPhoneCountry(value)
      : undefined;

    if (detectedCountry) {
      setCountry(detectedCountry);
      const parsedNumber = value.replace(/[^\d+]/g, "");
      setPhone(formatPhone(parsedNumber, detectedCountry));
      return;
    }

    setPhone(formatPhone(value, country as CountryCode));
  }

  function handlePhonePaste(event: React.ClipboardEvent<HTMLInputElement>) {
    const pastedValue = event.clipboardData.getData("text");
    if (!pastedValue.trim().startsWith("+")) return;

    event.preventDefault();
    handlePhoneChange(pastedValue);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email") ?? "").trim();
    const phoneResult = normalizePhone(phone, country as CountryCode);
    const submittedConfirmPassword = String(formData.get("confirmPassword") ?? "");
    const nextErrors: FormErrors = {};

    const validation = validateSignupInput({
      name: formData.get("name"),
      email,
      country,
      phone,
      password,
      confirmPassword: submittedConfirmPassword,
      termsAccepted,
    });
    Object.assign(nextErrors, validation.errors);
    if ("error" in phoneResult) nextErrors.phone = phoneResult.error;
    setErrors(nextErrors);
    setFormError("");
    if (Object.keys(nextErrors).length > 0) return;

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.get("name"),
          email,
          country,
          phone: "e164" in phoneResult ? phoneResult.e164 : phone,
          password,
          confirmPassword: submittedConfirmPassword,
          termsAccepted,
        }),
      });
      const result = (await response.json()) as {
        confirmed?: boolean;
        errors?: FormErrors;
        message?: string;
      };
      if (!response.ok) {
        setErrors(result.errors ?? {});
        setFormError(getSafeAuthError(response.status, result.message));
        return;
      }
      window.location.assign(result.confirmed ? "/register/business-type" : "/check-email");
    } catch {
      setFormError(getNetworkErrorMessage());
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleGoogleSignUp() {
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

            {formError ? (
              <p className="mb-5 rounded-xl border border-red-400/30 bg-red-400/10 px-4 py-3 text-sm text-red-200" role="alert">
                {formError}
              </p>
            ) : null}
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
              <div className="space-y-2">
                <span className="block text-sm font-medium text-foreground">Phone Number</span>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <div className="relative sm:w-56">
                    <input name="country" type="hidden" value={country} />
                    <button
                      aria-expanded={countryOpen}
                      aria-haspopup="listbox"
                      className="flex min-h-11 w-full items-center justify-between gap-2 rounded-xl border border-white/15 bg-white/5 px-3 text-left text-sm text-foreground outline-none transition hover:border-white/30 focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20"
                      onClick={() => {
                        setCountryOpen((open) => !open);
                        setTimeout(() => countrySearchRef.current?.focus(), 0);
                      }}
                      type="button"
                    >
                      <span className="flex min-w-0 items-center gap-2">
                        <span aria-hidden="true" className="text-lg">{selectedCountry.flag}</span>
                        <span className="truncate">{selectedCountry.name}</span>
                      </span>
                      <span className="text-muted">⌄</span>
                    </button>
                    {countryOpen ? (
                      <div className="absolute left-0 right-0 top-[calc(100%+0.5rem)] z-30 overflow-hidden rounded-xl border border-white/15 bg-[#171717] shadow-2xl shadow-black/40">
                        <div className="border-b border-white/10 p-2">
                          <label className="sr-only" htmlFor="country-search">Search countries</label>
                          <input
                            aria-controls="country-options"
                            aria-expanded={countryOpen}
                            aria-label="Search countries"
                            className="min-h-10 w-full rounded-lg border border-white/10 bg-white/5 px-3 text-sm text-white outline-none placeholder:text-muted focus:border-primary focus:ring-2 focus:ring-primary/20"
                            id="country-search"
                            onChange={(event) => {
                              setCountrySearch(event.target.value);
                              setHighlightedCountry(0);
                            }}
                            onKeyDown={(event) => {
                              if (event.key === "ArrowDown") {
                                event.preventDefault();
                                setHighlightedCountry((index) => Math.min(index + 1, filteredCountries.length - 1));
                              } else if (event.key === "ArrowUp") {
                                event.preventDefault();
                                setHighlightedCountry((index) => Math.max(index - 1, 0));
                              } else if (event.key === "Enter") {
                                event.preventDefault();
                                const option = filteredCountries[highlightedCountry];
                                if (option) selectCountry(option.country);
                              } else if (event.key === "Escape") {
                                setCountryOpen(false);
                              }
                            }}
                            ref={countrySearchRef}
                            role="combobox"
                            value={countrySearch}
                          />
                        </div>
                        <div
                          aria-label="Countries"
                          className="max-h-56 overflow-y-auto p-1"
                          id="country-options"
                          role="listbox"
                        >
                          {filteredCountries.map((option, index) => (
                            <button
                              aria-selected={option.country === country}
                              className={`flex min-h-10 w-full items-center gap-2 rounded-lg px-2 text-left text-sm text-white transition hover:bg-white/10 focus-visible:bg-white/10 focus-visible:outline-none ${
                                index === highlightedCountry ? "bg-white/10" : ""
                              }`}
                              key={option.country}
                              onClick={() => selectCountry(option.country)}
                              role="option"
                              type="button"
                            >
                              <span aria-hidden="true" className="text-lg">{option.flag}</span>
                              <span className="min-w-0 flex-1 truncate">{option.name}</span>
                              <span className="text-xs text-muted">{option.country}</span>
                              <span className="text-xs text-accent">{option.callingCode}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    ) : null}
                  </div>
                  <div className="flex min-h-11 flex-1 items-center rounded-xl border border-white/15 bg-white/5 px-3 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20">
                    <span aria-hidden="true" className="border-r border-white/10 pr-3 text-sm font-medium text-accent">{selectedCountry.callingCode}</span>
                    <Input
                      aria-describedby={errors.phone ? "phone-error" : undefined}
                      aria-label="National phone number"
                      autoComplete="tel"
                      className="min-h-10 border-0 bg-transparent px-3 py-0 focus:border-0 focus:ring-0"
                      error={errors.phone}
                      name="phone"
                      onChange={(event) => handlePhoneChange(event.target.value)}
                      onPaste={handlePhonePaste}
                      placeholder="98765 43210"
                      type="tel"
                      value={phone}
                    />
                  </div>
                </div>
                {errors.phone ? <p className="text-xs text-red-300" id="phone-error">{errors.phone}</p> : null}
              </div>

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
                <div aria-live="polite" className="mt-2 flex items-center gap-2">
                  <div className="flex flex-1 gap-1">
                    {[1, 2, 3, 4, 5].map((level) => (
                      <span
                        className={`h-1 flex-1 rounded-full transition-colors ${
                          level <= passwordStrength.score
                            ? passwordStrength.label === "Strong"
                              ? "bg-emerald-400"
                              : passwordStrength.label === "Fair"
                                ? "bg-primary"
                                : "bg-red-400"
                            : "bg-white/10"
                        }`}
                        key={level}
                      />
                    ))}
                  </div>
                  <span className="text-[11px] text-muted">
                    {password ? passwordStrength.label : "Enter a password"}
                  </span>
                </div>
                <div aria-label="Password requirements" className="mt-3 space-y-1 text-xs" id="password-requirements">
                  <p className="font-medium text-muted">Password requirements</p>
                  {passwordRequirements.map((requirement) => (
                    <p className={requirement.met ? "text-emerald-300" : "text-muted"} key={requirement.id}>
                      <span aria-hidden="true" className="mr-2">{requirement.met ? "✓" : "○"}</span>
                      {requirement.label}
                    </p>
                  ))}
                </div>
              </div>

              <div className="relative">
                <Input
                  autoComplete="new-password"
                  className="pr-12"
                  error={errors.confirmPassword}
                  label="Confirm Password"
                  name="confirmPassword"
                  onChange={(event) => setConfirmPassword(event.target.value)}
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
                {confirmMismatch ? (
                  <p aria-live="polite" className="mt-2 text-sm text-red-300">
                    Passwords do not match.
                  </p>
                ) : null}
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
                  <Link className="text-primary transition hover:text-accent" href="/login">
                    FEASTY MERCHANT Terms & Privacy Policy
                  </Link>
                  {errors.terms ? <span className="mt-1 block text-xs text-red-300">{errors.terms}</span> : null}
                </span>
              </label>

              <PrimaryButton className="w-full" disabled={isSubmitting} type="submit">
                {isSubmitting ? "Creating account…" : "Create Merchant Account"}
                <Icon name="arrow" className="ml-2 size-4" />
              </PrimaryButton>
              <div className="flex items-center gap-3 py-1">
                <span className="h-px flex-1 bg-white/10" />
                <span className="text-xs uppercase tracking-wider text-muted">or</span>
                <span className="h-px flex-1 bg-white/10" />
              </div>
              <SecondaryButton className="w-full" disabled={isSubmitting} onClick={handleGoogleSignUp} type="button">
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
