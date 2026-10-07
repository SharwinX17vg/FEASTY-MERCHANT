import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const businessId = new URL(request.url).searchParams.get("businessId");
  if (!businessId) return NextResponse.json({ message: "Business ID is required." }, { status: 400 });
  const supabase = await getSupabaseServerClient();
  const { data, error } = await supabase
    .from("merchant_content")
    .select("id,business_id,content_type,title,body,starts_at,ends_at,published_at")
    .eq("business_id", businessId)
    .eq("publication_status", "published")
    .order("published_at", { ascending: false });
  if (error) return NextResponse.json({ message: "Unable to load published content." }, { status: 503 });
  return NextResponse.json({ items: data ?? [] });
}
