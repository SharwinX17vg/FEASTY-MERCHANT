import { NextResponse } from "next/server";

import { getSupabaseServerClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const input = (await request.json()) as {
      category?: string;
      email?: string;
      name?: string;
      phone?: string;
    };
    const name = String(input.name ?? "").trim();
    const category = String(input.category ?? "").trim();
    if (name.length < 2 || category.length < 2) {
      return NextResponse.json({ message: "Business name and category are required." }, { status: 400 });
    }

    const supabase = await getSupabaseServerClient();
    const { data: authData } = await supabase.auth.getUser();
    if (!authData.user) return NextResponse.json({ message: "Sign in required." }, { status: 401 });

    const { data: membership } = await supabase
      .from("organization_members")
      .select("organization_id")
      .eq("user_id", authData.user.id)
      .eq("status", "active")
      .maybeSingle();

    let organizationId = membership?.organization_id;
    if (!organizationId) {
      const organization = await supabase
        .from("organizations")
        .insert({ name, email: input.email ?? authData.user.email, phone: input.phone, created_by: authData.user.id })
        .select("id")
        .single();
      if (organization.error) return NextResponse.json({ message: "Unable to create your organization." }, { status: 400 });
      organizationId = organization.data.id;
      const member = await supabase.from("organization_members").insert({
        organization_id: organizationId,
        user_id: authData.user.id,
        role: "owner",
        joined_at: new Date().toISOString(),
      });
      if (member.error) return NextResponse.json({ message: "Unable to save organization membership." }, { status: 400 });
    }

    const existing = await supabase.from("businesses").select("id").eq("organization_id", organizationId).maybeSingle();
    if (existing.error) return NextResponse.json({ message: "Unable to check existing business records." }, { status: 400 });
    if (existing.data) return NextResponse.json({ id: existing.data.id });

    const business = await supabase
      .from("businesses")
      .insert({ organization_id: organizationId, name, category, email: input.email, phone: input.phone, created_by: authData.user.id })
      .select("id")
      .single();
    if (business.error) return NextResponse.json({ message: "Unable to save your business." }, { status: 400 });
    return NextResponse.json({ id: business.data.id });
  } catch {
    return NextResponse.json({ message: "Unable to save onboarding details." }, { status: 503 });
  }
}
