const managerRoles = new Set(["org_owner", "admin", "moderator", "branch_manager"]);
const reviewerRoles = new Set(["admin", "moderator"]);

export function canSubmitContent(role: string | null | undefined, status: string | null | undefined) {
  return managerRoles.has(role ?? "") && status === "draft";
}

export function canReviewContent(role: string | null | undefined, status: string | null | undefined) {
  return reviewerRoles.has(role ?? "") && status === "pending_review";
}

export const canApproveContent = canReviewContent;

export function canPublishContent(role: string | null | undefined, status: string | null | undefined) {
  return reviewerRoles.has(role ?? "") && status === "approved";
}

export function getContentSubmissionUpdate(status: string | null | undefined, submittedAt: string) {
  return status === "draft" ? { publication_status: "pending_review" as const, submitted_at: submittedAt } : null;
}

export function getContentApprovalUpdate(status: string | null | undefined) {
  return status === "pending_review" ? { publication_status: "approved" as const } : null;
}

export function getContentPublicationUpdate(status: string | null | undefined, publishedAt: string) {
  return status === "approved"
    ? { publication_status: "published" as const, published_at: publishedAt }
    : null;
}
