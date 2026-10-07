"use client";

import { Suspense } from "react";

import { PublicContentFeed } from "../page";

export default function BusinessContentPage({ params }: { params: { businessId: string } }) {
  return (
    <Suspense fallback={<main className="min-h-screen bg-background" />}>
      <PublicContentFeed routeBusinessId={params.businessId} />
    </Suspense>
  );
}
