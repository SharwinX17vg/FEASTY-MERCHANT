import Link from "next/link";

import { PrimaryButton } from "@/components/ui";

export default function AuthCodeErrorPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-6">
      <div className="max-w-md text-center">
        <h1 className="text-3xl font-semibold text-white">Sign-in link expired</h1>
        <p className="mt-4 text-sm leading-6 text-muted" role="alert">
          This authentication link is no longer valid. Start again to receive a fresh link.
        </p>
        <Link className="mt-8 inline-flex" href="/login">
          <PrimaryButton>Return to login</PrimaryButton>
        </Link>
        <Link className="mt-4 inline-flex text-sm font-semibold text-primary hover:text-accent" href="/forgot-password">
          Need a password reset instead?
        </Link>
      </div>
    </main>
  );
}
