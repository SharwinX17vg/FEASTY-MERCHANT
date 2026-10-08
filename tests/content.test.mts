import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import type { SupabaseClient } from "@supabase/supabase-js";

import {
  canApproveContent,
  canPublishContent,
  getContentPublicationLabel,
  isContentPubliclyAvailable,
  canSubmitContent,
  getContentApprovalUpdate,
  getContentPublicationUpdate,
  getContentRejectionUpdate,
  getContentSubmissionUpdate,
  isContentCurrentlyActive,
} from "../lib/content/publication.ts";
import { validateContent, validateRejectionReason } from "../lib/validation/content.ts";
import { buildContentAnalyticsDashboard, calculateEngagementRate, countContentAnalyticsEvents, validateContentAnalyticsEvent } from "../lib/validation/contentAnalytics.ts";
import { countContentRedemptions, validateOfferRedemption } from "../lib/validation/contentRedemption.ts";
import { contentAuditActions, getContentEditAuditAction, recordContentAudit } from "../lib/content/audit.ts";
import {
  MAX_CONTENT_IMAGE_SIZE,
  createContentImagePath,
  validateContentImage,
} from "../lib/content/storage.ts";

test("validates and normalizes merchant content", () => {
  const result = validateContent({
    content_type: "offer",
    title: "  Weekend special ",
    body: "Two-for-one coffee.",
    original_price: "10",
    offer_price: "7.5",
    discount_percentage: "25",
    offer_code: "WEEKEND",
  });

  test("only currently active content is eligible for public display", () => {
    const now = new Date("2026-10-08T00:00:00.000Z");
    assert.equal(isContentCurrentlyActive(null, null, now), true);
    assert.equal(isContentCurrentlyActive("2026-10-07T00:00:00.000Z", "2026-10-09T00:00:00.000Z", now), true);
    assert.equal(isContentCurrentlyActive("2026-10-09T00:00:00.000Z", null, now), false);
    assert.equal(isContentCurrentlyActive(null, "2026-10-08T00:00:00.000Z", now), false);
  });
  assert.deepEqual(result.errors, {});
  assert.equal(result.values.title, "Weekend special");
  assert.equal(result.values.starts_at, null);
  assert.equal(result.values.original_price, 10);
  assert.equal(result.values.offer_price, 7.5);
  assert.equal(result.values.discount_percentage, 25);
  assert.equal(result.values.offer_code, "WEEKEND");
});

test("rejects invalid content and date ranges", () => {
  const result = validateContent({
    content_type: "unknown",
    title: "x",
    body: "",
    starts_at: "2026-10-10",
    ends_at: "2026-10-09",
  });
  assert.equal(result.errors.content_type, "Choose a valid content type.");
  assert.equal(result.errors.title, "Title must be between 2 and 160 characters.");
  assert.equal(result.errors.body, "Content must be between 1 and 5,000 characters.");
  assert.equal(result.errors.ends_at, "End date must be after the start date.");
});

test("rejects nonsensical offer details", () => {
  const result = validateContent({
    content_type: "offer",
    title: "Offer",
    body: "Save now",
    original_price: "0",
    offer_price: "20",
    discount_percentage: "101",
    offer_code: "x".repeat(51),
  });
  assert.equal(result.errors.original_price, "Original price must be greater than 0.");
  assert.equal(result.errors.offer_price, "Offer price cannot be greater than the original price.");
  assert.equal(result.errors.discount_percentage, "Discount must be between 0 and 100.");
  assert.equal(result.errors.offer_code, "Offer code must be 1 to 50 characters.");
});

test("post content ignores offer-only fields", () => {
  const result = validateContent({
    content_type: "post",
    title: "Update",
    body: "Opening soon",
    original_price: "10",
    offer_code: "SAVE",
  });
  assert.deepEqual(result.errors, {});
  assert.equal(result.values.original_price, null);
  assert.equal(result.values.offer_code, null);
});

test("validates content analytics events", () => {
  assert.deepEqual(validateContentAnalyticsEvent("view"), { eventType: "view" });
  assert.deepEqual(validateContentAnalyticsEvent("click"), { eventType: "click" });
  assert.equal(validateContentAnalyticsEvent("scroll").error, "Choose a valid analytics event.");
});

