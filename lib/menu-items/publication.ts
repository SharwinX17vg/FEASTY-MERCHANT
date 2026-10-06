const merchantManagerRoles = new Set([
  "org_owner",
  "admin",
  "moderator",
  "branch_manager",
]);
const menuReviewRoles = new Set(["admin", "moderator"]);
const publicationStatusLabels = {
  draft: "Draft",
  pending_review: "Pending Review",
  approved: "Approved",
  published: "Published",
} as const;

export type MenuPublicationStatus = keyof typeof publicationStatusLabels;

export function getMenuItemPublicationLabel(status: string | null | undefined) {
  return publicationStatusLabels[status as MenuPublicationStatus] ?? "Draft";
}

export function canSubmitMenuItem(
  role: string | null | undefined,
  publicationStatus: string | null | undefined,
) {
  return merchantManagerRoles.has(role ?? "") && publicationStatus === "draft";
}

export function getMenuItemSubmissionUpdate(
  publicationStatus: string | null | undefined,
  submittedAt: string,
) {
  if (publicationStatus !== "draft") return null;

  return {
    publication_status: "pending_review" as const,
    submitted_at: submittedAt,
  };
}

export function canApproveMenuItem(
  role: string | null | undefined,
  publicationStatus: string | null | undefined,
) {
  return menuReviewRoles.has(role ?? "") && publicationStatus === "pending_review";
}

export function getMenuItemApprovalUpdate(
  publicationStatus: string | null | undefined,
) {
  if (publicationStatus !== "pending_review") return null;

  return {
    publication_status: "approved" as const,
  };
}

export function canPublishMenuItem(
  role: string | null | undefined,
  publicationStatus: string | null | undefined,
) {
  return menuReviewRoles.has(role ?? "") && publicationStatus === "approved";
}

export function getMenuItemPublicationUpdate(
  publicationStatus: string | null | undefined,
  publishedAt: string,
) {
  if (publicationStatus !== "approved") return null;

  return {
    publication_status: "published" as const,
    published_at: publishedAt,
  };
}
