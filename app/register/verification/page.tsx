"use client";

import Link from "next/link";

import { Card, SecondaryButton } from "@/components/ui";

export default function VerificationPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-6 py-16">
      <Card className="w-full max-w-xl p-6 text-center sm:p-9">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-accent">Verification</p>
        <h1 className="mt-3 text-3xl font-semibold text-white">Your profile is ready for verification</h1>
        <p className="mt-4 text-sm leading-6 text-muted">
          Verification documents can be uploaded from your dashboard once your
          business details are saved. Keep documents private and under 10 MB.
        </p>
        <Link className="mt-8 inline-flex" href="/dashboard">
          <SecondaryButton>Go to dashboard</SecondaryButton>
        </Link>
      </Card>
    </main>
  );
}