test("validates scheduled publication dates and public availability", () => {
  const validation = validateContent({
    content_type: "post",
    title: "Scheduled",
    body: "Coming soon",
    publish_at: "2026-10-10T10:00:00.000Z",
    ends_at: "2026-10-10T09:00:00.000Z",
  });
  assert.equal(validation.errors.publish_at, "Publish date must be before the end date.");
  const now = new Date("2026-10-08T00:00:00.000Z");
  assert.equal(isContentPubliclyAvailable("published", "2026-10-09T00:00:00.000Z", null, null, now), false);
  assert.equal(isContentPubliclyAvailable("published", "2026-10-07T00:00:00.000Z", null, null, now), true);
  assert.equal(isContentPubliclyAvailable("approved", "2026-10-07T00:00:00.000Z", null, null, now), false);
  assert.equal(getContentPublicationLabel("published", "2026-10-09T00:00:00.000Z", now), "Scheduled");
});

test("maps content mutations to append-only audit actions", () => {
  assert.deepEqual(contentAuditActions, [
    "create",
    "update",
    "submit",
    "resubmit",
    "reject",
    "approve",
    "publish",
    "schedule",
    "unschedule",
    "reschedule",
    "unpublish",
    "delete",
    "archive",
  ]);
  assert.equal((contentAuditActions as readonly string[]).includes("view"), false);
  assert.equal((contentAuditActions as readonly string[]).includes("click"), false);
  assert.equal((contentAuditActions as readonly string[]).includes("redemption"), false);
  assert.equal(getContentEditAuditAction(null, "2026-10-09T00:00:00.000Z"), "schedule");
  assert.equal(getContentEditAuditAction("2026-10-09T00:00:00.000Z", null), "unschedule");
  assert.equal(getContentEditAuditAction("2026-10-09T00:00:00.000Z", "2026-10-10T00:00:00.000Z"), "reschedule");
  assert.equal(getContentEditAuditAction(null, null), "update");
});

test("records one scoped audit row with the authenticated actor", async () => {
  let inserted: Record<string, unknown> | null = null;
  const client = {
    from(table: string) {
      assert.equal(table, "content_audit_log");
      return {
        insert(values: Record<string, unknown>) {
          inserted = values;
          return Promise.resolve({ error: null });
        },
      };
    },
  } as unknown as SupabaseClient;

  assert.equal(await recordContentAudit(client, {
    action: "approve",
    actor_id: "actor-1",
    business_id: "business-1",
    content_id: "content-1",
    from_status: "pending_review",
    to_status: "approved",
  }), null);
  assert.deepEqual(inserted, {
    action: "approve",
    actor_id: "actor-1",
    business_id: "business-1",
    content_id: "content-1",
    details: {},
    from_status: "pending_review",
    to_status: "approved",
  });
});

test("counts aggregate content analytics events", () => {
  assert.deepEqual(countContentAnalyticsEvents([
    { content_id: "content-1", event_type: "view", event_count: 3 },
    { content_id: "content-1", event_type: "view", event_count: "2" },
    { content_id: "content-1", event_type: "click", event_count: 1 },
    { content_id: "content-2", event_type: "click", event_count: 4 },
  ]), {
    "content-1": { view_count: 5, click_count: 1 },
    "content-2": { view_count: 0, click_count: 4 },
  });

  test("calculates engagement rate and dashboard aggregates", () => {
    assert.equal(calculateEngagementRate(0, 4), 0);
    assert.equal(calculateEngagementRate(8, 2), 25);
    const dashboard = buildContentAnalyticsDashboard(
      [{ id: "content-1", title: "Offer", content_type: "offer" }],
      [
        { content_id: "content-1", event_date: "2026-10-08", event_type: "view", event_count: 8 },
        { content_id: "content-1", event_date: "2026-10-08", event_type: "click", event_count: 2 },
      ],
      [{ content_id: "content-1", redemption_date: "2026-10-08", redemption_count: 1 }],
      new Date("2026-10-08T12:00:00.000Z"),
    );
    assert.deepEqual(dashboard.summary, { total_views: 8, total_clicks: 2, total_redemptions: 1, engagement_rate: 25 });
    assert.equal(dashboard.daily7.at(-1)?.views, 8);
    assert.equal(dashboard.daily30.length, 30);
    assert.equal(dashboard.best_performing[0]?.content_id, "content-1");
  });

  test("validates active coded offer redemption conditions", () => {
    const now = new Date("2026-10-08T00:00:00.000Z");
    const offer = {
      content_type: "offer",
      offer_code: "SAVE10",
      publication_status: "published",
      starts_at: "2026-10-07T00:00:00.000Z",
      ends_at: "2026-10-09T00:00:00.000Z",
    };
    assert.deepEqual(validateOfferRedemption(offer, now), { valid: true });
    assert.equal(validateOfferRedemption({ ...offer, ends_at: "2026-10-08T00:00:00.000Z" }, now).valid, false);
    assert.equal(validateOfferRedemption({ ...offer, publication_status: "draft" }, now).valid, false);
    assert.equal(validateOfferRedemption({ ...offer, offer_code: null }, now).valid, false);
    assert.equal(validateOfferRedemption({ ...offer, content_type: "post" }, now).valid, false);
  });

  test("counts aggregate offer redemptions", () => {
    assert.deepEqual(countContentRedemptions([
      { content_id: "content-1", redemption_count: 2 },
      { content_id: "content-1", redemption_count: "3" },
      { content_id: "content-2", redemption_count: 1 },
    ]), { "content-1": 5, "content-2": 1 });
  });
});

