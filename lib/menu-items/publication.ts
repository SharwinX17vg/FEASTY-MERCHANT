const merchantManagerRoles = new Set([
  "org_owner",
  "admin",
  "moderator",
  "branch_manager",
]);

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
