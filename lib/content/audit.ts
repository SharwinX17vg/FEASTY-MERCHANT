import type { SupabaseClient } from "@supabase/supabase-js";

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

export type ContentAuditEntry = {
  action: ContentAuditAction;
  actor_id: string;
  business_id: string;
  content_id: string;
  details?: Record<string, unknown>;
  from_status?: string | null;
  to_status?: string | null;
};

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

export async function recordContentAudit(
  supabase: SupabaseClient,
  entry: ContentAuditEntry,
) {
  const { error } = await supabase.from("content_audit_log").insert({
    content_id: entry.content_id,
    business_id: entry.business_id,
    actor_id: entry.actor_id,
    action: entry.action,
    from_status: entry.from_status ?? null,
    to_status: entry.to_status ?? null,
    details: entry.details ?? {},
  });
  return error;
}
