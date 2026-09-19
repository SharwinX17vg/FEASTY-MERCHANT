import { NextResponse } from "next/server";

import { getSupabaseServerClient } from "@/lib/supabase/server";

export async function POST() {
  try {
    const supabase = await getSupabaseServerClient();
    const { data: authData } = await supabase.auth.getUser();
    if (!authData.user) return NextResponse.json({ message: "Sign in required." }, { status: 401 });

    const { data: membership } = await supabase
      .from("organization_members")
      .select("organization_id")
      .eq("user_id", authData.user.id)
      .eq("status", "active")
      .maybeSingle();
    if (!membership) return NextResponse.json({ message: "Complete business details first." }, { status: 400 });

    const { data: business } = await supabase
      .from("businesses")
      .select("id")
      .eq("organization_id", membership.organization_id)
      .maybeSingle();
    if (!business) return NextResponse.json({ message: "Complete business details first." }, { status: 400 });

    const { data: branch } = await supabase
      .from("branches")
      .select("id")
      .eq("business_id", business.id)
      .maybeSingle();
    if (!branch) return NextResponse.json({ message: "Complete branch details first." }, { status: 400 });

    const existing = await supabase
      .from("verification_requests")
      .select("id,status")
      .eq("business_id", business.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (existing.error) return NextResponse.json({ message: "Unable to check verification status." }, { status: 400 });
    if (existing.data) return NextResponse.json(existing.data);

    const request = await supabase
      .from("verification_requests")
      .insert({
        organization_id: membership.organization_id,
        business_id: business.id,
        requester_id: authData.user.id,
        status: "submitted",
        submitted_at: new Date().toISOString(),
      })
      .select("id,status")
      .single();
    if (request.error) return NextResponse.json({ message: "Unable to submit verification." }, { status: 400 });

    return NextResponse.json(request.data);
  } catch {
    return NextResponse.json({ message: "Unable to submit verification." }, { status: 503 });
  }
}
