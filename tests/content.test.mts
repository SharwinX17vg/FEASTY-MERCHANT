import assert from "node:assert/strict";
import test from "node:test";

import {
  canApproveContent,
  canPublishContent,
  canSubmitContent,
  getContentApprovalUpdate,
  getContentPublicationUpdate,
  getContentSubmissionUpdate,
} from "../lib/content/publication.ts";
import { validateContent } from "../lib/validation/content.ts";

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
  });
  assert.deepEqual(getContentApprovalUpdate("pending_review"), { publication_status: "approved" });
  assert.deepEqual(getContentPublicationUpdate("approved", "2026-10-07T00:00:00.000Z"), {
    publication_status: "published",
    published_at: "2026-10-07T00:00:00.000Z",
  });
});
