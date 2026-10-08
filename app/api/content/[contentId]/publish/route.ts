import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { getValidatedWorkspaceContext } from "@/lib/workspace/context";
import { canPublishContent, getContentPublicationUpdate } from "@/lib/content/publication";

type RouteContext = { params: Promise<{ contentId: string }> };

export async function POST(_request: Request, context: RouteContext) {
  const result = await getValidatedWorkspaceContext();
  if ("error" in result) return NextResponse.json({ message: result.error }, { status: result.status });
  const { contentId } = await context.params;
  const supabase = await getSupabaseServerClient();
  const { data: item } = await supabase.from("merchant_content").select("id,business_id,publication_status,publish_at").eq("id", contentId).eq("business_id", result.data.businessId).maybeSingle();
  if (!item) return NextResponse.json({ message: "Content not found." }, { status: 404 });
  if (!canPublishContent(result.data.role, item.publication_status)) return NextResponse.json({ message: "Only approved content can be published." }, { status: 409 });
  const changes = getContentPublicationUpdate(item.publication_status, new Date().toISOString());
  if (!changes) return NextResponse.json({ message: "Only approved content can be published." }, { status: 409 });
  const { data, error } = await supabase.from("merchant_content").update(changes).eq("id", contentId).select("*").single();
  if (error || !data) return NextResponse.json({ message: "Unable to publish content." }, { status: 400 });
  return NextResponse.json({ item: data, message: "Content published." });
}
