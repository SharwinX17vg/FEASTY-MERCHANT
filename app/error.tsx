"use client";

import Link from "next/link";

import { PrimaryButton } from "@/components/ui";

export default function Error({
  reset,
}: {
  reset: () => void;
}) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-6 py-16">
      <div className="max-w-lg text-center">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-accent">
          Something went wrong
        </p>
        <h1 className="mt-4 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
          We could not load this workspace.
        </h1>
        <p className="mt-4 text-sm leading-6 text-muted">
          Please try again. If the problem continues, return home and start again.
        </p>
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <PrimaryButton onClick={reset}>Try again</PrimaryButton>
          <Link
            className="inline-flex min-h-11 items-center justify-center rounded-xl border border-white/15 bg-white/5 px-5 py-2.5 text-sm font-semibold text-foreground shadow-sm shadow-black/10 transition hover:-translate-y-0.5 hover:border-primary/60 hover:bg-primary/10 hover:text-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            href="/"
          >
            Return home
          </Link>
        </div>
      </div>
    </main>
  );
}
