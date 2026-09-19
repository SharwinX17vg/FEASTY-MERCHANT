import Link from "next/link";

import { SecondaryButton } from "@/components/ui";

export default function CheckEmailPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-6">
      <div className="max-w-md text-center">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-accent">
          Check your email
        </p>
        <h1 className="mt-4 text-3xl font-semibold text-white">
          Confirm your FEASTY MERCHANT account
        </h1>
        <p className="mt-4 text-sm leading-6 text-muted">
          We sent a confirmation link if your signup was accepted. Confirm your
          email before continuing.
        </p>
        <Link className="mt-8 inline-flex" href="/login">
          <SecondaryButton>Return to login</SecondaryButton>
        </Link>
      </div>
    </main>
  );
}
