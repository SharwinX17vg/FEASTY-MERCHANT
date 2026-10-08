"use client";

import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

import { Card, PageContainer, SecondaryButton } from "@/components/ui";
import { isContentCurrentlyActive } from "@/lib/content/publication";
import { type ContentType } from "@/lib/validation/content";

type PublicContentItem = {
  id: string;
  business_id: string;
  content_type: ContentType;
  title: string;
  body: string;
  starts_at: string | null;
  ends_at: string | null;
  original_price: number | null;
  offer_price: number | null;
  discount_percentage: number | null;
  offer_code: string | null;
  published_at: string | null;
  image_url: string | null;
};

type ContentResponse = {
  items?: PublicContentItem[];
  message?: string;
};

type PublicBusiness = {
  id: string;
  name: string;
  code: string;
  category: string;
  description: string | null;
  website_url: string | null;
};

async function recordContentAnalytics(contentId: string, eventType: "view" | "click") {
  await fetch(`/api/public/content/${encodeURIComponent(contentId)}/analytics`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ event_type: eventType }),
    keepalive: true,
  });
}

async function redeemContentOffer(contentId: string) {
  const response = await fetch(`/api/public/content/${encodeURIComponent(contentId)}/redeem`, {
    method: "POST",
    keepalive: true,
  });
  const result = (await response.json()) as { message?: string };
  if (!response.ok) throw new Error(result.message ?? "This offer is not currently available.");
}

type BusinessResponse = {
  business?: PublicBusiness;
  message?: string;
};

function formatDate(value: string | null) {
  if (!value) return "Always";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "Not set"
    : new Intl.DateTimeFormat("en-IN", { dateStyle: "medium" }).format(date);
}

function activeDates(item: PublicContentItem) {
  if (!item.starts_at && !item.ends_at) return "Always active";
  return `${formatDate(item.starts_at)} – ${formatDate(item.ends_at)}`;
}

function ContentCard({ item }: { item: PublicContentItem }) {
  const [redemptionMessage, setRedemptionMessage] = useState("");
  const [redemptionError, setRedemptionError] = useState("");

  async function handleUseOffer() {
    setRedemptionMessage("");
    setRedemptionError("");
    await recordContentAnalytics(item.id, "click");
    try {
      await redeemContentOffer(item.id);
      setRedemptionMessage("Offer used. Show the code at the business.");
    } catch (error) {
      setRedemptionError(error instanceof Error ? error.message : "This offer is not currently available.");
    }
  }

  return (
    <Card className="overflow-hidden">
      {item.image_url ? (
        <img
          alt=""
          className="h-56 w-full object-cover"
          src={item.image_url}
        />
      ) : null}
      <div className="p-6">
        <div className="flex items-center justify-between gap-4">
          <span className="rounded-full border border-primary/25 bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-accent">
            {item.content_type}
          </span>
          <span className="text-xs text-muted">{activeDates(item)}</span>
        </div>
        <h2 className="mt-4 text-2xl font-semibold tracking-tight text-white">{item.title}</h2>
        <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-muted">{item.body}</p>
        {item.content_type === "offer" ? (
          <div className="mt-5 flex flex-wrap gap-2 text-sm font-medium text-primary">
            {item.original_price !== null ? <span>Was {item.original_price}</span> : null}
            {item.offer_price !== null ? <span>Now {item.offer_price}</span> : null}
            {item.discount_percentage !== null ? <span>{item.discount_percentage}% off</span> : null}
            {item.offer_code ? <span>Code: {item.offer_code}</span> : null}
          </div>
        ) : null}
        <button
          className="mt-5 rounded-xl border border-primary/40 px-4 py-2 text-sm font-semibold text-primary transition hover:bg-primary/10"
          onClick={() => void (item.content_type === "offer" && item.offer_code ? handleUseOffer() : recordContentAnalytics(item.id, "click"))}
          type="button"
        >
          {item.content_type === "offer" && item.offer_code ? "Use Offer" : item.content_type === "offer" ? "View offer" : "View content"}
        </button>
        {redemptionMessage ? <p className="mt-3 text-sm text-primary">{redemptionMessage}</p> : null}
        {redemptionError ? <p className="mt-3 text-sm text-red-200">{redemptionError}</p> : null}
      </div>
    </Card>
  );
}

