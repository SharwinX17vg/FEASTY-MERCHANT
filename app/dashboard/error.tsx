"use client";

import { Card, PrimaryButton, SecondaryButton } from "@/components/ui";

export default function DashboardError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="min-h-screen bg-background px-4 py-16 text-foreground sm:px-6 lg:px-8">
      <div className="mx-auto max-w-xl">
        <Card className="p-6 text-center sm:p-8" role="alert">
          <p className="text-sm text-muted">Merchant workspace</p>
          <h1 className="mt-2 text-2xl font-semibold text-white">
            We couldn&apos;t load your dashboard
          </h1>
          <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-muted">
            Something went wrong while loading this page. Please try again.
          </p>
          <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
            <PrimaryButton onClick={reset}>Try again</PrimaryButton>
            <a href="/dashboard">
              <SecondaryButton className="w-full">Back to dashboard</SecondaryButton>
            </a>
          </div>
        </Card>
      </div>
    </main>
  );
}
