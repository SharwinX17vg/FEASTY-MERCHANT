import Link from "next/link";

import { PrimaryButton } from "@/components/ui";

export default function NotFound() {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-6 py-16">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(255,122,0,0.18),transparent_45%)]" />
      <div className="relative max-w-lg text-center">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-accent">
          Error 404
        </p>
        <h1 className="mt-4 text-4xl font-semibold tracking-tight text-white sm:text-5xl">
          This page is not on the map.
        </h1>
        <p className="mt-5 text-base leading-7 text-muted">
          The page you requested may have moved or does not exist in your merchant
          workspace.
        </p>
        <Link className="mt-8 inline-flex" href="/">
          <PrimaryButton>Return home</PrimaryButton>
        </Link>
      </div>
    </main>
  );
}
