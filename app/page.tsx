import Link from "next/link";

import {
  Card,
  PageContainer,
  PrimaryButton,
  SecondaryButton,
} from "@/components/ui";

type IconName =
  | "arrow"
  | "chart"
  | "check"
  | "chevron"
  | "event"
  | "globe"
  | "menu"
  | "mic"
  | "offer"
  | "plus"
  | "review"
  | "shop"
  | "sparkle"
  | "store"
  | "users";

function Icon({ name, className = "size-5" }: { name: IconName; className?: string }) {
  const paths: Record<IconName, string> = {
    arrow: "M5 12h14m-6-6 6 6-6 6",
    chart: "M4 19V5m0 14h16M8 16v-4m4 4V8m4 8v-7",
    check: "m5 12 4 4L19 6",
    chevron: "m9 18 6-6-6-6",
    event: "M7 3v3m10-3v3M4 9h16M5 5h14a1 1 0 0 1 1 1v13H4V6a1 1 0 0 1 1-1Z",
    globe: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Zm0-18c2.2 2.4 3.3 5.4 3.3 9S14.2 18.6 12 21m0-18C9.8 5.4 8.7 8.4 8.7 12s1.1 6.6 3.3 9M3 12h18",
    menu: "M4 6h16M4 12h16M4 18h16",
    mic: "M12 15a3 3 0 0 0 3-3V7a3 3 0 1 0-6 0v5a3 3 0 0 0 3 3Zm-6-3a6 6 0 0 0 12 0m-6 6v3m-3 0h6",
    offer: "M20 12 12 20 4 12l8-8 8 8Zm-5-1h.01M11 14h.01",
    plus: "M12 5v14m-7-7h14",
    review: "m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2-5.6-3-5.6 3 1.1-6.2L3 9.6l6.2-.9L12 3Z",
    shop: "M4 10h16l-1 10H5L4 10Zm2-5h12l2 5H4l2-5Zm3 9v6m6-6v6",
    sparkle: "m12 3 1.4 5.6L19 10l-5.6 1.4L12 17l-1.4-5.6L5 10l5.6-1.4L12 3Zm6 13 .5 2.5L21 19l-2.5.5L18 22l-.5-2.5L15 19l2.5-.5L18 16Z",
    store: "M4 10v10h16V10M3 10l2-6h14l2 6M3 10a3 3 0 0 0 6 0 3 3 0 0 0 6 0 3 3 0 0 0 6 0M9 20v-5h6v5",
    users: "M16 20v-1a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v1m6-9a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm6-7a4 4 0 0 1 0 7.7M21 20v-1a4 4 0 0 0-3-3.9",
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

const benefits = [
  {
    title: "Verified Business",
    description: "Build trust with a verified presence customers can rely on.",
    icon: "check" as IconName,
  },
  {
    title: "Publish Today’s Offers",
    description: "Put fresh specials in front of nearby customers in seconds.",
    icon: "offer" as IconName,
  },
  {
    title: "Manage Menu Easily",
    description: "Keep menus, details, and availability accurate from one place.",
    icon: "menu" as IconName,
  },
  {
    title: "Reach FEASTYMAP Users",
    description: "Turn local discovery into more visits, orders, and bookings.",
    icon: "globe" as IconName,
  },
];

const platformFeatures: Array<[string, string, IconName, boolean]> = [
  ["Menu Management", "Keep every item and detail up to date.", "menu", false],
  ["Today’s Specials", "Share what is fresh, limited, and worth a visit.", "sparkle", false],
  ["Events", "Make upcoming experiences easy to discover.", "event", false],
  ["Offers", "Create timely reasons for customers to choose you.", "offer", false],
  ["Multiple Branches", "Bring every location into one clear workspace.", "store", false],
  ["Analytics", "Understand what brings your audience back.", "chart", false],
  ["AI Voice Update", "Update your business hands-free.", "mic" as IconName, true],
  ["Reviews & Reputation", "Build confidence through customer feedback.", "review" as IconName, true],
];

const categories = [
  ["Restaurant", "A home for memorable meals.", "shop"],
  ["Cafe", "Make every coffee moment count.", "store"],
  ["Bakery", "Showcase the craft behind every bake.", "sparkle"],
  ["Retail Shop", "Help local shoppers find you.", "store"],
  ["Entertainment", "Bring your best experiences to the map.", "event"],
  ["Salon", "Turn discovery into the next appointment.", "users"],
  ["Event Venue", "Fill your calendar with the right audience.", "event"],
  ["Other", "Your business belongs here too.", "plus"],
] as const;

function SectionHeading({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <div className="mx-auto max-w-2xl text-center">
      <p className="mb-4 text-sm font-semibold uppercase tracking-[0.2em] text-accent">
        {eyebrow}
      </p>
      <h2 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">
        {title}
      </h2>
      <p className="mt-4 text-base leading-7 text-muted sm:text-lg">{description}</p>
    </div>
  );
}

export default function Home() {
  const feastymapUrl = process.env.NEXT_PUBLIC_FEASTYMAP_URL || "https://feastymap.com";

  return (
    <main className="overflow-hidden bg-background">
      <section className="relative isolate">
        <div className="absolute inset-x-0 top-0 -z-10 h-[700px] bg-[radial-gradient(circle_at_50%_0%,rgba(255,122,0,0.2),transparent_58%)]" />
        <PageContainer className="py-5 sm:py-6">
          <nav className="flex items-center justify-between" aria-label="Main navigation">
            <Link href="/" className="flex items-center gap-2 text-lg font-bold tracking-tight text-white">
              <span className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                <Icon name="sparkle" className="size-5" />
              </span>
              FEASTY<span className="text-primary">MERCHANT</span>
            </Link>
            <div className="hidden items-center gap-8 text-sm text-muted md:flex">
              <a className="transition hover:text-white" href="#why">Why FEASTY</a>
              <a className="transition hover:text-white" href="#features">Features</a>
              <a className="transition hover:text-white" href="#categories">Categories</a>
            </div>
            <Link href="/login">
              <SecondaryButton className="min-h-10 px-4 py-2 text-xs sm:text-sm">Sign in</SecondaryButton>
            </Link>
          </nav>
        </PageContainer>

        <PageContainer className="relative pb-24 pt-20 text-center sm:pb-32 sm:pt-28 lg:pt-36">
          <div className="mx-auto max-w-4xl">
            <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/10 px-4 py-2 text-xs font-medium text-accent sm:text-sm">
              <span className="size-1.5 animate-pulse rounded-full bg-primary" />
              The business platform for local discovery
            </div>
            <h1 className="text-balance text-5xl font-semibold tracking-[-0.04em] text-white sm:text-7xl lg:text-8xl">
              Grow Your Business with{" "}
              <span className="bg-gradient-to-r from-primary via-orange-300 to-primary bg-clip-text text-transparent">
                FEASTY MERCHANT
              </span>
            </h1>
            <p className="mx-auto mt-7 max-w-2xl text-base leading-7 text-muted sm:text-lg sm:leading-8">
              Manage your menus, offers, events, and business information in one
              beautiful place — then reach the people already looking for you on FEASTYMAP.
            </p>
            <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">
              <Link href="/signup">
                <PrimaryButton className="group">
                  Register Business
                  <Icon name="arrow" className="ml-2 size-4 transition group-hover:translate-x-1" />
                </PrimaryButton>
              </Link>
              <a href={feastymapUrl} rel="noreferrer" target="_blank">
                <SecondaryButton>
                  Explore FEASTYMAP
                  <Icon name="globe" className="ml-2 size-4" />
                </SecondaryButton>
              </a>
            </div>
          </div>

          <div className="mx-auto mt-16 max-w-4xl rounded-2xl border border-white/10 bg-white/[0.04] p-3 shadow-2xl shadow-orange-950/20 backdrop-blur-xl sm:mt-20 sm:p-5">
            <div className="rounded-xl border border-white/10 bg-[#111] p-5 text-left sm:p-8">
              <div className="flex items-center justify-between border-b border-white/10 pb-5">
                <div>
                  <p className="text-xs font-medium text-muted">Your business, in one view</p>
                  <p className="mt-1 text-lg font-semibold text-white">Good morning, merchant</p>
                </div>
                <span className="rounded-lg bg-primary/15 px-3 py-1.5 text-xs font-medium text-accent">Live preview</span>
              </div>
              <div className="grid gap-3 pt-5 sm:grid-cols-3">
                {[
                  ["Profile reach", "12.8k", "+18.4%"],
                  ["Menu views", "4,290", "+12.1%"],
                  ["Active offers", "08", "Ready to publish"],
                ].map(([label, value, change]) => (
                  <div key={label} className="rounded-xl border border-white/10 bg-white/[0.04] p-4">
                    <p className="text-xs text-muted">{label}</p>
                    <p className="mt-3 text-2xl font-semibold text-white">{value}</p>
                    <p className="mt-1 text-xs text-primary">{change}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </PageContainer>
      </section>

      <section id="why" className="border-t border-white/10 bg-[#0d0d0d]">
        <PageContainer className="py-24 sm:py-32">
          <SectionHeading eyebrow="Built for momentum" title="Everything your business needs to be found." description="FEASTY MERCHANT makes the everyday work of running a local business feel clear, simple, and connected." />
          <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {benefits.map((benefit) => (
              <Card key={benefit.title} className="p-6">
                <span className="flex size-11 items-center justify-center rounded-xl bg-primary/15 text-primary">
                  <Icon name={benefit.icon} />
                </span>
                <h3 className="mt-6 font-semibold text-white">{benefit.title}</h3>
                <p className="mt-2 text-sm leading-6 text-muted">{benefit.description}</p>
              </Card>
            ))}
          </div>
        </PageContainer>
      </section>

      <section className="bg-background">
        <PageContainer className="py-24 sm:py-32">
          <SectionHeading eyebrow="Simple by design" title="From registration to real reach." description="A clear path from getting verified to becoming part of the local discovery experience." />
          <div className="relative mt-16 grid gap-10 sm:grid-cols-2 lg:grid-cols-4 lg:gap-4">
            {[
              ["01", "Register", "Tell us about your business.", "plus"],
              ["02", "Verify", "We review the details you share.", "check"],
              ["03", "Publish", "Make your menus and offers live.", "sparkle"],
              ["04", "Reach Customers", "Get discovered by FEASTYMAP users.", "users"],
            ].map(([number, title, description, icon], index) => (
              <div key={title} className="relative text-center lg:px-4">
                {index < 3 ? <div className="absolute left-[calc(50%+3rem)] top-6 hidden w-[calc(100%-2rem)] border-t border-dashed border-primary/30 lg:block" /> : null}
                <span className="relative mx-auto flex size-12 items-center justify-center rounded-2xl border border-primary/30 bg-primary/10 text-primary">
                  <Icon name={icon as IconName} />
                </span>
                <p className="mt-5 text-xs font-semibold tracking-[0.2em] text-primary">{number}</p>
                <h3 className="mt-2 text-lg font-semibold text-white">{title}</h3>
                <p className="mx-auto mt-2 max-w-[16rem] text-sm leading-6 text-muted">{description}</p>
              </div>
            ))}
          </div>
        </PageContainer>
      </section>

      <section id="features" className="border-y border-white/10 bg-[#0d0d0d]">
        <PageContainer className="py-24 sm:py-32">
          <SectionHeading eyebrow="One connected platform" title="Tools that move at the speed of your business." description="Keep your presence fresh, your customers close, and your next opportunity within reach." />
          <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {platformFeatures.map(([title, description, icon, comingSoon]) => (
              <Card key={title} className="group relative p-6">
                {comingSoon ? <span className="absolute right-5 top-5 rounded-full bg-white/10 px-2.5 py-1 text-[10px] font-medium uppercase tracking-wider text-muted">Soon</span> : null}
                <span className="flex size-10 items-center justify-center rounded-xl bg-white/5 text-accent transition group-hover:bg-primary/15 group-hover:text-primary">
                  <Icon name={icon} />
                </span>
                <h3 className="mt-5 font-semibold text-white">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-muted">{description}</p>
              </Card>
            ))}
          </div>
        </PageContainer>
      </section>

      <section id="categories">
        <PageContainer className="py-24 sm:py-32">
          <SectionHeading eyebrow="Made for local businesses" title="Whatever you create, there’s a place for you." description="From the first pour to the final encore, FEASTY MERCHANT helps every kind of business show up beautifully." />
          <div className="mt-14 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {categories.map(([title, description, icon]) => (
              <Card key={title} className="group flex items-center gap-4 p-4 sm:p-5">
                <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Icon name={icon as IconName} />
                </span>
                <span className="min-w-0">
                  <span className="block font-medium text-white">{title}</span>
                  <span className="mt-1 block text-xs leading-5 text-muted">{description}</span>
                </span>
                <Icon name="chevron" className="ml-auto size-4 shrink-0 text-muted transition group-hover:translate-x-1 group-hover:text-primary" />
              </Card>
            ))}
          </div>
        </PageContainer>
      </section>

      <section className="border-y border-white/10 bg-[radial-gradient(circle_at_50%_100%,rgba(255,122,0,0.16),transparent_55%)]">
        <PageContainer className="py-24 sm:py-32">
          <div className="mx-auto grid max-w-5xl gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
            <div>
              <p className="mb-4 text-sm font-semibold uppercase tracking-[0.2em] text-accent">Trust, built in</p>
              <h2 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">A better map starts with better information.</h2>
              <p className="mt-5 leading-7 text-muted">FEASTYMAP is designed around businesses and experiences people can trust. Every merchant gets the tools to keep their presence authentic and useful.</p>
            </div>
            <Card className="p-6 sm:p-8">
              <div className="space-y-5">
                {["Verified businesses only.", "Admin approval before publishing.", "Built to prevent fake information.", "FEASTYMAP shows only approved content."].map((item) => (
                  <div key={item} className="flex items-center gap-4">
                    <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary"><Icon name="check" className="size-4" /></span>
                    <span className="text-sm text-white sm:text-base">{item}</span>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </PageContainer>
      </section>

      <footer>
        <PageContainer className="py-12 sm:py-16">
          <div className="flex flex-col gap-10 border-b border-white/10 pb-10 sm:flex-row sm:items-start sm:justify-between">
            <div className="max-w-xs">
              <Link href="/" className="flex items-center gap-2 text-lg font-bold tracking-tight text-white">
                <span className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground"><Icon name="sparkle" className="size-5" /></span>
                FEASTY<span className="text-primary">MERCHANT</span>
              </Link>
              <p className="mt-4 text-sm leading-6 text-muted">The official business platform connected to FEASTYMAP.</p>
            </div>
            <div className="grid grid-cols-2 gap-x-12 gap-y-3 text-sm sm:gap-x-20">
              <a className="text-muted transition hover:text-white" href="#why">Why FEASTY</a>
              <a className="text-muted transition hover:text-white" href="#features">Platform features</a>
              <a className="text-muted transition hover:text-white" href="#categories">Business categories</a>
              <a className="text-muted transition hover:text-white" href="mailto:hello@feasty.example">Contact us</a>
            </div>
          </div>
          <div className="flex flex-col gap-2 pt-6 text-xs text-muted sm:flex-row sm:items-center sm:justify-between">
            <span>© 2026 FEASTY MERCHANT. All rights reserved.</span>
            <span>Built for businesses that bring people together.</span>
          </div>
        </PageContainer>
      </footer>
    </main>
  );
}
