export const contentAnalyticsEventTypes = ["view", "click"] as const;
export type ContentAnalyticsEventType = (typeof contentAnalyticsEventTypes)[number];

export type ContentAnalyticsRow = {
  content_id: string;
  event_date: string;
  event_type: string;
  event_count: number | string | null;
};

export type ContentRedemptionRow = {
  content_id: string;
  redemption_date: string;
  redemption_count: number | string | null;
};

export type ContentAnalyticsDashboard = {
  summary: {
    total_views: number;
    total_clicks: number;
    total_redemptions: number;
    engagement_rate: number;
  };
  daily7: Array<{ date: string; views: number; clicks: number; redemptions: number }>;
  daily30: Array<{ date: string; views: number; clicks: number; redemptions: number }>;
  best_performing: Array<{
    content_id: string;
    title: string;
    content_type: string;
    views: number;
    clicks: number;
    redemptions: number;
    engagement_rate: number;
  }>;
};

export function validateContentAnalyticsEvent(value: unknown) {
  const eventType = String(value ?? "").trim();
  return contentAnalyticsEventTypes.includes(eventType as ContentAnalyticsEventType)
    ? { eventType: eventType as ContentAnalyticsEventType }
    : { error: "Choose a valid analytics event." };
}

export function countContentAnalyticsEvents(
  events: Array<{ content_id: string; event_type: string; event_count: number | string | null }>,
) {
  return events.reduce<Record<string, { view_count: number; click_count: number }>>((counts, event) => {
    const current = counts[event.content_id] ?? { view_count: 0, click_count: 0 };
    const eventCount = Number(event.event_count ?? 0);
    if (event.event_type === "view") current.view_count += Number.isFinite(eventCount) ? eventCount : 0;
    if (event.event_type === "click") current.click_count += Number.isFinite(eventCount) ? eventCount : 0;
    counts[event.content_id] = current;
    return counts;
  }, {});
}

export function calculateEngagementRate(views: number, clicks: number) {
  return views > 0 ? Number(((clicks / views) * 100).toFixed(2)) : 0;
}

function dateKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

function dailyRange(days: number, now: Date) {
  return Array.from({ length: days }, (_, index) => {
    const date = new Date(now);
    date.setUTCDate(date.getUTCDate() - (days - index - 1));
    return dateKey(date);
  });
}

export function buildContentAnalyticsDashboard(
  content: Array<{ id: string; title: string; content_type: string }>,
  analytics: ContentAnalyticsRow[],
  redemptions: ContentRedemptionRow[],
  now = new Date(),
): ContentAnalyticsDashboard {
  const activeContent = new Map(content.map((item) => [item.id, item]));
  const startDate = dateKey(new Date(now.getTime() - 29 * 24 * 60 * 60 * 1000));
  const eventTotals = new Map<string, { views: number; clicks: number }>();
  const redemptionTotals = new Map<string, number>();
  const daily = new Map<string, { views: number; clicks: number; redemptions: number }>();

  for (const date of dailyRange(30, now)) daily.set(date, { views: 0, clicks: 0, redemptions: 0 });
  for (const row of analytics) {
    if (!activeContent.has(row.content_id) || row.event_date < startDate) continue;
    const count = Number(row.event_count ?? 0);
    if (!Number.isFinite(count)) continue;
    const totals = eventTotals.get(row.content_id) ?? { views: 0, clicks: 0 };
    if (row.event_type === "view") totals.views += count;
    if (row.event_type === "click") totals.clicks += count;
    eventTotals.set(row.content_id, totals);
    const day = daily.get(row.event_date);
    if (day && row.event_type === "view") day.views += count;
    if (day && row.event_type === "click") day.clicks += count;
  }
  for (const row of redemptions) {
    if (!activeContent.has(row.content_id) || row.redemption_date < startDate) continue;
    const count = Number(row.redemption_count ?? 0);
    if (!Number.isFinite(count)) continue;
    redemptionTotals.set(row.content_id, (redemptionTotals.get(row.content_id) ?? 0) + count);
    const day = daily.get(row.redemption_date);
    if (day) day.redemptions += count;
  }

  const daily30 = dailyRange(30, now).map((date) => ({ date, ...daily.get(date)! }));
  const daily7 = daily30.slice(-7);
  const total_views = daily30.reduce((sum, day) => sum + day.views, 0);
  const total_clicks = daily30.reduce((sum, day) => sum + day.clicks, 0);
  const total_redemptions = daily30.reduce((sum, day) => sum + day.redemptions, 0);
  const best_performing = [...activeContent.values()]
    .map((item) => {
      const totals = eventTotals.get(item.id) ?? { views: 0, clicks: 0 };
      return {
        content_id: item.id,
        title: item.title,
        content_type: item.content_type,
        views: totals.views,
        clicks: totals.clicks,
        redemptions: redemptionTotals.get(item.id) ?? 0,
        engagement_rate: calculateEngagementRate(totals.views, totals.clicks),
      };
    })
    .sort((a, b) => (b.clicks + b.redemptions) - (a.clicks + a.redemptions) || b.views - a.views)
    .slice(0, 5);

  return {
    summary: { total_views, total_clicks, total_redemptions, engagement_rate: calculateEngagementRate(total_views, total_clicks) },
    daily7,
    daily30,
    best_performing,
  };
}
