import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { CONTENT_IMAGE_BUCKET } from "@/lib/content/storage";
import { isContentCurrentlyActive } from "@/lib/content/publication";

export async function GET(request: Request) {
  const businessId = new URL(request.url).searchParams.get("businessId");
  if (!businessId) return NextResponse.json({ message: "Business ID is required." }, { status: 400 });
  const supabase = await getSupabaseServerClient();
  const { data, error } = await supabase
    .from("merchant_content")
    .select("id,business_id,content_type,title,body,starts_at,ends_at,published_at,image_path")
    .eq("business_id", businessId)
    .eq("publication_status", "published")
    .order("published_at", { ascending: false });
  if (error) return NextResponse.json({ message: "Unable to load published content." }, { status: 503 });
  const items = (data ?? [])
    .filter((item) => isContentCurrentlyActive(item.starts_at, item.ends_at))
    .map((item) => ({
      ...item,
      image_url: item.image_path
        ? supabase.storage.from(CONTENT_IMAGE_BUCKET).getPublicUrl(item.image_path).data.publicUrl
        : null,
    }));
  return NextResponse.json({ items });
}
