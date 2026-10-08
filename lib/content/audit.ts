export const contentAuditActions = [
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
] as const;

export type ContentAuditAction = (typeof contentAuditActions)[number];

export function getContentEditAuditAction(
  previousPublishAt: string | null | undefined,
  nextPublishAt: string | null | undefined,
) {
  const previous = previousPublishAt ?? null;
  const next = nextPublishAt ?? null;
  if (previous === next) return "update" as const;
  if (!previous && next) return "schedule" as const;
  if (previous && !next) return "unschedule" as const;
  return "reschedule" as const;
}
