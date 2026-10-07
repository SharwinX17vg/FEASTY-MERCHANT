import { NextResponse } from "next/server";

import { getSupabaseServerClient } from "@/lib/supabase/server";
import { getValidatedWorkspaceContext } from "@/lib/workspace/context";
import { validateContent } from "@/lib/validation/content";

type RouteContext = { params: Promise<{ contentId: string }> };

export async function PUT(request: Request, context: RouteContext) {
  const result = await getValidatedWorkspaceContext();
  if ("error" in result) return NextResponse.json({ message: result.error }, { status: result.status });
  if (!result.data.businessId || !result.data.canManageBusiness) {
    return NextResponse.json({ message: "You do not have permission to edit content." }, { status: 403 });
  }
  const { contentId } = await context.params;
  const supabase = await getSupabaseServerClient();
  const { data: item } = await supabase
    .from("merchant_content")
    .select("id,business_id,publication_status")
    .eq("id", contentId)
    .eq("business_id", result.data.businessId)
    .maybeSingle();
  if (!item) return NextResponse.json({ message: "Content not found." }, { status: 404 });
  if (!["draft", "rejected"].includes(item.publication_status)) {
    return NextResponse.json({ message: "Only draft or rejected content can be edited." }, { status: 409 });
  }
  const validation = validateContent((await request.json()) as Record<string, unknown>);
  if (Object.keys(validation.errors).length > 0) {
    return NextResponse.json({ errors: validation.errors, message: "Review the highlighted fields." }, { status: 400 });
  }
  const { data, error } = await supabase
    .from("merchant_content")
    .update(validation.values)
    .eq("id", contentId)
    .eq("business_id", result.data.businessId)
    .select("*")
    .single();
  if (error || !data) return NextResponse.json({ message: "Unable to update content." }, { status: 400 });
  return NextResponse.json({ item: data, message: "Content updated." });
}
