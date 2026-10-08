import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { getValidatedWorkspaceContext } from "@/lib/workspace/context";
import { canSubmitContent, getContentSubmissionUpdate } from "@/lib/content/publication";
import { recordContentAudit } from "@/lib/content/audit";

type RouteContext = { params: Promise<{ contentId: string }> };

export async function POST(_request: Request, context: RouteContext) {
  const result = await getValidatedWorkspaceContext();
  if ("error" in result) return NextResponse.json({ message: result.error }, { status: result.status });
  const { contentId } = await context.params;
  const supabase = await getSupabaseServerClient();
  const { data: item } = await supabase.from("merchant_content").select("id,business_id,publication_status").eq("id", contentId).eq("business_id", result.data.businessId).maybeSingle();
  if (!item) return NextResponse.json({ message: "Content not found." }, { status: 404 });
  if (!canSubmitContent(result.data.role, item.publication_status)) return NextResponse.json({ message: "Only draft content can be submitted for review." }, { status: 409 });
  const changes = getContentSubmissionUpdate(item.publication_status, new Date().toISOString());
  if (!changes) return NextResponse.json({ message: "Only draft content can be submitted for review." }, { status: 409 });
  const { data, error } = await supabase.from("merchant_content").update(changes).eq("id", contentId).select("*").single();
  if (error || !data) return NextResponse.json({ message: "Unable to submit content for review." }, { status: 400 });
  const auditError = await recordContentAudit(supabase, {
    action: item.publication_status === "rejected" ? "resubmit" : "submit",
    actor_id: result.data.user.id,
    business_id: result.data.businessId!,
    content_id: contentId,
    from_status: item.publication_status,
    to_status: data.publication_status,
  });
  if (auditError) return NextResponse.json({ message: "Content was submitted, but audit history could not be recorded." }, { status: 503 });
  return NextResponse.json({ item: data, message: "Content submitted for review." });
}
