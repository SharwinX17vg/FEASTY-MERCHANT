"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { OnboardingProgress } from "@/components/onboarding/OnboardingProgress";
import { Card, PrimaryButton } from "@/components/ui";

type Category = {
  description: string;
  icon: IconName;
  title: string;
};

type IconName =
  | "calendar"
  | "coffee"
  | "dots"
  | "flower"
  | "music"
  | "shop"
  | "sparkle"
  | "utensils";

const categories: Category[] = [
  {
    title: "Restaurant",
    description: "Serve memorable meals to hungry customers.",
    icon: "utensils",
  },
  {
    title: "Cafe",
    description: "Create a place for good coffee and good company.",
    icon: "coffee",
  },
  {
    title: "Bakery",
    description: "Share the craft and care behind every bake.",
    icon: "sparkle",
  },
  {
    title: "Retail Shop",
    description: "Help local shoppers discover what you offer.",
    icon: "shop",
  },
  {
    title: "Entertainment Place",
    description: "Bring more people to your best experiences.",
    icon: "music",
  },
  {
    title: "Salon & Spa",
    description: "Turn local discovery into the next appointment.",
    icon: "flower",
  },
  {
    title: "Event Venue",
    description: "Make your space the setting for something special.",
    icon: "calendar",
  },
  {
    title: "Other Business",
    description: "There is a place for every local business here.",
    icon: "dots",
  },
];

