import assert from "node:assert/strict";
import test from "node:test";

import {
  canApproveMenuItem,
  canPublishMenuItem,
  canSubmitMenuItem,
  getMenuItemApprovalUpdate,
  getMenuItemPublicationUpdate,
  getMenuItemSubmissionUpdate,
} from "../lib/menu-items/publication.ts";

test("only merchant managers can submit draft menu items", () => {
  for (const role of ["org_owner", "admin", "moderator", "branch_manager"]) {
    assert.equal(canSubmitMenuItem(role, "draft"), true);
  }

  for (const role of ["staff", "user", undefined]) {
    assert.equal(canSubmitMenuItem(role, "draft"), false);
  }
});

test("only draft menu items receive a pending review transition", () => {
  const submittedAt = "2026-10-06T14:37:00.000Z";

  assert.deepEqual(
    getMenuItemSubmissionUpdate("draft", submittedAt),
    {
      publication_status: "pending_review",
      submitted_at: submittedAt,
    },
  );
  assert.equal(getMenuItemSubmissionUpdate("pending_review", submittedAt), null);
  assert.equal(getMenuItemSubmissionUpdate("published", submittedAt), null);
});

test("only admin and moderator roles can approve pending menu items", () => {
  for (const role of ["admin", "moderator"]) {
    assert.equal(canApproveMenuItem(role, "pending_review"), true);
  }

  for (const role of ["org_owner", "branch_manager", "staff", undefined]) {
    assert.equal(canApproveMenuItem(role, "pending_review"), false);
  }
});

test("only pending review menu items receive an approved transition", () => {
  assert.deepEqual(getMenuItemApprovalUpdate("pending_review"), {
    publication_status: "approved",
  });
  assert.equal(getMenuItemApprovalUpdate("draft"), null);
  assert.equal(getMenuItemApprovalUpdate("approved"), null);
  assert.equal(getMenuItemApprovalUpdate("published"), null);
});

test("only admin and moderator roles can publish approved menu items", () => {
  for (const role of ["admin", "moderator"]) {
    assert.equal(canPublishMenuItem(role, "approved"), true);
  }

  for (const role of ["org_owner", "branch_manager", "staff", undefined]) {
    assert.equal(canPublishMenuItem(role, "approved"), false);
  }
});

test("only approved menu items receive a published transition", () => {
  const publishedAt = "2026-10-06T15:28:00.000Z";

  assert.deepEqual(
    getMenuItemPublicationUpdate("approved", publishedAt),
    {
      publication_status: "published",
      published_at: publishedAt,
    },
  );
  assert.equal(getMenuItemPublicationUpdate("draft", publishedAt), null);
  assert.equal(getMenuItemPublicationUpdate("pending_review", publishedAt), null);
  assert.equal(getMenuItemPublicationUpdate("published", publishedAt), null);
});
