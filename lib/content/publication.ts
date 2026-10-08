const managerRoles = new Set(["org_owner", "admin", "moderator", "branch_manager"]);
const reviewerRoles = new Set(["admin", "moderator"]);
const publicationStatusLabels = {
  draft: "Draft",
  pending_review: "Pending Review",
  approved: "Approved",
  published: "Published",
  rejected: "Rejected",
} as const;

export function getContentPublicationLabel(status: string | null | undefined, publishAt?: string | null, now = new Date()) {
  if (status === "published" && publishAt && Date.parse(publishAt) > now.getTime()) return "Scheduled";
  return publicationStatusLabels[status as keyof typeof publicationStatusLabels] ?? "Draft";
}

export function isContentCurrentlyActive(
  startsAt: string | null | undefined,
  endsAt: string | null | undefined,
  now = new Date(),
) {
  const nowTime = now.getTime();
  const startsTime = startsAt ? Date.parse(startsAt) : null;
  const endsTime = endsAt ? Date.parse(endsAt) : null;
  return (
    (startsTime === null || (!Number.isNaN(startsTime) && startsTime <= nowTime)) &&
    (endsTime === null || (!Number.isNaN(endsTime) && endsTime > nowTime))
  );
}

export function isContentPubliclyAvailable(
  publicationStatus: string | null | undefined,
  publishAt: string | null | undefined,
  startsAt: string | null | undefined,
  endsAt: string | null | undefined,
  now = new Date(),
) {
  const publishTime = publishAt ? Date.parse(publishAt) : null;
  return (
    publicationStatus === "published" &&
    (publishTime === null || (!Number.isNaN(publishTime) && publishTime <= now.getTime())) &&
    isContentCurrentlyActive(startsAt, endsAt, now)
  );
}

export function canSubmitContent(role: string | null | undefined, status: string | null | undefined) {
  return managerRoles.has(role ?? "") && ["draft", "rejected"].includes(status ?? "");
}

export function canReviewContent(role: string | null | undefined, status: string | null | undefined) {
  return reviewerRoles.has(role ?? "") && status === "pending_review";
}

export const canApproveContent = canReviewContent;

export function canPublishContent(role: string | null | undefined, status: string | null | undefined) {
  return reviewerRoles.has(role ?? "") && status === "approved";
}

export function getContentSubmissionUpdate(status: string | null | undefined, submittedAt: string) {
  return ["draft", "rejected"].includes(status ?? "")
    ? { publication_status: "pending_review" as const, submitted_at: submittedAt, rejection_reason: null }
    : null;
}

export function getContentRejectionUpdate(status: string | null | undefined, reason: string) {
  return status === "pending_review"
    ? { publication_status: "rejected" as const, rejection_reason: reason }
    : null;
}

export function getContentApprovalUpdate(status: string | null | undefined) {
  return status === "pending_review" ? { publication_status: "approved" as const } : null;
}

export function getContentPublicationUpdate(status: string | null | undefined, publishedAt: string) {
  return status === "approved"
    ? { publication_status: "published" as const, published_at: publishedAt }
    : null;
}
