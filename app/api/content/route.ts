import { NextResponse } from "next/server";

import { getSupabaseServerClient } from "@/lib/supabase/server";
import { getValidatedWorkspaceContext } from "@/lib/workspace/context";
import { validateContent } from "@/lib/validation/content";

const contentSelect = "id,business_id,content_type,title,body,starts_at,ends_at,publication_status,rejection_reason,submitted_at,published_at,created_by,created_at,updated_at";

export async function GET() {
  const result = await getValidatedWorkspaceContext();
  if ("error" in result) return NextResponse.json({ message: result.error }, { status: result.status });
  if (!result.data.businessId) return NextResponse.json({ items: [] });

  const supabase = await getSupabaseServerClient();
  const { data, error } = await supabase
    .from("merchant_content")
    .select(contentSelect)
    .eq("business_id", result.data.businessId)
    .order("created_at", { ascending: false });
  if (error) return NextResponse.json({ message: "Unable to load content." }, { status: 503 });
  return NextResponse.json({ items: data ?? [] });
}

export async function POST(request: Request) {
  const result = await getValidatedWorkspaceContext();
  if ("error" in result) return NextResponse.json({ message: result.error }, { status: result.status });
  if (!result.data.businessId || !result.data.canManageBusiness) {
    return NextResponse.json({ message: "You do not have permission to create content." }, { status: 403 });
  }

  const input = (await request.json()) as Record<string, unknown>;
  const validation = validateContent(input);
  if (Object.keys(validation.errors).length > 0) {
    return NextResponse.json({ errors: validation.errors, message: "Review the highlighted fields." }, { status: 400 });
  }

  const supabase = await getSupabaseServerClient();
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) return NextResponse.json({ message: "Sign in required." }, { status: 401 });
  const { data, error } = await supabase
    .from("merchant_content")
    .insert({ business_id: result.data.businessId, created_by: user.user.id, ...validation.values })
    .select(contentSelect)
    .single();
  if (error || !data) return NextResponse.json({ message: "Unable to save content." }, { status: 400 });
  return NextResponse.json({ item: data, message: "Content created as Draft." }, { status: 201 });
}