test("content publication follows merchant review workflow", () => {
  assert.equal(canSubmitContent("branch_manager", "draft"), true);
  assert.equal(canApproveContent("admin", "pending_review"), true);
  assert.equal(canPublishContent("moderator", "approved"), true);
  assert.deepEqual(getContentSubmissionUpdate("draft", "2026-10-07T00:00:00.000Z"), {
    publication_status: "pending_review",
    submitted_at: "2026-10-07T00:00:00.000Z",
    rejection_reason: null,
  });

  test("validates safe content images and storage paths", () => {
    const png = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]);
    assert.equal(validateContentImage("offer.png", "image/png", png.length, png).valid, true);
    assert.equal(validateContentImage("../offer.png", "image/png", png.length, png).valid, false);
    assert.equal(validateContentImage("offer.png", "image/jpeg", png.length, png).valid, false);
    assert.equal(validateContentImage("offer.png", "image/png", MAX_CONTENT_IMAGE_SIZE + 1, png).valid, false);
    assert.equal(
      createContentImagePath("11111111-1111-1111-1111-111111111111", "22222222-2222-2222-2222-222222222222", "png"),
      "11111111-1111-1111-1111-111111111111/22222222-2222-2222-2222-222222222222.png",
    );
  });
  assert.deepEqual(getContentApprovalUpdate("pending_review"), { publication_status: "approved" });
  assert.deepEqual(getContentPublicationUpdate("approved", "2026-10-07T00:00:00.000Z"), {
    publication_status: "published",
    published_at: "2026-10-07T00:00:00.000Z",
  });
  assert.equal(canSubmitContent("org_owner", "rejected"), true);
  assert.deepEqual(getContentRejectionUpdate("pending_review", "Needs a clearer offer."), {
    publication_status: "rejected",
    rejection_reason: "Needs a clearer offer.",
  });
  assert.deepEqual(getContentSubmissionUpdate("rejected", "2026-10-08T00:00:00.000Z"), {
    publication_status: "pending_review",
    submitted_at: "2026-10-08T00:00:00.000Z",
    rejection_reason: null,
  });
  assert.equal(validateRejectionReason("x").error, "Enter a rejection reason between 2 and 1,000 characters.");
});

test("database workflow protection preserves valid transitions and blocks bypasses", () => {
  const migration = readFileSync(
    new URL("../supabase/migrations/20261008220000_merchant_content_workflow_protection.sql", import.meta.url),
    "utf8",
  );

  for (const transition of [
    "old.publication_status = 'draft'",
    "old.publication_status = 'rejected'",
    "old.publication_status = 'pending_review'",
    "old.publication_status = 'approved'",
  ]) {
    assert.match(migration, new RegExp(transition.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  }
  assert.match(migration, /new\.publication_status = 'pending_review'/);
  assert.match(migration, /new\.publication_status = 'rejected'/);
  assert.match(migration, /new\.publication_status = 'approved'/);
  assert.match(migration, /new\.publication_status = 'published'/);
  assert.match(migration, /Invalid merchant content publication transition/);
  assert.match(migration, /new\.submitted_at is distinct from old\.submitted_at/);
  assert.match(migration, /new\.published_at is distinct from old\.published_at/);
  assert.match(migration, /new\.publish_at is distinct from old\.publish_at/);
  assert.match(migration, /merchant_content_workflow_protection/);
  assert.doesNotMatch(migration, /old\.publication_status = 'draft'\s+and new\.publication_status = 'published'/);
});
