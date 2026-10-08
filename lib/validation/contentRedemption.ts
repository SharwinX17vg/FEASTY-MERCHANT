export type RedeemableContent = {
  content_type: string;
  offer_code: string | null;
  publication_status: string;
  publish_at?: string | null;
  starts_at: string | null;
  ends_at: string | null;
};

export function validateOfferRedemption(content: RedeemableContent, now = new Date()) {
  if (content.content_type !== "offer") return { valid: false, error: "Only offers can be redeemed." };
  if (!content.offer_code) return { valid: false, error: "This offer does not have an offer code." };
  if (content.publication_status !== "published") return { valid: false, error: "This offer is not published." };

  const nowMs = now.getTime();
  const publishAt = content.publish_at ? Date.parse(content.publish_at) : null;
  if (publishAt !== null && (!Number.isFinite(publishAt) || publishAt > nowMs)) {
    return { valid: false, error: "This offer is not currently published." };
  }
  const startsAt = content.starts_at ? Date.parse(content.starts_at) : null;
  const endsAt = content.ends_at ? Date.parse(content.ends_at) : null;
  if (startsAt !== null && (!Number.isFinite(startsAt) || startsAt > nowMs)) {
    return { valid: false, error: "This offer is not currently active." };
  }
  if (endsAt !== null && (!Number.isFinite(endsAt) || endsAt <= nowMs)) {
    return { valid: false, error: "This offer has expired." };
  }
  return { valid: true };
}

export function countContentRedemptions(
  events: Array<{ content_id: string; redemption_count: number | string | null }>,
) {
  return events.reduce<Record<string, number>>((counts, event) => {
    const count = Number(event.redemption_count ?? 0);
    counts[event.content_id] = (counts[event.content_id] ?? 0) + (Number.isFinite(count) ? count : 0);
    return counts;
  }, {});
}
