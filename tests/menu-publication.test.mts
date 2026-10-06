import assert from "node:assert/strict";
import test from "node:test";

import {
  canSubmitMenuItem,
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
