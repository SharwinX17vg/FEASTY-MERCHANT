"use client";

import Link from "next/link";

export default function GlobalError() {
  return (
    <html lang="en">
      <body className="min-h-screen bg-[#0a0a0a] text-[#f5f5f5]">
        <main className="flex min-h-screen items-center justify-center px-6 py-16 text-center">
          <div className="max-w-lg">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#ffb15c]">
              FEASTY MERCHANT
            </p>
            <h1 className="mt-4 text-3xl font-semibold">A system error occurred.</h1>
            <p className="mt-4 text-sm leading-6 text-[#a3a3a3]">
              Please refresh the page to try loading your workspace again.
            </p>
            <Link
              className="mt-8 inline-flex min-h-11 items-center justify-center rounded-xl bg-[#ff7a00] px-5 py-2.5 text-sm font-semibold text-[#1a0b00] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ffb15c]"
              href="/"
            >
              Refresh workspace
            </Link>
          </div>
        </main>
      </body>
    </html>
  );
}
