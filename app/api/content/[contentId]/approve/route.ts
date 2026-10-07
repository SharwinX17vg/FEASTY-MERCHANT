import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { getValidatedWorkspaceContext } from "@/lib/workspace/context";
import { canReviewContent, getContentApprovalUpdate } from "@/lib/content/publication";

type RouteContext = { params: Promise<{ contentId: string }> };

export async function POST(_request: Request, context: RouteContext) {
  const result = await getValidatedWorkspaceContext();
  if ("error" in result) return NextResponse.json({ message: result.error }, { status: result.status });
  const { contentId } = await context.params;
  const supabase = await getSupabaseServerClient();
  const { data: item } = await supabase.from("merchant_content").select("id,business_id,publication_status").eq("id", contentId).eq("business_id", result.data.businessId).maybeSingle();
  if (!item) return NextResponse.json({ message: "Content not found." }, { status: 404 });
  if (!canReviewContent(result.data.role, item.publication_status)) return NextResponse.json({ message: "Only content pending review can be approved." }, { status: 409 });
  const changes = getContentApprovalUpdate(item.publication_status);
  if (!changes) return NextResponse.json({ message: "Only content pending review can be approved." }, { status: 409 });
  const { data, error } = await supabase.from("merchant_content").update(changes).eq("id", contentId).select("*").single();
  if (error || !data) return NextResponse.json({ message: "Unable to approve content." }, { status: 400 });
  return NextResponse.json({ item: data, message: "Content approved." });
}
