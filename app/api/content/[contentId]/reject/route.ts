import { NextResponse } from "next/server";

import { canReviewContent, getContentRejectionUpdate } from "@/lib/content/publication";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { getValidatedWorkspaceContext } from "@/lib/workspace/context";
import { validateRejectionReason } from "@/lib/validation/content";
import { recordContentAudit } from "@/lib/content/audit";

type RouteContext = { params: Promise<{ contentId: string }> };

export async function POST(request: Request, context: RouteContext) {
  const result = await getValidatedWorkspaceContext();
  if ("error" in result) return NextResponse.json({ message: result.error }, { status: result.status });
  const { contentId } = await context.params;
  const input = (await request.json()) as { reason?: unknown };
  const validation = validateRejectionReason(input.reason);
  if ("error" in validation) return NextResponse.json({ message: validation.error }, { status: 400 });
  const supabase = await getSupabaseServerClient();
  const { data: item } = await supabase
    .from("merchant_content")
    .select("id,business_id,publication_status")
    .eq("id", contentId)
    .eq("business_id", result.data.businessId)
    .maybeSingle();
  if (!item) return NextResponse.json({ message: "Content not found." }, { status: 404 });
  if (!canReviewContent(result.data.role, item.publication_status)) {
    return NextResponse.json({ message: "Only content pending review can be rejected." }, { status: 409 });
  }
  const changes = getContentRejectionUpdate(item.publication_status, validation.reason);
  if (!changes) return NextResponse.json({ message: "Only content pending review can be rejected." }, { status: 409 });
  const { data, error } = await supabase.from("merchant_content").update(changes).eq("id", contentId).select("*").single();
  if (error || !data) return NextResponse.json({ message: "Unable to reject content." }, { status: 400 });
  const auditError = await recordContentAudit(supabase, {
    action: "reject",
    actor_id: result.data.user.id,
    business_id: result.data.businessId!,
    content_id: contentId,
    from_status: item.publication_status,
    to_status: data.publication_status,
  });
  if (auditError) return NextResponse.json({ message: "Content was rejected, but audit history could not be recorded." }, { status: 503 });
  return NextResponse.json({ item: data, message: "Content rejected." });
}