export function PublicContentFeed({ routeBusinessId = "" }: { routeBusinessId?: string }) {
  const queryBusinessId = useSearchParams().get("businessId") ?? "";
  const businessId = routeBusinessId || queryBusinessId;
  const [items, setItems] = useState<PublicContentItem[]>([]);
  const [business, setBusiness] = useState<PublicBusiness | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!businessId) return;

    async function loadContent() {
      try {
        const [businessResponse, contentResponse] = await Promise.all([
          fetch(`/api/public/business?businessId=${encodeURIComponent(businessId)}`),
          fetch(`/api/public/content?businessId=${encodeURIComponent(businessId)}`),
        ]);
        const businessResult = (await businessResponse.json()) as BusinessResponse;
        const contentResult = (await contentResponse.json()) as ContentResponse;
        if (!businessResponse.ok) throw new Error(businessResult.message ?? "Unable to load business.");
        if (!contentResponse.ok) throw new Error(contentResult.message ?? "Unable to load published content.");
        setBusiness(businessResult.business ?? null);
        const activeItems = (contentResult.items ?? []).filter((item) => isContentCurrentlyActive(item.starts_at, item.ends_at));
        setItems(activeItems);
        await Promise.all(activeItems.map((item) => recordContentAnalytics(item.id, "view")));
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "Unable to load published content.");
      } finally {
        setIsLoading(false);
      }

    }
    void loadContent();
  }, [businessId]);

  const loading = Boolean(businessId) && isLoading;

  return (
    <main className="min-h-screen bg-background">
      <PageContainer>
        <nav className="flex items-center justify-between" aria-label="Public navigation">
          <Link className="text-lg font-bold tracking-tight text-white" href="/">
            FEASTY<span className="text-primary">MERCHANT</span>
          </Link>
          <a href="https://feastymap.vercel.app/outing-planner" rel="noopener noreferrer" target="_blank">
            <SecondaryButton className="min-h-10 px-4 py-2 text-xs sm:text-sm">Explore FEASTY Map</SecondaryButton>
          </a>
        </nav>

        <section className="mx-auto max-w-6xl py-16 sm:py-24">
          <div className="max-w-2xl">
            {business ? (
              <>
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-accent">{business.category}</p>
                <h1 className="mt-4 text-4xl font-semibold tracking-tight text-white sm:text-6xl">{business.name}</h1>
                <p className="mt-5 text-base leading-7 text-muted">{business.description ?? "Fresh posts and offers from this FEASTY business."}</p>
                <div className="mt-6 flex flex-wrap gap-3">
                  <a href="https://feastymap.vercel.app/outing-planner" rel="noopener noreferrer" target="_blank">
                    <SecondaryButton>View on FEASTY Map</SecondaryButton>
                  </a>
                  {business.website_url ? (
                    <a className="inline-flex min-h-11 items-center rounded-xl border border-white/15 px-4 text-sm font-medium text-foreground transition hover:border-primary hover:text-primary" href={business.website_url} rel="noopener noreferrer" target="_blank">
                      Visit business website
                    </a>
                  ) : null}
                </div>
              </>
            ) : (
              <>
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-accent">FEASTYMAP updates</p>
                <h1 className="mt-4 text-4xl font-semibold tracking-tight text-white sm:text-6xl">Fresh from this business</h1>
                <p className="mt-5 text-base leading-7 text-muted">Discover the latest posts and offers currently available from this FEASTY business.</p>
              </>
            )}
          </div>

          {!businessId ? (
            <Card className="mt-10 p-6">
              <p className="text-sm text-muted">A business must be selected to view its published content.</p>
            </Card>
          ) : null}
          {loading ? <p className="mt-10 text-sm text-muted" role="status">Loading published content…</p> : null}
          {error ? <Card className="mt-10 border-red-400/20 bg-red-400/10 p-6"><p className="text-sm text-red-200">{error}</p></Card> : null}
          {!loading && !error && businessId && items.length === 0 ? (
            <Card className="mt-10 p-8 text-center">
              <h2 className="text-xl font-semibold text-white">No active content yet</h2>
              <p className="mt-2 text-sm text-muted">Check back soon for new posts and offers.</p>
            </Card>
          ) : null}
          {items.length > 0 ? (
            <div className="mt-10 grid gap-6 md:grid-cols-2">
              {items.map((item) => <ContentCard item={item} key={item.id} />)}
            </div>
          ) : null}
        </section>
      </PageContainer>
    </main>
  );
}

export default function PublicContentPage() {
  return (
    <Suspense fallback={<main className="min-h-screen bg-background" />}>
      <PublicContentFeed />
    </Suspense>
  );
}
