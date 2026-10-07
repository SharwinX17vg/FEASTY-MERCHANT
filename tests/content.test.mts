import assert from "node:assert/strict";
import test from "node:test";

import {
  canApproveContent,
  canPublishContent,
  canSubmitContent,
  getContentApprovalUpdate,
  getContentPublicationUpdate,
  getContentRejectionUpdate,
  getContentSubmissionUpdate,
} from "../lib/content/publication.ts";
import { validateContent, validateRejectionReason } from "../lib/validation/content.ts";
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
  });
  assert.deepEqual(result.errors, {});
  assert.equal(result.values.title, "Weekend special");
  assert.equal(result.values.starts_at, null);
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
