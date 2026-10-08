export const contentAnalyticsEventTypes = ["view", "click"] as const;
export type ContentAnalyticsEventType = (typeof contentAnalyticsEventTypes)[number];

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
