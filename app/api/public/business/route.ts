import { NextResponse } from "next/server";

import { getSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const businessId = new URL(request.url).searchParams.get("businessId");
  if (!businessId) return NextResponse.json({ message: "Business ID is required." }, { status: 400 });

  const supabase = await getSupabaseServerClient();
  const { data, error } = await supabase
    .from("businesses")
    .select("id,name,code,category,description,website_url")
    .eq("id", businessId)
    .eq("status", "approved")
    .maybeSingle();
  if (error) return NextResponse.json({ message: "Unable to load business." }, { status: 503 });
  if (!data) return NextResponse.json({ message: "Business not found." }, { status: 404 });
  return NextResponse.json({ business: data });
}