function Icon({
  name,
  className = "size-6",
}: {
  name: IconName;
  className?: string;
}) {
  const paths: Record<IconName, string> = {
    calendar: "M7 3v3m10-3v3M4 9h16M5 5h14a1 1 0 0 1 1 1v13H4V6a1 1 0 0 1 1-1Z",
    coffee: "M5 8h11v7a4 4 0 0 1-4 4H9a4 4 0 0 1-4-4V8Zm11 2h2a2 2 0 0 1 0 4h-2M8 4v2m4-2v2",
    dots: "M5 12h.01M12 12h.01M19 12h.01",
    flower: "M12 12c-2-2-5-1.5-5-4a3 3 0 0 1 5-2 3 3 0 0 1 5 2c0 2.5-3 2-5 4Zm0 0c2 2 5 1.5 5 4a3 3 0 0 1-5 2 3 3 0 0 1-5-2c0-2.5 3-2 5-4Zm0 0c-2 0-4-2-4-4a4 4 0 0 1 8 0c0 2-2 4-4 4Zm0 0c0 2 2 4 4 4a4 4 0 0 1-8 0c0-2 2-4 4-4Z",
    music: "M9 18V5l10-2v13M9 18a3 3 0 1 1-3-3 3 3 0 0 1 3 3Zm10-2a3 3 0 1 1-3-3 3 3 0 0 1 3 3Z",
    shop: "M4 10h16l-1 10H5L4 10Zm2-5h12l2 5H4l2-5Zm3 9v6m6-6v6",
    sparkle: "m12 3 1.4 5.6L19 10l-5.6 1.4L12 17l-1.4-5.6L5 10l5.6-1.4L12 3Zm6 13 .5 2.5L21 19l-2.5.5L18 22l-.5-2.5L15 19l2.5-.5L18 16Z",
    utensils: "M7 3v7a2 2 0 0 0 4 0V3m-2 0v18m8-18v18m0-18c-2 2-3 4.5-3 7h6c0-2.5-1-5-3-7Z",
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

function ArrowIcon() {
  return (
    <svg
      aria-hidden="true"
      className="ml-2 size-4"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.8"
      viewBox="0 0 24 24"
    >
      <path d="M5 12h14m-6-6 6 6-6 6" />
    </svg>
  );
}

export default function BusinessTypePage() {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const router = useRouter();

  useEffect(() => {
    fetch("/api/onboarding/state")
      .then(async (response) => {
        if (!response.ok) return;
        const result = (await response.json()) as { category?: string; state?: string };
        if (result.state && result.state !== "NOT_STARTED") {
          if (result.state === "BUSINESS_TYPE_SELECTED") router.push("/register/business");
          else if (result.state === "BUSINESS_CREATED") router.push("/register/branch");
          else router.push("/register/verification");
        } else if (result.category) {
          setSelectedCategory(result.category);
        }
      })
      .catch(() => setError("Unable to load saved onboarding progress."))
      .finally(() => setLoading(false));
  }, [router]);

  return (
    <main className="relative min-h-screen overflow-hidden bg-background">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(255,122,0,0.18),transparent_42%)]" />
      <div className="relative mx-auto min-h-screen max-w-6xl px-5 py-8 sm:px-8 sm:py-10 lg:px-12">
        <header className="flex items-center justify-between">
          <Link
            className="flex items-center gap-2 text-lg font-bold tracking-tight text-white"
            href="/"
          >
            <span className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <Icon name="sparkle" className="size-5" />
            </span>
            FEASTY<span className="text-primary">MERCHANT</span>
          </Link>
          <span className="text-xs text-muted sm:text-sm">Step 1 of 4</span>
        </header>

        <div className="mx-auto max-w-3xl pb-16 pt-16 text-center sm:pt-20">
          <OnboardingProgress currentStep={1} />
          <div className="mx-auto mb-6 flex size-12 items-center justify-center rounded-2xl border border-primary/25 bg-primary/10 text-primary">
            <Icon name="shop" />
          </div>
          <p className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-accent">
            Tell us about your business
          </p>
          <h1 className="text-4xl font-semibold tracking-[-0.04em] text-white sm:text-5xl">
            What kind of business do you run?
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-base leading-7 text-muted">
            Choose the category that best describes your business. This helps us
            shape your FEASTY MERCHANT experience.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {categories.map((category) => {
            const isSelected = selectedCategory === category.title;

            return (
              <button
                aria-pressed={isSelected}
                className="text-left"
                key={category.title}
                onClick={() => setSelectedCategory(category.title)}
                type="button"
              >
                <Card
                  className={`group h-full min-h-44 p-5 transition duration-200 ${
                    isSelected
                      ? "border-primary bg-primary/10 shadow-lg shadow-orange-950/20"
                      : "hover:-translate-y-1 hover:border-primary/50"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <span
                      className={`flex size-11 items-center justify-center rounded-xl transition ${
                        isSelected
                          ? "bg-primary text-primary-foreground"
                          : "bg-white/5 text-primary group-hover:bg-primary/15"
                      }`}
                    >
                      <Icon name={category.icon} />
                    </span>
                    <span
                      className={`flex size-5 items-center justify-center rounded-full border transition ${
                        isSelected
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-white/20 text-transparent"
                      }`}
                    >
                      <Icon name="sparkle" className="size-3" />
                    </span>
                  </div>
                  <h2 className="mt-6 font-semibold text-white">{category.title}</h2>
                  <p className="mt-2 text-sm leading-5 text-muted">
                    {category.description}
                  </p>
                </Card>
              </button>
            );
          })}
        </div>

        <div className="mx-auto mt-12 max-w-md text-center">
          <div aria-live="polite" className="mb-5 min-h-6 text-sm text-accent">
            {selectedCategory ? (
              <>
                Selected category:{" "}
                <span className="font-semibold text-white">{selectedCategory}</span>
              </>
            ) : (
              "Select one category to continue."
            )}
          </div>
          <PrimaryButton
            className="w-full"
            disabled={!selectedCategory || loading}
            onClick={async () => {
              if (!selectedCategory) return;
              setError("");
              const response = await fetch("/api/onboarding/business-type", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ category: selectedCategory }),
              });
              if (response.ok) router.push("/register/business");
              else setError("Unable to save your business category.");
            }}
            type="button"
          >
            Continue
            <ArrowIcon />
          </PrimaryButton>
          {error ? <p className="mt-3 text-sm text-red-300" role="alert">{error}</p> : null}
          <p className="mt-5 text-xs text-muted sm:text-sm">
            You can change this later from Business Settings.
          </p>
        </div>
      </div>
    </main>
  );
}
